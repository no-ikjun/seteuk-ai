# Windows 설치 및 지원 안내

## 지원 환경

- Windows 10 또는 Windows 11
- 64비트 PC (`x64`)
- NSIS 설치 파일(`.exe`) 또는 Windows Installer(`.msi`)

현재 Windows on ARM과 32비트 Windows는 지원하지 않습니다. 시스템 종류는
`설정 → 시스템 → 정보 → 시스템 종류`에서 확인할 수 있습니다.

## 다운로드

정식 설치 파일은 프로젝트의
[GitHub Releases](https://github.com/no-ikjun/seteuk-ai/releases)에서
다운로드합니다.

- 일반 사용자는 이름이 `_x64-setup.exe`로 끝나는 설치 파일을 권장합니다.
- 학교나 기관에서 MSI 배포가 필요하면 이름이 `_x64_en-US.msi`로 끝나는 파일을
  사용할 수 있습니다.

릴리스에 함께 제공되는 `.sha256` 파일을 이용하면 다운로드한 파일이 손상되거나
변경되지 않았는지 확인할 수 있습니다. PowerShell에서 다음 명령을 실행합니다.

```powershell
Get-FileHash ".\다운로드한-설치파일.exe" -Algorithm SHA256
```

출력된 값이 해당 `.sha256` 파일의 값과 같아야 합니다.

## 설치

1. 다운로드한 `.exe` 또는 `.msi` 설치 파일을 실행합니다.
2. 설치 화면의 안내에 따라 세특척척을 설치합니다.
3. 시작 메뉴 또는 바탕 화면에서 `Seteuk Cheokcheok`를 실행합니다.
4. 앱이 요청하면 본인의 OpenAI API Key를 입력합니다.

현재 Windows 설치 파일에는 Authenticode 코드 서명이 적용되지 않아 Windows
SmartScreen이 게시자를 확인할 수 없다는 경고를 표시할 수 있습니다. 반드시 공식
GitHub Releases에서 받은 파일인지와 SHA-256 체크섬을 확인하고, 학교나 기관에서
관리하는 PC라면 담당 관리자의 보안 정책을 따르세요.

앱 실행에 필요한 Microsoft Edge WebView2 Runtime이 없는 환경에서는 Microsoft의
공식 WebView2 설치가 추가로 필요할 수 있습니다. Windows 10과 Windows 11의 최신
업데이트 환경에는 일반적으로 포함되어 있습니다.

## 업데이트

새 버전은 GitHub Releases에서 새로운 설치 파일을 내려받아 설치합니다. 앱을
종료한 뒤 설치 파일을 실행하면 기존 설치를 업데이트할 수 있습니다.

현재 앱은 API Key나 작업 중인 학생 데이터를 파일에 저장하지 않으므로 업데이트
전에 필요한 생성 결과를 엑셀로 내보내세요.

## 삭제

`설정 → 앱 → 설치된 앱`에서 `Seteuk Cheokcheok`를 찾아 제거합니다. 앱은 별도의 계정이나
자체 서버 저장소를 만들지 않습니다.

## 문제가 발생할 때

### 설치 파일이 실행되지 않는 경우

Windows 10/11용 x64 설치 파일인지, 공식 GitHub Releases에서 받았는지, 체크섬이
일치하는지 확인하세요. 학교나 기관의 보안 정책으로 실행이 차단된 경우 담당
관리자의 승인이 필요할 수 있습니다.

### 앱 창이 열리지 않거나 빈 화면이 표시되는 경우

Windows Update를 적용하고 Microsoft Edge WebView2 Runtime이 설치되어 있는지
확인한 뒤 다시 실행하세요.

### API Key 또는 생성 요청 오류가 발생하는 경우

OpenAI API Key의 유효성, API 사용 권한과 결제 한도, 인터넷 연결을 확인하세요.
일시적인 네트워크 또는 속도 제한 오류는 앱에서 제한적으로 다시 시도할 수
있습니다.

해결되지 않는 문제는 앱 버전, Windows 버전, 시스템 종류와 오류 메시지를 함께
[GitHub Issues](https://github.com/no-ikjun/seteuk-ai/issues)에 남겨 주세요. API
Key와 학생 정보 같은 민감한 정보는 첨부하지 마세요.

데이터 처리 범위는 [개인정보 처리 안내](./PRIVACY.md)를 참고하세요.
