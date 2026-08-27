// macOS DMG를 만든다.
//
// Tauri의 DMG 번들러를 쓰지 않는 이유:
// Tauri는 CI 환경 변수가 있으면 bundle_dmg.sh에 --skip-jenkins를 붙이고,
// 그러면 창 배경과 아이콘 배치를 넣는 AppleScript 단계가 통째로 생략된다.
// 그 결과 릴리스 DMG에는 .DS_Store가 아예 없어 기본 모양으로 열린다.
// appdmg는 Finder를 거치지 않고 .DS_Store를 직접 써서 CI에서도 동일하게 동작한다.
//
// 창 크기와 아이콘 좌표, 배경 경로는 tauri.conf.json의 bundle.macOS.dmg를
// 그대로 읽는다. 설정이 두 곳으로 갈라지지 않게 하기 위해서다.
//
// 사용:
//   node scripts/make-dmg.mjs [--target <rust-triple>] [--identity <서명 ID>]

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/** Tauri가 산출물 이름에 쓰는 아키텍처 표기. */
function architectureSuffix(target) {
  if (target) {
    if (target.startsWith("aarch64")) return "aarch64";
    if (target.startsWith("x86_64")) return "x64";
    throw new Error(`지원하지 않는 target입니다: ${target}`);
  }
  return process.arch === "arm64" ? "aarch64" : "x64";
}

const target = argument("--target");
const identity = argument("--identity");

const config = readJson("src-tauri/tauri.conf.json");
const productName = config.productName;
const version = config.version;
const dmg = config.bundle?.macOS?.dmg ?? {};
if (!dmg.background) {
  throw new Error("tauri.conf.json에 bundle.macOS.dmg.background가 없습니다.");
}

const bundleRoot = target
  ? path.join("src-tauri/target", target, "release/bundle")
  : path.join("src-tauri/target/release/bundle");
const appPath = path.resolve(bundleRoot, "macos", `${productName}.app`);
if (!fs.existsSync(appPath)) {
  throw new Error(`앱 번들이 없습니다: ${appPath}\n먼저 tauri build --bundles app 을 실행하세요.`);
}

const dmgDir = path.resolve(bundleRoot, "dmg");
const dmgPath = path.join(
  dmgDir,
  `${productName}_${version}_${architectureSuffix(target)}.dmg`,
);
fs.mkdirSync(dmgDir, { recursive: true });
fs.rmSync(dmgPath, { force: true });

// appdmg는 spec의 상대 경로를 spec 파일 위치 기준으로 푼다.
// 경로를 모두 절대경로로 넣어 그 규칙에 기대지 않는다.
const spec = {
  title: productName,
  icon: path.resolve("src-tauri/icons/icon.icns"),
  background: path.resolve("src-tauri", dmg.background),
  window: {
    size: {
      width: dmg.windowSize?.width ?? 660,
      height: dmg.windowSize?.height ?? 400,
    },
  },
  "icon-size": 128,
  contents: [
    {
      x: dmg.appPosition?.x ?? 180,
      y: dmg.appPosition?.y ?? 170,
      type: "file",
      path: appPath,
    },
    {
      x: dmg.applicationFolderPosition?.x ?? 480,
      y: dmg.applicationFolderPosition?.y ?? 170,
      type: "link",
      path: "/Applications",
    },
  ],
};

const specPath = path.join(
  fs.mkdtempSync(path.join(os.tmpdir(), "seteuk-dmg-")),
  "spec.json",
);
fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));

// 이 저장소는 npm 워크스페이스라 appdmg가 루트 node_modules로 호이스팅된다.
// node_modules/.bin 경로를 직접 쓰면 위치에 따라 어긋나므로 패키지에서 푼다.
const require = createRequire(import.meta.url);
/* appdmg는 macOS 전용이라 optionalDependencies에 있다. npm은 다른 OS에서
   조용히 건너뛰므로, 없을 때 무슨 일이 벌어졌는지 알 수 있게 여기서 멈춘다. */
let appdmgPackagePath;
try {
  appdmgPackagePath = require.resolve("appdmg/package.json");
} catch {
  throw new Error(
    "appdmg를 찾을 수 없습니다. macOS에서 optional 의존성을 포함해 설치했는지 확인하세요. (npm ci)",
  );
}
const appdmgBin = path.join(
  path.dirname(appdmgPackagePath),
  require(appdmgPackagePath).bin,
);

execFileSync(process.execPath, [appdmgBin, specPath, dmgPath], {
  stdio: "inherit",
});

// Tauri가 DMG에 서명해 주던 자리를 대신한다. 공증 전에 서명되어 있어야 하고,
// 릴리스 워크플로가 codesign --verify로 이 서명을 확인한다.
if (identity) {
  execFileSync("codesign", ["--force", "--sign", identity, dmgPath], {
    stdio: "inherit",
  });
  console.log(`DMG 서명 완료: ${identity}`);
}

console.log(`DMG 생성 완료: ${dmgPath}`);
