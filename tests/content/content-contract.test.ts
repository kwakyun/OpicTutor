import { describe, expect, it } from "vitest";
import { activeQuestions, catalog } from "../../src/content/catalog";

describe("content contract", () => {
  it("ships a complete core vertical slice", () => {
    expect(activeQuestions).toHaveLength(12);
    expect(catalog.questions).toHaveLength(13);
    expect(catalog.training_units).toHaveLength(catalog.questions.length);
    expect(catalog.model_answers).toHaveLength(catalog.questions.length);
  });

  it("discovers an inactive fixture pack without changing app code", () => {
    expect(catalog.packs.map((pack) => pack.id)).toContain("fixture-v1");
    expect(catalog.active_pack_ids).not.toContain("fixture-v1");
    expect(activeQuestions.map((question) => question.pack_id)).not.toContain("fixture-v1");
  });

  it("never uses self-transfer and always supplies four hints", () => {
    for (const unit of catalog.training_units) {
      expect(unit.transfer_question_ids).not.toContain(unit.question_id);
      expect(unit.progressive_hints.map((hint) => hint.level)).toEqual([1, 2, 3, 4]);
    }
  });
});
