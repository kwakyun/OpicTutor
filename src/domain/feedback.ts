import type { PracticeState } from "./practice-machine";

export type PracticeFeedback = {
  retrievalSeconds: number | null;
  firstAttemptComplete: boolean;
  maxHintLevelUsed: number;
  sentenceStructureComplete: boolean;
  requiredExpansionComplete: boolean;
  timedRecallComplete: boolean;
  transferSuccess: boolean;
};

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function calculateFeedback(state: PracticeState): PracticeFeedback {
  return {
    retrievalSeconds:
      state.retrievalLatencyMs === null ? null : Math.round(state.retrievalLatencyMs / 100) / 10,
    firstAttemptComplete: state.answers.recall.length >= 3 && state.maxHintLevelUsed === 0,
    maxHintLevelUsed: state.maxHintLevelUsed,
    sentenceStructureComplete: wordCount(state.answers.sentence) >= 5,
    requiredExpansionComplete: wordCount(state.answers.expansion) >= 12,
    timedRecallComplete: wordCount(state.answers.timed) >= 5,
    transferSuccess: wordCount(state.answers.transfer) >= 5,
  };
}

