// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SpeechInputControls } from "../../src/features/practice/SpeechInputControls";
import type { SpeechRecognitionInstance } from "../../src/features/practice/useSpeechRecognition";

class FakeSpeechRecognition implements SpeechRecognitionInstance {
  static last: FakeSpeechRecognition | null = null;
  lang = "";
  continuous = false;
  interimResults = false;
  onresult: SpeechRecognitionInstance["onresult"] = null;
  onerror: SpeechRecognitionInstance["onerror"] = null;
  onend: SpeechRecognitionInstance["onend"] = null;
  start = vi.fn();
  stop = vi.fn(() => this.onend?.());
  abort = vi.fn();

  constructor() {
    FakeSpeechRecognition.last = this;
  }
}

function SpeechInputHarness() {
  const [value, setValue] = useState("I think");
  return <><textarea aria-label="answer" value={value} readOnly /><SpeechInputControls setInput={setValue} /></>;
}

afterEach(() => {
  cleanup();
  delete window.SpeechRecognition;
  delete window.webkitSpeechRecognition;
  FakeSpeechRecognition.last = null;
});

describe("SpeechInputControls", () => {
  it("keeps typing available when browser speech recognition is unsupported", () => {
    render(<SpeechInputHarness />);
    expect(screen.getByText(/타이핑으로 계속해 주세요/)).toBeInTheDocument();
  });

  it("appends a final English transcript to the current answer", () => {
    window.SpeechRecognition = FakeSpeechRecognition;
    render(<SpeechInputHarness />);

    fireEvent.click(screen.getByRole("button", { name: "마이크로 말하기" }));
    expect(FakeSpeechRecognition.last?.start).toHaveBeenCalledOnce();

    act(() => {
      FakeSpeechRecognition.last?.onresult?.({
        resultIndex: 0,
        results: [{ isFinal: true, 0: { transcript: "it is very comfortable" } }],
      });
    });

    expect(screen.getByRole("textbox", { name: "answer" })).toHaveValue("I think it is very comfortable");
  });

  it("shows a permission error without removing the typing path", () => {
    window.SpeechRecognition = FakeSpeechRecognition;
    render(<SpeechInputHarness />);
    fireEvent.click(screen.getByRole("button", { name: "마이크로 말하기" }));

    act(() => FakeSpeechRecognition.last?.onerror?.({ error: "not-allowed" }));

    expect(screen.getByRole("alert")).toHaveTextContent("마이크 권한이 필요합니다");
    expect(screen.getByRole("textbox", { name: "answer" })).toBeEnabled();
  });
});
