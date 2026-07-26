import Link from "next/link";
import { activeQuestions } from "@/src/content/catalog";

export default function Home() {
  const featured = activeQuestions.slice(0, 6);
  return (
    <div className="page-wrap">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">OPIc SPEECH QUEST · LOCAL MVP</p>
          <h1>영어 표현을<br/><em>내 문장</em>으로 바꾸는 훈련</h1>
          <p className="hero-copy">정답을 외우지 않습니다. 표현을 떠올리고, 직접 문장을 만들고, 새로운 질문에 다시 써보세요.</p>
          <Link className="primary-button" href={`/practice/${featured[0]?.id ?? "q-home-description"}`}>첫 퀘스트 시작</Link>
        </div>
        <div className="loop-card" aria-label="핵심 학습 루프">
          <span className="loop-number">01</span><strong>Recall</strong><p>표현을 기억에서 꺼내기</p>
          <span className="loop-arrow">↓</span>
          <span className="loop-number">02</span><strong>Build</strong><p>내 정보로 문장 만들기</p>
          <span className="loop-arrow">↓</span>
          <span className="loop-number">03</span><strong>Transfer</strong><p>새 질문에 다시 사용하기</p>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><p className="eyebrow">CORE QUESTS</p><h2>오늘 연습할 질문</h2></div><span>{activeQuestions.length} questions</span></div>
        <div className="question-grid">
          {featured.map((question, index) => (
            <Link className="question-card" key={question.id} href={`/practice/${question.id}`}>
              <div><span className="topic-pill">{question.topic}</span><span className="difficulty">{question.difficulty}</span></div>
              <h3>{question.prompt}</h3>
              <footer><span>Quest {String(index + 1).padStart(2, "0")}</span><b>연습하기 →</b></footer>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
