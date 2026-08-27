//! DMG에서 실행된 경우 Applications 폴더로 옮기도록 안내한다.
//!
//! macOS에서 DMG를 열고 앱을 바로 실행하면 읽기 전용 볼륨 위에서 돌아간다.
//! 그 상태로는 자동 업데이트도, 볼륨을 꺼내는 것도 되지 않아 사용자가
//! 직접 Applications로 끌어다 놓아야 한다는 것을 모르면 계속 그렇게 쓴다.
//!
//! 흐름은 이렇다.
//!   1. 실행 파일이 `/Volumes/…` 아래의 마운트된 디스크 이미지 안인지 본다.
//!   2. 맞으면 옮길지 묻는다. 거절하면 아무것도 하지 않는다.
//!   3. 수락하면 `/Applications`로 복사하고, 복사본을 정리 인자와 함께 실행한
//!      뒤 현재 프로세스를 끝낸다.
//!   4. 새로 뜬 복사본이 볼륨을 꺼내고 `.dmg`를 휴지통으로 옮긴다.
//!
//! 볼륨을 꺼내는 일을 새 프로세스에 맡기는 이유는, 지금 프로세스가 그 볼륨
//! 위에서 돌고 있어 스스로는 꺼낼 수 없기 때문이다.
//!
//! 실패하면 어느 단계에서든 조용히 포기한다. 설치 편의 기능이 앱 실행을
//! 막아서는 안 된다.

#![cfg(target_os = "macos")]

use std::path::{Path, PathBuf};
use std::process::Command;

use tauri::AppHandle;
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};

/// 복사본이 원본 볼륨을 정리할 때 쓰는 인자.
const CLEANUP_FLAG: &str = "--cleanup-install";
const APPLICATIONS_DIR: &str = "/Applications";

/// `<...>/X.app/Contents/MacOS/<bin>` 에서 `<...>/X.app` 을 얻는다.
fn bundle_path_from_exe(exe: &Path) -> Option<PathBuf> {
    let bundle = exe.parent()?.parent()?.parent()?;
    if bundle.extension()?.eq_ignore_ascii_case("app") {
        Some(bundle.to_path_buf())
    } else {
        None
    }
}

/// `/Volumes/<이름>/…` 에서 `/Volumes/<이름>` 을 얻는다.
fn volume_root(path: &Path) -> Option<PathBuf> {
    let mut parts = path.components();
    if parts.next()? != std::path::Component::RootDir {
        return None;
    }
    if parts.next()?.as_os_str() != "Volumes" {
        return None;
    }
    let name = parts.next()?;
    Some(Path::new("/Volumes").join(name))
}

/// `hdiutil info` 출력에서 해당 볼륨을 제공하는 이미지 파일 경로를 찾는다.
///
/// 출력은 이미지마다 한 블록이고, 블록 안에 `image-path : <경로>` 줄과
/// 마운트 지점을 나열한 줄들이 섞여 있다. 볼륨 이름이 나온 블록의
/// image-path가 우리가 찾는 `.dmg`다.
fn parse_image_path(hdiutil_output: &str, volume: &Path) -> Option<PathBuf> {
    let volume = volume.to_str()?;
    let mut image_path: Option<&str> = None;

    for line in hdiutil_output.lines() {
        if let Some(rest) = line.trim().strip_prefix("image-path") {
            // 새 블록이 시작됐다. 이전 블록의 값은 버린다.
            image_path = rest.trim_start().strip_prefix(':').map(str::trim);
            continue;
        }
        // 마운트 지점은 탭으로 구분된 마지막 칸에 온다.
        if line.split('\t').any(|field| field.trim() == volume) {
            return image_path.map(PathBuf::from);
        }
    }
    None
}

fn mounted_image_path(volume: &Path) -> Option<PathBuf> {
    let output = Command::new("/usr/bin/hdiutil").arg("info").output().ok()?;
    if !output.status.success() {
        return None;
    }
    parse_image_path(&String::from_utf8_lossy(&output.stdout), volume)
}

