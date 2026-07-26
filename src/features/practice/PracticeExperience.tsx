"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { catalog, getExpressions, getModelAnswer, getQuestion, getTrainingUnit } from "../../content/catalog";
import { calculateFeedback } from "../../domain/feedback";
import { getVisibleHint } from "../../domain/hints";
import { initialMastery, updateMastery } from "../../domain/mastery";
import {
  createPracticeState,
  DomainError,
  transition,
  type PracticeEvent,
  type PracticeState,
} from "../../domain/practice-machine";
import { createStorageRepository } from "../../storage/repository";
import { StageProgress } from "../../shared/StageProgress";
import { SpeechInputControls } from "./SpeechInputControls";

const stageIndex: Record<PracticeState["stage"], number> = {
  idle: 0,
  recalling_expression: 0,
  assembling_sentence: 1,
  expanding_sentence: 2,
  timed_recall: 3,
  transferring: 4,
  reviewing_feedback: 5,
  completed: 5,
};

export function PracticeExperience({ questionId }: { questionId: string }) {
  const question = getQuestion(questionId);
  const unit = getTrainingUnit(questionId);
  const modelAnswer = getModelAnswer(questionId);
  const expressions = unit ? getExpressions(unit.expression_ids) : [];
  const transferQuestion = unit ? getQuestion(unit.transfer_question_ids[0] ?? "") : undefined;
  const repository = useMemo(
    () => (typeof window === "undefined" ? null : createStorageRepository(window.localStorage, catalog.checksum)),
    [],
  );
  const [state, setState] = useState<PracticeState>(() =>
    createPracticeState(questionId, catalog.packs[0]?.version ?? "1.0.0", `${questionId}-${Date.now()}`),
  );
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(30);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!repository) return;
    const draft = repository.loadSnapshot().drafts[questionId];
    if (draft && draft.contentVersion === (catalog.packs[0]?.version ?? "1.0.0") && draft.stage !== "completed") {
      const timer = window.setTimeout(() => setState(draft), 0);
      return () => window.clearTimeout(timer);
    }
  }, [questionId, repository]);

  useEffect(() => {
    if (!repository || state.stage === "idle" || state.stage === "completed") return;
    repository.saveDraft(questionId, state);
  }, [questionId, repository, state]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [state.stage]);

  useEffect(() => {
    if (state.stage !== "timed_recall") return;
    const resetTimer = window.setTimeout(() => setRemaining(30), 0);
    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          setState((current) => {
            if (current.stage !== "timed_recall") return current;
            return transition(current, { type: "TIME_EXPIRED" }, Date.now());
          });
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => {
      window.clearTimeout(resetTimer);
      window.clearInterval(timer);
    };
  }, [state.stage]);

  if (!question || !unit || !modelAnswer) {
    return <div className="page-wrap"><section className="empty-state"><h1>질문을 찾을 수 없습니다.</h1><Link href="/">홈으로 돌아가기</Link></section></div>;
  }

  function send(event: PracticeEvent) {
    try {
      const next = transition(state, event, Date.now());
      setState(next);
      setInput(next.stage === "expanding_sentence" ? next.answers.sentence : "");
      setError("");
    } catch (caught) {
      setError(caught instanceof DomainError ? caught.message : "진행 중 문제가 발생했습니다.");
    }
  }

  function submit(event: PracticeEvent) {
    send(event);
  }

  function finish(now: number) {
    const completed = transition(state, { type: "COMPLETE" }, now);
    const feedback = calculateFeedback(completed);
    if (repository) {
      const snapshot = repository.loadSnapshot();
      const mastery = expressions.map((expression) =>
        updateMastery(snapshot.mastery[expression.id] ?? initialMastery(expression.id), feedback, question!.topic),
      );
      repository.commitAttempt({ state: completed, topic: question!.topic, feedback, mastery });
    }
    setState(completed);
  }

  const hint = getVisibleHint(unit.progressive_hints, state.maxHintLevelUsed);
  const feedback = calculateFeedback(state);

  return (
    <div className="practice-page">
      <aside className="quest-brief">
        <Link className="back-link" href="/">← 질문 목록</Link>
        <span className="topic-pill">{question.topic}</span>
        <p className="eyebrow">YOUR QUESTION</p>
        <h1>{question.prompt}</h1>
        <div className="mission-box"><strong>이번 퀘스트</strong><p>{unit.retrieval_prompts[0]}</p></div>
      </aside>

      <section className="practice-workspace">
        <StageProgress activeIndex={stageIndex[state.stage]} />

        {state.stage === "idle" && (
          <div className="stage-card intro-stage">
            <p className="eyebrow">READY?</p>
            <h2 ref={headingRef} tabIndex={-1}>정답 없이 먼저 떠올려보세요.</h2>
            <p>첫 단계에서는 영어 표현을 기억에서 직접 꺼냅니다. 막힐 때만 힌트를 사용하세요.</p>
            <button className="primary-button" onClick={() => send({ type: "START" })}>연습 시작</button>
          </div>
        )}

        {state.stage === "recalling_expression" && (
          <StageForm title="영어 표현을 떠올려 적어보세요" kicker="STEP 1 · RECALL" description={unit.retrieval_prompts.join(" ")} input={input} setInput={setInput} error={error}>
            {hint && <div className="hint-panel"><span>Hint {hint.level}</span>{hint.text}</div>}
            <button className="ghost-button" onClick={() => send({ type: "REQUEST_HINT" })} disabled={state.maxHintLevelUsed >= 4}>힌트 한 단계</button>
            <button className="primary-button" onClick={() => submit({ type: "SUBMIT_RECALL", value: input })}>표현 제출</button>
          </StageForm>
        )}

        {state.stage === "assembling_sentence" && (
          <StageForm title="표현을 내 정보와 연결하세요" kicker="STEP 2 · BUILD" description={`포함할 내용: ${unit.assembly_requirements.join(" · ")}`} input={input} setInput={setInput} error={error}>
            <div className="chunk-list">{expressions.map((item) => <span key={item.id}>{item.chunk}</span>)}</div>
            <button className="ghost-button" onClick={() => send({ type: "REQUEST_HINT" })}>힌트</button>
            <button className="primary-button" onClick={() => submit({ type: "SUBMIT_SENTENCE", value: input })}>문장 완성</button>
          </StageForm>
        )}

        {state.stage === "expanding_sentence" && (
          <StageForm title="한 문장을 답변으로 확장하세요" kicker="STEP 3 · EXPAND" description={`추가할 요소: ${unit.expansion_requirements.join(" · ")}`} input={input} setInput={setInput} error={error}>
            <div className="previous-answer"><span>내 기본 문장</span>{state.answers.sentence}</div>
            <button className="ghost-button" onClick={() => send({ type: "REQUEST_HINT" })}>힌트</button>
            <button className="primary-button" onClick={() => submit({ type: "SUBMIT_EXPANSION", value: input })}>확장 완료</button>
          </StageForm>
        )}

        {state.stage === "timed_recall" && (
          <StageForm title="힌트 없이 다시 만들어보세요" kicker="STEP 4 · TIMED RECALL" description="완벽함보다 빠른 인출이 목표입니다." input={input} setInput={setInput} error={error}>
            <div className="timer" aria-live="polite"><span>{remaining}</span>초</div>
            <button className="primary-button" onClick={() => submit({ type: "SUBMIT_TIMED_RECALL", value: input })}>재인출 완료</button>
          </StageForm>
        )}

        {state.stage === "transferring" && transferQuestion && (
          <StageForm title="새 질문에 같은 표현을 사용하세요" kicker="STEP 5 · TRANSFER" description={transferQuestion.prompt} input={input} setInput={setInput} error={error}>
            <p className="transfer-note">주제가 달라도 방금 연습한 표현의 기능은 그대로 사용할 수 있습니다.</p>
            <button className="primary-button" onClick={() => submit({ type: "SUBMIT_TRANSFER", value: input })}>전이 답변 제출</button>
          </StageForm>
        )}

        {state.stage === "reviewing_feedback" && (
          <div className="stage-card feedback-stage">
            <p className="eyebrow">QUEST REVIEW</p>
            <h2 ref={headingRef} tabIndex={-1}>문장을 만드는 과정이 한 단계 강해졌어요.</h2>
            <div className="metric-grid">
              <Metric label="표현 인출" value={feedback.retrievalSeconds === null ? "-" : `${feedback.retrievalSeconds}초`} ok={feedback.firstAttemptComplete} />
              <Metric label="힌트 의존" value={`${feedback.maxHintLevelUsed}단계`} ok={feedback.maxHintLevelUsed < 3} />
              <Metric label="문장 확장" value={feedback.requiredExpansionComplete ? "완료" : "더 연습"} ok={feedback.requiredExpansionComplete} />
              <Metric label="새 질문 전이" value={feedback.transferSuccess ? "성공" : "더 연습"} ok={feedback.transferSuccess} />
            </div>
            <details className="model-answer"><summary>이제 예시 답변 비교하기</summary><p>{modelAnswer.text}</p></details>
            <button className="primary-button" onClick={() => finish(Date.now())}>퀘스트 완료</button>
          </div>
        )}

        {state.stage === "completed" && (
          <div className="stage-card completion-stage">
            <span className="completion-mark">✓</span><p className="eyebrow">QUEST COMPLETE</p><h2>학습 기록을 로컬에 저장했습니다.</h2>
            <div className="completion-actions"><Link className="primary-button" href={transferQuestion ? `/practice/${transferQuestion.id}` : "/"}>다음 질문</Link><Link className="ghost-button" href="/history">기록 보기</Link></div>
          </div>
        )}
      </section>
    </div>
  );
}

function StageForm({ title, kicker, description, input, setInput, error, children }: {
  title: string; kicker: string; description: string; input: string; setInput: React.Dispatch<React.SetStateAction<string>>; error: string; children: React.ReactNode;
}) {
  return <div className="stage-card"><p className="eyebrow">{kicker}</p><h2 tabIndex={-1}>{title}</h2><p className="stage-description">{description}</p><textarea aria-label={title} value={input} onChange={(event) => setInput(event.target.value)} placeholder="영어로 입력하거나 마이크로 말해보세요..." autoFocus /><SpeechInputControls key={title} setInput={setInput} />{error && <p className="form-error" role="alert">{error}</p>}<div className="stage-actions">{children}</div></div>;
}

function Metric({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return <div className={ok ? "metric ok" : "metric"}><span>{label}</span><strong>{value}</strong><small>{ok ? "Good" : "Next focus"}</small></div>;
}
