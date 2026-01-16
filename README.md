# AI 세특 작성기 (Seteuk AI)

<div align="center">

**AI 기반 교과 세부능력 특기사항 작성 자동화 도구**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://react.dev/)
[![Tauri](https://img.shields.io/badge/Tauri-2.9-purple.svg)](https://tauri.app/)

</div>

## 📖 소개

교사가 학생들의 활동 기록을 바탕으로 **교과 세부능력 특기사항(세특)**을 자동으로 생성하는 데스크톱 애플리케이션입니다. OpenAI GPT-4o를 활용하여 각 학생의 실제 활동 기록을 기반으로 개인화된 세특을 작성합니다.

## ✨ 주요 기능

- 📊 **엑셀 파일 업로드**: `.xlsx`, `.xls`, `.csv` 지원
- ⚙️ **프로젝트 설정**: 과목, 주제, 분량, 형식, 예시 글 커스터마이징
- 🎯 **컬럼 매핑**: 학생 표시용/활동 텍스트 컬럼 자유롭게 선택
- 🚀 **일괄 생성**: 여러 학생의 세특을 한 번에 자동 생성
- 📤 **결과 내보내기**: 생성된 세특을 엑셀 파일로 저장
- 🔒 **로컬 실행**: 모든 데이터는 사용자 PC에서 처리, 원본 파일 미저장
- 🔐 **보안**: API Key는 Tauri Stronghold로 암호화 저장

## 🛠️ 기술 스택

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Tauri 2.9 (Rust)
- **AI**: OpenAI API (GPT-4o)
- **데이터 처리**: xlsx

## 📦 설치 및 실행

### 사전 요구사항

- Node.js (v18 이상)
- Rust (최신 안정 버전)
- [OpenAI API Key](https://platform.openai.com/api-keys)

### 빌드

```bash
# 저장소 클론
git clone https://github.com/no-ikjun/seteuk-ai.git
cd seteuk-ai

# 의존성 설치
npm install

# 개발 모드 실행
npm run tauri:dev

# 프로덕션 빌드
npm run tauri:build
```

## 🚀 사용 방법

1. **API Key 입력**: 앱 시작 시 OpenAI API Key 입력 (암호화 저장)
2. **엑셀 업로드**: 학생 활동 기록 파일 업로드
3. **프로젝트 설정**: 과목, 주제, 분량, 형식, 예시 글 입력
4. **컬럼 매핑**: 학생 표시용/활동 텍스트 컬럼 선택
5. **세특 생성**: 개별 생성 또는 일괄 생성
6. **결과 내보내기**: 엑셀 파일로 저장

## 🔒 보안 및 프라이버시

- 모든 데이터는 로컬에서 처리되며 서버로 전송되지 않음
- API Key는 Tauri Stronghold로 암호화 저장
- 업로드한 엑셀 파일은 메모리에만 로드, 앱 종료 시 초기화
- 식별 정보는 활동 컬럼에서 제외 가능

## 🤝 기여하기

기여를 환영합니다! MIT 라이선스 하에 배포되며, 누구나 자유롭게 수정하고 배포할 수 있습니다.

1. 저장소 Fork
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add some amazing feature'`)
4. 브랜치 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## ⚠️ 주의사항

- 생성된 내용은 반드시 교사가 검토하고 수정한 후 사용해야 합니다
- OpenAI API 사용에 따른 비용이 발생할 수 있습니다
- 학생 개인정보 보호를 위해 식별 정보 컬럼은 활동 컬럼에서 제외를 권장합니다

## 📝 라이선스

이 프로젝트는 [MIT 라이선스](LICENSE) 하에 배포됩니다.

---

<div align="center">

**Made with ❤️ for teachers**

</div>
