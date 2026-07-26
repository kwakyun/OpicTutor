import type { PracticeFeedback } from "./feedback";

export type MasteryStage = "new" | "learning" | "practicing" | "transfer_ready" | "mastered";
export type MasteryRecord = {
  expressionId: string;
  stage: MasteryStage;
  successfulTopics: string[];
  attempts: number;
  lastHintLevel: number;
  transferSuccesses: number;
};

export function initialMastery(expressionId: string): MasteryRecord {
  return { expressionId, stage: "new", successfulTopics: [], attempts: 0, lastHintLevel: 4, transferSuccesses: 0 };
}

export function updateMastery(
  current: MasteryRecord,
  feedback: PracticeFeedback,
  topic: string,
): MasteryRecord {
  const successfulTopics = feedback.sentenceStructureComplete
    ? [...new Set([...current.successfulTopics, topic])]
    : current.successfulTopics;
  const transferSuccesses = current.transferSuccesses + (feedback.transferSuccess ? 1 : 0);
  let stage: MasteryStage = "learning";
  if (successfulTopics.length >= 2) stage = "practicing";
  if (successfulTopics.length >= 3) stage = "transfer_ready";
  if (successfulTopics.length >= 3 && transferSuccesses >= 2 && feedback.maxHintLevelUsed < 4) stage = "mastered";
  return {
    ...current,
    stage,
    successfulTopics,
    attempts: current.attempts + 1,
    lastHintLevel: feedback.maxHintLevelUsed,
    transferSuccesses,
  };
}

