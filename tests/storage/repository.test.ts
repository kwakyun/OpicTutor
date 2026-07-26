import { describe, expect, it } from "vitest";
import { calculateFeedback } from "../../src/domain/feedback";
import { createPracticeState } from "../../src/domain/practice-machine";
import { createStorageRepository, storageKeys } from "../../src/storage/repository";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe("local repository", () => {
  it("recovers corrupt data and preserves a backup", () => {
    const storage = new MemoryStorage();
    storage.setItem(storageKeys.data, "not-json");
    const snapshot = createStorageRepository(storage, "checksum").loadSnapshot();
    expect(snapshot.schemaVersion).toBe(1);
    expect(storage.getItem(storageKeys.corruptBackup)).toBe("not-json");
  });

  it("commits an attempt only once", () => {
    const storage = new MemoryStorage();
    const repository = createStorageRepository(storage, "checksum");
    const state = { ...createPracticeState("q", "1", "attempt"), stage: "completed" as const, completedAt: 10 };
    const feedback = calculateFeedback(state);
    repository.commitAttempt({ state, topic: "Home", feedback, mastery: [] });
    repository.commitAttempt({ state, topic: "Home", feedback, mastery: [] });
    expect(repository.loadSnapshot().attempts).toHaveLength(1);
  });

  it("exports and validates imports before replacement", () => {
    const storage = new MemoryStorage();
    const repository = createStorageRepository(storage, "checksum");
    const exported = repository.exportData();
    repository.resetNamespace();
    repository.importData(exported);
    expect(repository.loadSnapshot().schemaVersion).toBe(1);
    expect(() => repository.importData("{}" )).toThrow();
  });
});

