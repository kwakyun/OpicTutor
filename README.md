# OPIc Speech Quest

영어 표현을 기억에서 꺼내 직접 문장을 만들고, 확장하고, 새로운 질문에 전이하는 로컬 학습 MVP입니다.

## 실행

```powershell
pnpm install
npm run dev
```

브라우저에서 `http://127.0.0.1:3000`을 엽니다. 로그인, 서버, 외부 API 키는 필요하지 않습니다.

답변은 타이핑하거나 `마이크로 말하기`를 눌러 영어 음성을 텍스트로 받아 적을 수 있습니다. 음성 입력은 Web Speech API를 지원하는 브라우저(일반적으로 Chrome/Edge 계열)와 마이크 권한이 필요합니다. 앱은 음성 파일을 자체 서버에 업로드하거나 저장하지 않으며, 브라우저 환경에 따라 브라우저 제공 음성 서비스가 네트워크를 사용할 수 있습니다. 미지원 또는 권한 거부 시에도 타이핑으로 모든 연습을 진행할 수 있습니다.

## 검증

```powershell
npm run content:validate
npm run check
npm run test
npm run test:e2e
npm run build
```

## 구조

- `content/`: YAML 콘텐츠 팩
- `src/domain/`: 순수 TypeScript 학습 상태 머신과 숙련 규칙
- `src/content/`: 콘텐츠 스키마와 검증된 catalog
- `src/storage/`: versioned LocalStorage repository
- `src/features/`: 연습·표현·기록·설정 기능
- `app/`: App Router 화면 조립
- `execution-plan/`: MECE 실행 계획
