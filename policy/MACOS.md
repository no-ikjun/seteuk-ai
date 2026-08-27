# macOS 설치 및 지원 안내

## 지원 환경

- macOS 12 Monterey 이상
- Apple Silicon Mac (`M1` 이상, `arm64`)
- `.dmg` 설치 이미지

현재 Intel Mac은 지원하지 않습니다. Mac의 칩은 화면 왼쪽 위의 Apple 메뉴에서
`이 Mac에 관하여`를 선택해 확인할 수 있습니다.

## 다운로드

정식 설치 파일은 프로젝트의
[GitHub Releases](https://github.com/no-ikjun/seteuk-ai/releases)에서
다운로드합니다.

파일 이름은 다음과 같은 형식입니다.

```text
세특척척_<버전>_aarch64.dmg
```

릴리스에 함께 제공되는 `.sha256` 파일을 이용하면 다운로드한 DMG가 손상되거나
변경되지 않았는지 확인할 수 있습니다.

```bash
shasum -a 256 "세특척척_<버전>_aarch64.dmg"
```

출력된 값이 `.sha256` 파일의 값과 같아야 합니다.

## 설치

1. 다운로드한 `세특척척_<버전>_aarch64.dmg`를 엽니다.
2. `세특척척.app`을 `Applications` 폴더로 드래그합니다.
3. 응용 프로그램 폴더에서 `세특척척`를 실행합니다.
4. 앱이 요청하면 본인의 OpenAI API Key를 입력합니다.

정식 릴리스는 Apple Developer ID로 서명하고 Apple 공증을 거칩니다. macOS의
보안 경고를 임의로 우회하거나 출처가 다른 설치 파일을 사용하지 마세요.

## 업데이트

새 버전은 GitHub Releases에서 새로운 DMG를 내려받아 설치합니다. 기존 앱을
종료한 뒤 새 `세특척척.app`을 Applications 폴더의 기존 앱 위에 복사하면
됩니다.

0.3.x 이하를 쓰던 경우에는 앱 이름이 `Seteuk Cheokcheok`에서 `세특척척`으로
바뀌었습니다. 새 앱을 설치한 뒤 응용 프로그램 폴더에 남아 있는 이전
`Seteuk Cheokcheok.app`을 휴지통으로 옮기세요. 두 앱은 같은 앱이며 설정을
공유하지 않습니다.

현재 앱은 API Key나 작업 중인 학생 데이터를 파일에 저장하지 않으므로 업데이트
전에 필요한 생성 결과를 엑셀로 내보내세요.

## 삭제

응용 프로그램 폴더의 `세특척척.app`을 휴지통으로 이동합니다. 앱은 별도의
계정이나 자체 서버 저장소를 만들지 않습니다.

## 문제가 발생할 때

### 앱을 열 수 없거나 개발자를 확인할 수 없다는 경고가 표시되는 경우

설치 파일이 공식 GitHub Releases에서 받은 파일인지, Apple Silicon용 DMG인지,
체크섬이 일치하는지 확인한 뒤 다시 설치하세요. 보안 설정을 낮추거나 격리 속성을
강제로 제거하는 방식은 권장하지 않습니다.

### Intel Mac에서 실행되지 않는 경우

현재 배포 파일은 Apple Silicon 전용입니다. Intel Mac에서는 실행할 수 없습니다.

### API Key 또는 생성 요청 오류가 발생하는 경우

OpenAI API Key의 유효성, API 사용 권한과 결제 한도, 인터넷 연결을 확인하세요.
일시적인 네트워크 또는 속도 제한 오류는 앱에서 제한적으로 다시 시도할 수
있습니다.

해결되지 않는 문제는 앱 버전, macOS 버전, Mac 칩 종류와 오류 메시지를 함께
[GitHub Issues](https://github.com/no-ikjun/seteuk-ai/issues)에 남겨 주세요. API
Key, 학생 정보, 인증서와 같은 민감한 정보는 첨부하지 마세요.

데이터 처리 범위는 [개인정보 처리 안내](./PRIVACY.md)를 참고하세요.
