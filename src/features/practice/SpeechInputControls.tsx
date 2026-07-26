"use client";

import { useCallback } from "react";
import { useSpeechRecognition } from "./useSpeechRecognition";

export function SpeechInputControls({ setInput }: { setInput: (update: (current: string) => string) => void }) {
  const appendTranscript = useCallback((transcript: string) => {
    setInput((current) => [current.trim(), transcript.trim()].filter(Boolean).join(" "));
  }, [setInput]);
  const speech = useSpeechRecognition(appendTranscript);

  if (!speech.supported) {
    return <p className="voice-fallback">이 브라우저에서는 음성 입력을 지원하지 않습니다. 타이핑으로 계속해 주세요.</p>;
  }

  return (
    <div className="voice-input">
      <button
        type="button"
        className={speech.listening ? "voice-button listening" : "voice-button"}
        aria-pressed={speech.listening}
        onClick={speech.listening ? speech.stop : speech.start}
      >
        <span aria-hidden="true">{speech.listening ? "■" : "●"}</span>
        {speech.listening ? "듣기 중지" : "마이크로 말하기"}
      </button>
      <p className="voice-status" role="status" aria-live="polite">
        {speech.listening
          ? speech.interimTranscript ? `듣는 중: ${speech.interimTranscript}` : "듣는 중… 영어로 말해보세요."
          : "영어 음성을 텍스트로 받아 적습니다."}
      </p>
      {speech.error && <p className="speech-error" role="alert">{speech.error}</p>}
    </div>
  );
}
