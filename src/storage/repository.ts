import { z } from "zod";
import type { PracticeFeedback } from "../domain/feedback";
import type { MasteryRecord } from "../domain/mastery";
import type { PracticeState } from "../domain/practice-machine";

const STORAGE_KEY = "opic-speech-quest:data";
const CORRUPT_KEY = "opic-speech-quest:corrupt-backup";

const practiceStateSchema = z.object({
  questionId: z.string(),
  contentVersion: z.string(),
  attemptId: z.string(),
  stage: z.enum([
    "idle",
    "recalling_expression",
    "assembling_sentence",
    "expanding_sentence",
    "timed_recall",
    "transferring",
    "reviewing_feedback",
    "completed",
  ]),
  startedAt: z.number().nullable(),
  stageStartedAt: z.number().nullable(),
  retrievalLatencyMs: z.number().nullable(),
  maxHintLevelUsed: z.number(),
  answers: z.object({
    recall: z.string(),
    sentence: z.string(),
    expansion: z.string(),
    timed: z.string(),
    transfer: z.string(),
  }),
  completedAt: z.number().nullable(),
});

const feedbackSchema = z.object({
  retrievalSeconds: z.number().nullable(),
  firstAttemptComplete: z.boolean(),
  maxHintLevelUsed: z.number(),
  sentenceStructureComplete: z.boolean(),
  requiredExpansionComplete: z.boolean(),
  timedRecallComplete: z.boolean(),
  transferSuccess: z.boolean(),
});

const masterySchema = z.object({
  expressionId: z.string(),
  stage: z.enum(["new", "learning", "practicing", "transfer_ready", "mastered"]),
  successfulTopics: z.array(z.string()),
  attempts: z.number(),
  lastHintLevel: z.number(),
  transferSuccesses: z.number(),
});

const snapshotSchema = z.object({
  schemaVersion: z.literal(1),
  settings: z.object({ timedSeconds: z.number().min(10).max(120) }),
  drafts: z.record(z.string(), practiceStateSchema),
  attempts: z.array(
    z.object({
      id: z.string(),
      questionId: z.string(),
      topic: z.string(),
      completedAt: z.number(),
      feedback: feedbackSchema,
    }),
  ),
  mastery: z.record(z.string(), masterySchema),
  contentState: z.object({ catalogChecksum: z.string() }),
});

export type StorageSnapshot = z.infer<typeof snapshotSchema>;

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
  }
}

export function emptySnapshot(catalogChecksum = ""): StorageSnapshot {
  return {
    schemaVersion: 1,
    settings: { timedSeconds: 30 },
    drafts: {},
    attempts: [],
    mastery: {},
    contentState: { catalogChecksum },
  };
}

export function createStorageRepository(storage: Storage, catalogChecksum: string) {
  function save(snapshot: StorageSnapshot) {
    storage.setItem(STORAGE_KEY, JSON.stringify(snapshotSchema.parse(snapshot)));
  }

  function loadSnapshot(): StorageSnapshot {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return emptySnapshot(catalogChecksum);
    try {
      const parsed = snapshotSchema.parse(JSON.parse(raw));
      return {
        ...parsed,
        contentState: { catalogChecksum },
      };
    } catch {
      storage.setItem(CORRUPT_KEY, raw);
      const recovered = emptySnapshot(catalogChecksum);
      save(recovered);
      return recovered;
    }
  }

  return {
    loadSnapshot,
    saveDraft(questionId: string, state: PracticeState) {
      const snapshot = loadSnapshot();
      snapshot.drafts[questionId] = practiceStateSchema.parse(state);
      save(snapshot);
    },
    clearDraft(questionId: string) {
      const snapshot = loadSnapshot();
      delete snapshot.drafts[questionId];
      save(snapshot);
    },
    commitAttempt(input: {
      state: PracticeState;
      topic: string;
      feedback: PracticeFeedback;
      mastery: MasteryRecord[];
    }) {
      const snapshot = loadSnapshot();
      if (snapshot.attempts.some((attempt) => attempt.id === input.state.attemptId)) return snapshot;
      snapshot.attempts.unshift({
        id: input.state.attemptId,
        questionId: input.state.questionId,
        topic: input.topic,
        completedAt: input.state.completedAt ?? Date.now(),
        feedback: feedbackSchema.parse(input.feedback),
      });
      for (const record of input.mastery) snapshot.mastery[record.expressionId] = masterySchema.parse(record);
      delete snapshot.drafts[input.state.questionId];
      save(snapshot);
      return snapshot;
    },
    exportData() {
      return JSON.stringify(loadSnapshot(), null, 2);
    },
    importData(raw: string) {
      try {
        const next = snapshotSchema.parse(JSON.parse(raw));
        save({ ...next, contentState: { catalogChecksum } });
      } catch {
        throw new StorageError("가져올 파일의 형식이 올바르지 않습니다.");
      }
    },
    resetNamespace() {
      storage.removeItem(STORAGE_KEY);
      storage.removeItem(CORRUPT_KEY);
    },
  };
}

export const storageKeys = { data: STORAGE_KEY, corruptBackup: CORRUPT_KEY } as const;

