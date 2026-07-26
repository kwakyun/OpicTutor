const stages = ["표현 인출", "문장 조립", "문장 확장", "재인출", "전이", "피드백"];

export function StageProgress({ activeIndex }: { activeIndex: number }) {
  return (
    <ol className="stage-progress" aria-label="연습 진행 단계">
      {stages.map((stage, index) => (
        <li key={stage} className={index < activeIndex ? "done" : index === activeIndex ? "active" : ""}>
          <span>{index < activeIndex ? "✓" : index + 1}</span>
          <small>{stage}</small>
        </li>
      ))}
    </ol>
  );
}

