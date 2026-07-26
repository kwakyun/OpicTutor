import rawCatalog from "./generated/catalog.json";
import { builtCatalogSchema } from "./schemas";

export const catalog = builtCatalogSchema.parse(rawCatalog);
const activePackIds = new Set(catalog.active_pack_ids);
export const activeQuestions = catalog.questions.filter((item) => activePackIds.has(item.pack_id));

export function getQuestion(questionId: string) {
  return catalog.questions.find((item) => item.id === questionId);
}

export function getTrainingUnit(questionId: string) {
  return catalog.training_units.find((item) => item.question_id === questionId);
}

export function getModelAnswer(questionId: string) {
  return catalog.model_answers.find((item) => item.question_id === questionId);
}

export function getExpressions(expressionIds: string[]) {
  const ids = new Set(expressionIds);
  return catalog.expressions.filter((item) => ids.has(item.id));
}
