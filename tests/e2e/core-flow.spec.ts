import { expect, test } from "@playwright/test";

test("learner completes recall, construction, expansion and transfer", async ({ page }) => {
  await page.goto("/practice/q-home-description");
  await page.getByRole("button", { name: "연습 시작" }).click();
  await expect(page.getByRole("textbox")).toBeVisible({ timeout: 5000 });
  await expect(page.getByText(/음성 입력을 지원하지 않습니다|영어 음성을 텍스트로 받아 적습니다/)).toBeVisible();
  await page.getByRole("textbox").fill("Actually, I would say that");
  await page.getByRole("button", { name: "표현 제출" }).click();
  await page.getByRole("textbox").fill("Actually, my home is small and comfortable");
  await page.getByRole("button", { name: "문장 완성" }).click();
  await page.getByRole("textbox").fill("Actually, my home is small and comfortable because sunlight comes into my room every morning");
  await page.getByRole("button", { name: "확장 완료" }).click();
  await page.getByRole("textbox").fill("My home is comfortable and bright in the morning");
  await page.getByRole("button", { name: "재인출 완료" }).click();
  await page.getByRole("textbox").fill("Actually, this cafe is quiet and comfortable");
  await page.getByRole("button", { name: "전이 답변 제출" }).click();
  await expect(page.getByText("이제 예시 답변 비교하기")).toBeVisible();
  await page.getByRole("button", { name: "퀘스트 완료" }).click();
  await expect(page.getByText("학습 기록을 로컬에 저장했습니다.")).toBeVisible();
});
