import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";
import {
  builtCatalogSchema,
  expressionSchema,
  modelAnswerSchema,
  questionSchema,
  sourceCatalogSchema,
  trainingUnitSchema,
} from "../src/content/schemas";

const root = process.cwd();
const validateOnly = process.argv.includes("--validate-only");

async function readYaml(relativePath: string) {
  return parse(await readFile(path.join(root, relativePath), "utf8")) as unknown;
}

function assertUnique(values: string[], label: string) {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`${label} contains duplicate id: ${value}`);
    seen.add(value);
  }
}

const sourceCatalog = sourceCatalogSchema.parse(await readYaml("content/catalog.yaml"));
const loadedPacks = await Promise.all(
  sourceCatalog.packs.map(async (pack) => {
    const questionsDoc = (await readYaml(`content/${pack.id}/questions.yaml`)) as { questions?: unknown[] };
    const expressionsDoc = (await readYaml(`content/${pack.id}/expressions.yaml`)) as { expressions?: unknown[] };
    const unitsDoc = (await readYaml(`content/${pack.id}/training-units.yaml`)) as { training_units?: unknown[] };
    const answersDoc = (await readYaml(`content/${pack.id}/model-answers.yaml`)) as { model_answers?: unknown[] };
    return {
      pack,
      questions: questionSchema.array().parse(questionsDoc.questions),
      expressions: expressionSchema.array().parse(expressionsDoc.expressions),
      trainingUnits: trainingUnitSchema.array().parse(unitsDoc.training_units),
      modelAnswers: modelAnswerSchema.array().parse(answersDoc.model_answers),
    };
  }),
);

const questions = loadedPacks.flatMap((item) => item.questions);
const expressions = loadedPacks.flatMap((item) => item.expressions);
const trainingUnits = loadedPacks.flatMap((item) => item.trainingUnits);
const modelAnswers = loadedPacks.flatMap((item) => item.modelAnswers);

assertUnique(questions.map((item) => item.id), "questions");
assertUnique(expressions.map((item) => item.id), "expressions");
assertUnique(trainingUnits.map((item) => item.id), "training units");
assertUnique(modelAnswers.map((item) => item.question_id), "model answers");

const questionIds = new Set(questions.map((item) => item.id));
const expressionIds = new Set(expressions.map((item) => item.id));
const unitQuestionIds = new Set<string>();
const expressionUse = new Map<string, number>();

for (const unit of trainingUnits) {
  if (!questionIds.has(unit.question_id)) throw new Error(`Unknown question: ${unit.question_id}`);
  if (unitQuestionIds.has(unit.question_id)) throw new Error(`Duplicate unit for question: ${unit.question_id}`);
  unitQuestionIds.add(unit.question_id);

  const hintLevels = unit.progressive_hints.map((hint) => hint.level).join(",");
  if (hintLevels !== "1,2,3,4") throw new Error(`Invalid hint ladder: ${unit.id}`);
  for (const expressionId of unit.expression_ids) {
    if (!expressionIds.has(expressionId)) throw new Error(`Unknown expression: ${expressionId}`);
    expressionUse.set(expressionId, (expressionUse.get(expressionId) ?? 0) + 1);
  }
  for (const transferId of unit.transfer_question_ids) {
    if (!questionIds.has(transferId)) throw new Error(`Unknown transfer question: ${transferId}`);
    if (transferId === unit.question_id) throw new Error(`Self transfer is not allowed: ${unit.id}`);
  }
}

for (const questionId of questionIds) {
  if (!unitQuestionIds.has(questionId)) throw new Error(`Question has no training unit: ${questionId}`);
  if (!modelAnswers.some((answer) => answer.question_id === questionId)) {
    throw new Error(`Question has no approved model answer: ${questionId}`);
  }
}

for (const expressionId of expressionIds) {
  if ((expressionUse.get(expressionId) ?? 0) < 3) {
    throw new Error(`Expression must be reused by at least 3 units: ${expressionId}`);
  }
}

const payload = {
  schema_version: 1 as const,
  active_pack_ids: sourceCatalog.active_pack_ids,
  packs: loadedPacks.map(({ pack, questions: packQuestions, expressions: packExpressions, trainingUnits: packUnits }) => ({
    ...pack,
    question_ids: packQuestions.map((item) => item.id),
    expression_ids: packExpressions.map((item) => item.id),
    training_unit_ids: packUnits.map((item) => item.id),
  })),
  questions,
  expressions,
  training_units: trainingUnits,
  model_answers: modelAnswers,
};

const stableJson = JSON.stringify(payload);
const checksum = createHash("sha256").update(stableJson).digest("hex");
const catalog = builtCatalogSchema.parse({
  ...payload,
  generated_at: "build-time",
  checksum,
});

if (!validateOnly) {
  const outputs = ["src/content/generated", "dist/content"];
  for (const output of outputs) {
    const directory = path.join(root, output);
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  }
}

console.log(
  `content ${validateOnly ? "validated" : "built"}: ${questions.length} questions (${sourceCatalog.active_pack_ids.length} active pack), ${expressions.length} expressions, ${trainingUnits.length} units`,
);
