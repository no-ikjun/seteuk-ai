<div align="center">

# 세특척척 (Seteuk Cheokcheok)

**교사의 기록 업무를 돕는 AI 기반 세특 초안 작성 도구**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-149ECA.svg?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF.svg?logo=vite&logoColor=white)](https://vite.dev/)
[![Tauri](https://img.shields.io/badge/Tauri-2.9-24C8DB.svg?logo=tauri&logoColor=white)](https://tauri.app/)

</div>

## 소개

학생 활동 기록을 기반으로 교사가 검토할 교과 세부능력 및 특기사항(세특) 초안을 생성하는 Tauri 데스크톱 앱입니다.

세특은 학생의 배움과 성장을 가까이에서 지켜본 교사의 관찰과 전문적 판단으로 완성됩니다. 세특척척은 그 판단을 대신하지 않습니다. 반복적인 초안 작성의 부담을 덜고, 선생님이 학생 한 명 한 명의 성장과 교육적 의미를 살피는 데 더 집중할 수 있도록 돕는 것을 목표로 합니다.

## 이 프로젝트가 지향하는 것

- **교사의 전문성 존중**: 최종 판단과 표현의 주체는 언제나 교사입니다.
- **학생 기록에 충실한 초안**: 제공되지 않은 사실을 만들어내지 않도록 프롬프트에서 명시합니다.
- **검토 가능한 결과**: AI 결과를 완성본이 아닌 교사가 검토하고 다듬을 초안으로 제공합니다.
- **개인정보에 대한 투명성**: 로컬에서 처리되는 데이터와 OpenAI로 전송되는 데이터를 구분해 안내합니다.

## 주요 기능

- `.xlsx`, `.xls`, `.csv` 학생 활동 파일 불러오기
- 빈 입력 양식과 가상 학생 예시 엑셀 다운로드
- 학교급(초·중·고)과 기록 항목(세특, 창의적 체험활동, 행동특성 및 종합의견) 선택
- 기록 항목에 맞는 기본 문체 채우기
- 과목, 주제, 작성 형식, 예시 글 설정
- 나이스 Byte 기준 목표 분량과 항목별 한도 안내
- 품질·비용 수준을 비교해 고르는 OpenAI 모델 선택
- 학생 표시 컬럼과 AI에 전달할 활동 컬럼 선택
- 학생별 추가 키워드 입력
- 학생 검색, 상태 필터, 선택 생성 및 실패 학생 재시도
- 네트워크·속도 제한·서버 오류의 제한적 자동 재시도
- 생성 결과 직접 수정, 나이스 Byte 사용량 확인 및 복사
- 한도를 넘으면 내용을 유지한 채 분량만 맞추는 재요청
- 기재요령이 금지한 표현을 PC 안에서 검사해 확인할 자리 안내
- 수정한 최종 결과를 엑셀 파일로 내보내기

OpenAI Responses API를 사용합니다. 모델은 품질과 비용이 다른 세 가지 중에서 고르며, 각 모델의 품질·비용 수준을 함께 보여줍니다. 입력한 API Key의 계정에서 쓸 수 없는 모델은 목록에서 제외합니다. 생성된 내용은 초안이므로 교사가 사실관계와 표현을 검토한 뒤 사용해야 합니다.

## 기술 구성

- React 19, TypeScript, Vite
- Tauri 2, Rust
- OpenAI Responses API
- SheetJS `xlsx`

별도의 자체 웹 서버나 데이터베이스는 사용하지 않습니다. React UI가 Tauri command를 호출하고, Rust 백엔드가 OpenAI API에 요청합니다.

## 설치 및 실행

### 요구사항

- Node.js 20.19 이상 또는 22.12 이상
- 최신 안정 버전 Rust
- 플랫폼별 Tauri 개발 요구사항
- OpenAI API Key

```bash
npm install
npm run tauri:dev
```

`npm run dev`는 브라우저에서 UI만 확인하는 용도입니다. OpenAI 생성 기능은
Tauri command를 사용하므로 `npm run tauri:dev`로 실행해야 합니다.

프로덕션 앱 번들은 대상 운영체제에서 다음 명령으로 생성합니다.

```bash
# macOS
npm run tauri:build:macos

# Windows
npm run tauri:build:windows
```

현재 Windows 10/11 x64와 macOS 12 이상 Apple Silicon Mac을 지원합니다. 설치
방법과 플랫폼별 보안 안내는 [Windows 설치 및 지원 안내](./policy/WINDOWS.md)와
[macOS 설치 및 지원 안내](./policy/MACOS.md)를 참고하세요.

## 검증

```bash
npm run test
npm run lint
npm run build
cd src-tauri && cargo test && cargo check
```

## 사용 방법

1. 앱 시작 시 OpenAI API Key를 입력합니다.
2. 파일이 없다면 `빈 엑셀 양식 받기` 또는 `예시 엑셀 받기`로 시작합니다.
3. 작성한 학생 활동 기록 파일을 선택합니다.
4. 프로젝트 작성 조건 다섯 가지를 확인하거나 수정합니다.
5. 학생 표시 컬럼과 활동 컬럼을 확인합니다.
6. 필요하면 학생별 추가 키워드를 입력합니다.
7. 첫 전송 확인 후 현재 학생, 선택 학생 또는 결과가 없는 전체 학생의 초안을 생성합니다.
8. 실패한 학생은 원인을 확인한 뒤 해당 학생만 다시 생성할 수 있습니다.
9. 생성 결과를 검토·수정하고 복사하거나 `.xlsx`로 내보냅니다.

파일의 첫 번째 워크시트만 읽으며, 첫 행을 컬럼명으로 사용합니다.
다운로드한 양식에는 `학생활동`과 `작성안내` 시트가 포함됩니다. 예시 파일의 학생과 활동은 모두 테스트용 가상 데이터입니다.

## 데이터와 개인정보

API Key는 실행 중인 앱의 메모리에만 유지되며 파일로 저장되지 않습니다. 앱을 종료하면 다시 입력해야 합니다.

원본 엑셀 파일 자체는 별도 서버에 업로드하거나 앱 데이터로 저장하지 않습니다. 다만 세특을 생성할 때 다음 정보는 OpenAI API로 전송됩니다.

- 과목과 주제
- 목표 분량과 작성 형식
- 문체 참고용 예시 글
- 사용자가 선택한 활동 컬럼의 내용
- 교사 추가 키워드

학생 표시 컬럼은 기본적으로 전송하지 않습니다. 이름, 학번 등으로 추정되는 컬럼은 활동 컬럼에서 자동 제외되지만, 사용자가 직접 선택하면 해당 값도 전송될 수 있으므로 반드시 최종 활동 미리보기를 확인해야 합니다.

OpenAI 요청에는 응답 저장 비활성화 옵션인 `store: false`를 명시합니다. OpenAI 측의 별도 보안·오남용 모니터링 및 데이터 처리에는 사용하는 API 계정과 OpenAI 정책이 적용됩니다.

자세한 내용은 [개인정보 처리 안내](./policy/PRIVACY.md)를 참고하세요.

## 사용자 문서

- [Windows 설치 및 지원 안내](./policy/WINDOWS.md)
- [macOS 설치 및 지원 안내](./policy/MACOS.md)
- [개인정보 처리 안내](./policy/PRIVACY.md)
- [라이선스](./LICENSE)

## 사용 전 확인

- 생성 결과의 사실관계와 표현은 반드시 교사가 검토하고 수정해야 합니다.
- OpenAI API 사용량에 따라 비용이 발생할 수 있습니다.
- 학생 이름과 학번 등 불필요한 식별정보는 활동 컬럼에서 제외해야 합니다.
- 학교 또는 기관의 개인정보 처리 기준과 OpenAI API 이용 조건을 확인한 뒤 사용해야 합니다.

## 기여하기

교육 현장의 기록 업무를 더 안전하고 유용하게 개선하기 위한 제안과 기여를 환영합니다. 이슈 또는 Pull Request를 통해 버그, 문서 개선, 새로운 아이디어를 공유할 수 있습니다.

## 라이선스

[MIT License](./LICENSE)

---

<div align="center">

**학생의 성장을 기록하는 모든 선생님께 존경과 감사를 전합니다.**

Made with ❤️ and respect for teachers

</div>
