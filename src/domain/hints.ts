export type ProgressiveHint = { level: number; text: string };

export function getVisibleHint(hints: ProgressiveHint[], level: number) {
  if (level <= 0) return null;
  return hints.find((hint) => hint.level === level) ?? null;
}

