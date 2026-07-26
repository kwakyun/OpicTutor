import type { MasteryRecord } from "./mastery";

const stageWeight = { new: 5, learning: 4, practicing: 3, transfer_ready: 2, mastered: 1 } as const;

export function rankReviewQueue(records: MasteryRecord[]) {
  return [...records].sort((a, b) => {
    const scoreA = stageWeight[a.stage] + a.lastHintLevel;
    const scoreB = stageWeight[b.stage] + b.lastHintLevel;
    return scoreB - scoreA || a.expressionId.localeCompare(b.expressionId);
  });
}