/// 겹치지 않는 휴지통 경로를 만든다. `이름.dmg`, `이름 2.dmg`, `이름 3.dmg` …
fn trash_destination(trash: &Path, file_name: &Path) -> PathBuf {
    let stem = file_name
        .file_stem()
        .unwrap_or_default()
        .to_string_lossy()
        .into_owned();
    let extension = file_name
        .extension()
        .map(|e| e.to_string_lossy().into_owned());
    let with_extension = |base: String| match &extension {
        Some(extension) => format!("{base}.{extension}"),
        None => base,
    };

    let mut candidate = trash.join(with_extension(stem.clone()));
    let mut index = 2;
    while candidate.exists() {
        candidate = trash.join(with_extension(format!("{stem} {index}")));
        index += 1;
    }
    candidate
}

/// 복사본에서 실행된다. 원본 볼륨을 꺼내고 `.dmg`를 휴지통으로 옮긴다.
pub fn run_pending_cleanup() {
    let args: Vec<String> = std::env::args().collect();
    let Some(index) = args.iter().position(|arg| arg == CLEANUP_FLAG) else {
        return;
    };
    let (Some(volume), Some(dmg)) = (args.get(index + 1), args.get(index + 2)) else {
        return;
    };

    // 앞선 프로세스가 완전히 끝나야 볼륨이 풀린다. 잠깐씩 기다리며 다시 시도한다.
    for attempt in 0..10 {
        std::thread::sleep(std::time::Duration::from_millis(300 * (attempt + 1)));
        let detached = Command::new("/usr/bin/hdiutil")
            .args(["detach", volume, "-quiet"])
            .status()
            .map(|status| status.success())
            .unwrap_or(false);
        if detached {
            break;
        }
    }

    let Some(home) = std::env::var_os("HOME") else {
        return;
    };
    let trash = Path::new(&home).join(".Trash");
    let dmg = Path::new(dmg);
    if !trash.is_dir() || !dmg.is_file() {
        return;
    }
    // 완전 삭제가 아니라 휴지통으로 옮긴다. 되돌릴 수 있어야 한다.
    let _ = std::fs::rename(dmg, trash_destination(&trash, dmg));
}

