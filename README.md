# 이 프로젝트를 한 이유
제가 오픽연습을 하고 싶어서 만들어 보았습니다.


# OPIc Speech Quest
영어 표현을 기억에서 꺼내 직접 문장을 만들고, 확장하고, 다른 질문에 적용하는 로컬 학습 MVP입니다.
정답 문장을 보기만 하는 학습에서 벗어나 직접 답변을 구성하는 연습 흐름을 구현합니다.

## 주요 기능과 설계

- 단계별 답변 연습과 학습 상태 전환: [학습 상태 머신](src/domain/practice-machine.ts)
- 숙련도·복습 규칙: [도메인 코드](src/domain/)
- YAML 학습 콘텐츠와 스키마 검증: [콘텐츠](content/), [스키마](src/content/schemas.ts)
- 브라우저에 기록 저장: [저장소 구현](src/storage/repository.ts)
- 선택형 음성 입력: [음성 인식 훅](src/features/practice/useSpeechRecognition.ts)

기술: Next.js 16, React 19, TypeScript, Zod, Vitest, Playwright.
[설계 의사결정 기록](docs/adr/)에서 로컬 저장과 콘텐츠 분리 이유를 볼 수 있습니다.

## 실행 방법

Node.js 22.13 이상과 pnpm 11.9.0을 사용합니다(package.json 기준).

~~~bash
git clone https://github.com/kwakyun/OpicTutor.git
cd OpicTutor
pnpm install --frozen-lockfile
pnpm dev
~~~

브라우저에서 http://127.0.0.1:3000 에 접속해 질문 선택 → 답변 작성 → 학습 기록 확인 순서로 사용합니다.
로그인과 외부 API 키는 필요하지 않습니다.

## 검증 명령

~~~bash
pnpm check
pnpm test
pnpm exec playwright install chromium
pnpm test:e2e
pnpm build
~~~

[테스트 코드](tests/)와 [기존 로컬 검증 기록](reports/local-mvp-validation.yaml)을 확인할 수 있습니다.
기존 보고서는 해당 시점의 기록이며 이번 변경의 테스트 결과와 구분합니다.

## 제한 사항

- 브라우저 로컬 저장 방식으로 기기 간 자동 동기화는 제공하지 않습니다.
- 음성 입력은 브라우저 지원과 마이크 권한이 필요합니다. 미지원 시에도 타이핑으로 연습할 수 있습니다.
- 앱 자체 서버에 음성을 저장하지 않지만 브라우저의 음성 서비스가 네트워크를 사용할 수 있습니다.
- 학습 보조 MVP이며 공식 OPIc 평가나 점수 예측 서비스가 아닙니다.

[AI 활용 기록](AI_NOTES.md) · [변경 기록](CHANGELOG.md) · [작업 방법](CONTRIBUTING.md)
