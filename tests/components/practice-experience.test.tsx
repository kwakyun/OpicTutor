// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PracticeExperience } from "../../src/features/practice/PracticeExperience";

describe("PracticeExperience", () => {
  it("does not render the model answer before learner production", () => {
    render(<PracticeExperience questionId="q-home-description" />);
    expect(screen.getByRole("button", { name: "연습 시작" })).toBeInTheDocument();
    expect(screen.queryByText(/my home is small but comfortable/i)).not.toBeInTheDocument();
  });
});

