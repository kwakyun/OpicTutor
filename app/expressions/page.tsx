import Link from "next/link";
import { catalog } from "@/src/content/catalog";

export default function ExpressionsPage() {
  return <div className="page-wrap"><section className="page-header"><p className="eyebrow">EXPRESSION BANK</p><h1>문장 기능별 핵심 표현</h1><p>표현을 구경하는 데서 끝내지 말고, 연결된 질문으로 바로 사용해보세요.</p></section><div className="expression-grid">{catalog.expressions.map((expression) => { const unit = catalog.training_units.find((item) => item.expression_ids.includes(expression.id)); return <article className="expression-card" key={expression.id}><span>{expression.function.replaceAll("_", " ")}</span><h2>{expression.chunk}</h2><p>{expression.intent_ko}</p><code>{expression.sentence_frames[0]}</code>{unit && <Link href={`/practice/${unit.question_id}`}>이 표현 연습하기 →</Link>}</article>; })}</div></div>;
}

