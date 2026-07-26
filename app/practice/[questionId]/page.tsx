import { PracticeExperience } from "@/src/features/practice/PracticeExperience";

export default async function PracticePage({ params }: { params: Promise<{ questionId: string }> }) {
  const { questionId } = await params;
  return <PracticeExperience questionId={questionId} />;
}

