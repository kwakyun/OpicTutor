export type PracticeStage =
  | "idle"
  | "recalling_expression"
  | "assembling_sentence"
  | "expanding_sentence"
  | "timed_recall"
  | "transferring"
  | "reviewing_feedback"
  | "completed";

export type PracticeAnswers = {
  recall: string;
  sentence: string;
  expansion: string;
  timed: string;
  transfer: string;
};

export type PracticeState = {
  questionId: string;
  contentVersion: string;
  attemptId: string;
  stage: PracticeStage;
  startedAt: number | null;
  stageStartedAt: number | null;
  retrievalLatencyMs: number | null;
  maxHintLevelUsed: number;
  answers: PracticeAnswers;
  completedAt: number | null;
};

export type PracticeEvent =
  | { type: "START" }
  | { type: "REQUEST_HINT" }
  | { type: "SUBMIT_RECALL"; value: string }
  | { type: "SUBMIT_SENTENCE"; value: string }
  | { type: "SUBMIT_EXPANSION"; value: string }
  | { type: "TIME_EXPIRED" }
  | { type: "SUBMIT_TIMED_RECALL"; value: string }
  | { type: "SUBMIT_TRANSFER"; value: string }
  | { type: "VIEW_FEEDBACK" }
  | { type: "COMPLETE" }
  | { type: "RESET" };

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export function createPracticeState(
  questionId: string,
  contentVersion: string,
  attemptId: string,
): PracticeState {
  return {
    questionId,
    contentVersion,
    attemptId,
    stage: "idle",
    startedAt: null,
    stageStartedAt: null,
    retrievalLatencyMs: null,
    maxHintLevelUsed: 0,
    answers: { recall: "", sentence: "", expansion: "", timed: "", transfer: "" },
    completedAt: null,
  };
}

function requireText(value: string, label: string) {
  if (value.trim().length < 3) throw new DomainError(`${label}을(를) 3자 이상 입력하세요.`);
  return value.trim();
}

export function transition(state: PracticeState, event: PracticeEvent, now: number): PracticeState {
  if (event.type === "RESET") {
    return createPracticeState(state.questionId, state.contentVersion, `${state.questionId}-${now}`);
  }

  switch (state.stage) {
    case "idle":
      if (event.type !== "START") throw new DomainError("연습을 먼저 시작하세요.");
      return { ...state, stage: "recalling_expression", startedAt: now, stageStartedAt: now };
    case "recalling_expression":
      if (event.type === "REQUEST_HINT") {
        return { ...state, maxHintLevelUsed: Math.min(4, state.maxHintLevelUsed + 1) };
      }
      if (event.type !== "SUBMIT_RECALL") throw new DomainError("표현 인출 단계에서 허용되지 않은 동작입니다.");
      return {
        ...state,
        stage: "assembling_sentence",
        retrievalLatencyMs: state.stageStartedAt === null ? null : Math.max(0, now - state.stageStartedAt),
        stageStartedAt: now,
        answers: { ...state.answers, recall: requireText(event.value, "표현") },
      };
    case "assembling_sentence":
      if (event.type === "REQUEST_HINT") {
        return { ...state, maxHintLevelUsed: Math.min(4, state.maxHintLevelUsed + 1) };
      }
      if (event.type !== "SUBMIT_SENTENCE") throw new DomainError("문장 조립 단계에서 허용되지 않은 동작입니다.");
      return {
        ...state,
        stage: "expanding_sentence",
        stageStartedAt: now,
        answers: { ...state.answers, sentence: requireText(event.value, "문장") },
      };
    case "expanding_sentence":
      if (event.type === "REQUEST_HINT") {
        return { ...state, maxHintLevelUsed: Math.min(4, state.maxHintLevelUsed + 1) };
      }
      if (event.type !== "SUBMIT_EXPANSION") throw new DomainError("문장 확장 단계에서 허용되지 않은 동작입니다.");
      return {
        ...state,
        stage: "timed_recall",
        stageStartedAt: now,
        answers: { ...state.answers, expansion: requireText(event.value, "확장 답변") },
      };
    case "timed_recall":
      if (event.type === "TIME_EXPIRED") {
        return { ...state, stage: "transferring", stageStartedAt: now };
      }
      if (event.type !== "SUBMIT_TIMED_RECALL") throw new DomainError("시간 제한 단계에서 허용되지 않은 동작입니다.");
      return {
        ...state,
        stage: "transferring",
        stageStartedAt: now,
        answers: { ...state.answers, timed: requireText(event.value, "재인출 답변") },
      };
    case "transferring":
      if (event.type === "REQUEST_HINT") {
        return { ...state, maxHintLevelUsed: Math.min(4, state.maxHintLevelUsed + 1) };
      }
      if (event.type !== "SUBMIT_TRANSFER") throw new DomainError("전이 단계에서 허용되지 않은 동작입니다.");
      return {
        ...state,
        stage: "reviewing_feedback",
        stageStartedAt: now,
        answers: { ...state.answers, transfer: requireText(event.value, "전이 답변") },
      };
    case "reviewing_feedback":
      if (event.type !== "COMPLETE") throw new DomainError("피드백을 확인한 뒤 완료하세요.");
      return { ...state, stage: "completed", completedAt: now };
    case "completed":
      throw new DomainError("이미 완료된 연습입니다.");
    default:
      throw new DomainError("알 수 없는 연습 상태입니다.");
  }
}

