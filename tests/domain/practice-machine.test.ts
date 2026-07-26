import { describe, expect, it } from "vitest";
import { calculateFeedback } from "../../src/domain/feedback";
import { initialMastery, updateMastery } from "../../src/domain/mastery";
import { createPracticeState, DomainError, transition } from "../../src/domain/practice-machine";

function fullAttempt() {
  let now = 1000;
  let state = createPracticeState("q-home-description", "1.0.0", "attempt-1");
  state = transition(state, { type: "START" }, now);
  now += 2500;
  state = transition(state, { type: "SUBMIT_RECALL", value: "Actually, I would say that" }, now);
  state = transition(state, { type: "SUBMIT_SENTENCE", value: "Actually my home is very comfortable" }, now + 100);
  state = transition(state, { type: "SUBMIT_EXPANSION", value: "Actually my home is very comfortable because my room gets warm sunlight every morning" }, now + 200);
  state = transition(state, { type: "SUBMIT_TIMED_RECALL", value: "My home is comfortable and bright" }, now + 300);
  state = transition(state, { type: "SUBMIT_TRANSFER", value: "Actually this cafe is quiet and comfortable" }, now + 400);
  return transition(state, { type: "COMPLETE" }, now + 500);
}

describe("practice state machine", () => {
  it("completes the full learning loop deterministically", () => {
    const state = fullAttempt();
    const feedback = calculateFeedback(state);
    expect(state.stage).toBe("completed");
    expect(feedback.retrievalSeconds).toBe(2.5);
    expect(feedback.transferSuccess).toBe(true);
  });

  it("rejects invalid transitions", () => {
    const state = createPracticeState("q", "1", "a");
    expect(() => transition(state, { type: "SUBMIT_SENTENCE", value: "not allowed" }, 1)).toThrow(DomainError);
  });

  it("prevents timer and submission from completing twice", () => {
    let state = createPracticeState("q", "1", "a");
    state = transition(state, { type: "START" }, 1);
    state = transition(state, { type: "SUBMIT_RECALL", value: "Actually expression" }, 2);
    state = transition(state, { type: "SUBMIT_SENTENCE", value: "This is my complete sentence" }, 3);
    state = transition(state, { type: "SUBMIT_EXPANSION", value: "This is my complete sentence with a useful reason and one detail" }, 4);
    state = transition(state, { type: "TIME_EXPIRED" }, 5);
    expect(() => transition(state, { type: "SUBMIT_TIMED_RECALL", value: "late answer" }, 6)).toThrow(DomainError);
  });

  it("does not award mastery without repeated topic transfer", () => {
    const feedback = calculateFeedback(fullAttempt());
    const once = updateMastery(initialMastery("exp-start"), feedback, "Home");
    expect(once.stage).not.toBe("mastered");
  });
});

