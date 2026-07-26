import { z } from "zod";

export const questionSchema = z.object({
  id: z.string().min(1),
  pack_id: z.string().min(1),
  topic: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  type: z.enum([
    "description",
    "habit_preference",
    "past_experience",
    "comparison_change",
    "problem_solution",
    "role_play",
  ]),
  prompt: z.string().min(10),
  target_intent_ids: z.array(z.string()).min(1),
});

export const expressionSchema = z.object({
  id: z.string().min(1),
  function: z.string().min(1),
  intent_ko: z.string().min(1),
  chunk: z.string().min(1),
  sentence_frames: z.array(z.string()).min(1),
  substitution_slots: z.array(z.string()).min(1),
});

export const hintSchema = z.object({
  level: z.number().int().min(1).max(4),
  text: z.string().min(1),
});

export const trainingUnitSchema = z.object({
  id: z.string().min(1),
  question_id: z.string().min(1),
  expression_ids: z.array(z.string()).min(3),
  retrieval_prompts: z.array(z.string()).min(1),
  progressive_hints: z.array(hintSchema).length(4),
  assembly_requirements: z.array(z.string()).min(1),
  expansion_requirements: z.array(z.string()).min(1),
  transfer_question_ids: z.array(z.string()).min(1),
  mastery_criteria: z.array(z.string()).min(1),
});

export const modelAnswerSchema = z.object({
  question_id: z.string().min(1),
  text: z.string().min(20),
  review_status: z.literal("approved"),
});

export const sourceCatalogSchema = z.object({
  schema_version: z.literal(1),
  active_pack_ids: z.array(z.string()).min(1),
  packs: z.array(
    z.object({
      id: z.string().min(1),
      version: z.string().min(1),
      schema_version: z.literal(1),
      title: z.string().min(1),
      description: z.string().min(1),
    }),
  ),
});

export const builtCatalogSchema = z.object({
  schema_version: z.literal(1),
  generated_at: z.string(),
  checksum: z.string(),
  active_pack_ids: z.array(z.string()),
  packs: z.array(
    z.object({
      id: z.string(),
      version: z.string(),
      schema_version: z.literal(1),
      title: z.string(),
      description: z.string(),
      question_ids: z.array(z.string()),
      expression_ids: z.array(z.string()),
      training_unit_ids: z.array(z.string()),
    }),
  ),
  questions: z.array(questionSchema),
  expressions: z.array(expressionSchema),
  training_units: z.array(trainingUnitSchema),
  model_answers: z.array(modelAnswerSchema),
});

export type Question = z.infer<typeof questionSchema>;
export type Expression = z.infer<typeof expressionSchema>;
export type TrainingUnit = z.infer<typeof trainingUnitSchema>;
export type BuiltCatalog = z.infer<typeof builtCatalogSchema>;