/// DMG에서 실행 중이면 Applications로 옮길지 묻는다.
///
/// 대화상자가 스레드를 막으므로 별도 스레드에서 돈다.
pub fn offer_move_to_applications(app: &AppHandle) {
    let Ok(exe) = std::env::current_exe() else {
        return;
    };
    let Some(bundle) = bundle_path_from_exe(&exe) else {
        return;
    };
    let Some(volume) = volume_root(&bundle) else {
        return;
    };
    // 볼륨을 제공하는 디스크 이미지를 찾지 못하면 DMG 실행이 아니다.
    let Some(dmg) = mounted_image_path(&volume) else {
        return;
    };

    let app = app.clone();
    std::thread::spawn(move || {
        let moved = app
            .dialog()
            .message(
                "지금은 디스크 이미지에서 실행 중입니다.\n\
                 Applications 폴더로 옮기면 다음부터 Launchpad에서 바로 열 수 있고,\n\
                 내려받은 설치 파일은 휴지통으로 옮겨집니다.",
            )
            .title("Applications 폴더로 옮길까요?")
            .kind(MessageDialogKind::Info)
            .buttons(MessageDialogButtons::OkCancelCustom(
                "옮기기".to_string(),
                "나중에".to_string(),
            ))
            .blocking_show();
        if !moved {
            return;
        }

        let Some(name) = bundle.file_name() else {
            return;
        };
        let target = Path::new(APPLICATIONS_DIR).join(name);

        if target.exists() {
            let replace = app
                .dialog()
                .message("Applications 폴더에 같은 이름의 앱이 이미 있습니다. 바꿀까요?")
                .title("이미 설치되어 있습니다")
                .kind(MessageDialogKind::Warning)
                .buttons(MessageDialogButtons::OkCancelCustom(
                    "바꾸기".to_string(),
                    "취소".to_string(),
                ))
                .blocking_show();
            if !replace {
                return;
            }
        }

        // ditto는 확장 속성과 코드 서명을 보존한다. 일반 복사는 서명을 깨뜨린다.
        let copied = Command::new("/usr/bin/ditto")
            .arg("--rsrc")
            .arg("--extattr")
            .arg(&bundle)
            .arg(&target)
            .status()
            .map(|status| status.success())
            .unwrap_or(false);
        if !copied {
            app.dialog()
                .message(
                    "Applications 폴더로 옮기지 못했습니다. Finder에서 직접 끌어다 놓아주세요.",
                )
                .title("옮기지 못했습니다")
                .kind(MessageDialogKind::Error)
                .blocking_show();
            return;
        }

        // 볼륨 정리는 복사본에 맡긴다. 지금 프로세스는 그 볼륨 위에서 돈다.
        let launched = Command::new("/usr/bin/open")
            .arg("-n")
            .arg(&target)
            .arg("--args")
            .arg(CLEANUP_FLAG)
            .arg(&volume)
            .arg(&dmg)
            .status()
            .map(|status| status.success())
            .unwrap_or(false);
        if launched {
            app.exit(0);
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn 실행_파일_경로에서_앱_번들을_찾는다() {
        let exe = Path::new(
            "/Volumes/세특척척/세특척척.app/Contents/MacOS/seteuk-cheokcheok",
        );
        assert_eq!(
            bundle_path_from_exe(exe),
            Some(PathBuf::from(
                "/Volumes/세특척척/세특척척.app"
            )),
        );
        // .app 안이 아니면 대상이 아니다.
        assert_eq!(bundle_path_from_exe(Path::new("/usr/local/bin/tool")), None);
    }

    #[test]
    fn 볼륨_루트만_인정한다() {
        assert_eq!(
            volume_root(Path::new(
                "/Volumes/세특척척/세특척척.app"
            )),
            Some(PathBuf::from("/Volumes/세특척척")),
        );
        // Applications에서 실행 중이면 옮길 이유가 없다.
        assert_eq!(
            volume_root(Path::new("/Applications/세특척척.app")),
            None
        );
    }

    #[test]
    fn hdiutil_출력에서_해당_볼륨의_이미지_경로를_고른다() {
        let output = "\
================================================
image-path      : /Users/me/Downloads/Other.dmg
image-alias     : /Users/me/Downloads/Other.dmg
/dev/disk3\tGUID_partition_scheme\t
/dev/disk3s1\t48465300-0000-11AA-AA11-00306543ECAC\t/Volumes/Other
================================================
image-path      : /Users/me/Downloads/세특척척_0.3.1_aarch64.dmg
image-alias     : /Users/me/Downloads/세특척척_0.3.1_aarch64.dmg
/dev/disk4\tGUID_partition_scheme\t
/dev/disk4s1\t48465300-0000-11AA-AA11-00306543ECAC\t/Volumes/세특척척
";
        assert_eq!(
            parse_image_path(output, Path::new("/Volumes/세특척척")),
            Some(PathBuf::from(
                "/Users/me/Downloads/세특척척_0.3.1_aarch64.dmg"
            )),
        );
        // 디스크 이미지가 아닌 볼륨은 찾지 못한다.
        assert_eq!(
            parse_image_path(output, Path::new("/Volumes/Macintosh HD")),
            None
        );
    }

    #[test]
    fn 휴지통에서_이름이_겹치면_번호를_붙인다() {
        let temp = std::env::temp_dir().join("seteuk-trash-test");
        let _ = std::fs::remove_dir_all(&temp);
        std::fs::create_dir_all(&temp).unwrap();

        let name = Path::new("Seteuk.dmg");
        assert_eq!(trash_destination(&temp, name), temp.join("Seteuk.dmg"));

        std::fs::write(temp.join("Seteuk.dmg"), b"x").unwrap();
        assert_eq!(trash_destination(&temp, name), temp.join("Seteuk 2.dmg"));

        std::fs::remove_dir_all(&temp).unwrap();
    }
}
