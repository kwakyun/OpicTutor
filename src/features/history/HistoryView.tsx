"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { catalog, getQuestion } from "../../content/catalog";
import { createStorageRepository, type StorageSnapshot } from "../../storage/repository";

export function HistoryView() {
  const [snapshot, setSnapshot] = useState<StorageSnapshot | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSnapshot(createStorageRepository(window.localStorage, catalog.checksum).loadSnapshot());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  if (!snapshot) return <p>기록을 불러오는 중...</p>;
  if (snapshot.attempts.length === 0) return <section className="empty-state"><h2>아직 완료한 퀘스트가 없습니다.</h2><p>첫 문장을 직접 만들어 기록을 시작해보세요.</p><Link className="primary-button" href="/">질문 선택</Link></section>;
  return <div className="history-list">{snapshot.attempts.map((attempt) => { const question = getQuestion(attempt.questionId); return <article key={attempt.id}><div><span className="topic-pill">{attempt.topic}</span><time>{new Date(attempt.completedAt).toLocaleDateString("ko-KR")}</time></div><h2>{question?.prompt ?? attempt.questionId}</h2><ul><li>인출 {attempt.feedback.retrievalSeconds ?? "-"}초</li><li>힌트 {attempt.feedback.maxHintLevelUsed}단계</li><li>전이 {attempt.feedback.transferSuccess ? "성공" : "복습 필요"}</li></ul><Link href={`/practice/${attempt.questionId}`}>다시 도전 →</Link></article>; })}</div>;
}
