import { HistoryView } from "@/src/features/history/HistoryView";

export default function HistoryPage() {
  return <div className="page-wrap"><section className="page-header"><p className="eyebrow">PRACTICE LOG</p><h1>내 문장 생성 기록</h1><p>점수보다 인출 속도와 전이 성공을 확인하세요.</p></section><HistoryView /></div>;
}

