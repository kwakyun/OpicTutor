"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type RecognitionResult = {
  isFinal: boolean;
  0?: { transcript: string };
};

type RecognitionEvent = {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
};

type RecognitionErrorEvent = { error: string };

export type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function getRecognitionConstructor() {
  if (typeof window === "undefined") return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

function getErrorMessage(error: string) {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "마이크 권한이 필요합니다. 브라우저 설정을 확인해 주세요.";
  }
  if (error === "no-speech") return "음성이 들리지 않았습니다. 다시 말해보세요.";
  if (error === "audio-capture") return "사용할 수 있는 마이크를 찾지 못했습니다.";
  return "음성 인식을 시작하지 못했습니다. 타이핑으로 계속할 수 있습니다.";
}

export function useSpeechRecognition(onFinalTranscript: (transcript: string) => void) {
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const callbackRef = useRef(onFinalTranscript);
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState("");
  const supported = Boolean(getRecognitionConstructor());

  useEffect(() => {
    callbackRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Recognition = getRecognitionConstructor();
    if (!Recognition || listening) return;

    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const finalParts: string[] = [];
      const interimParts: string[] = [];

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (!result) continue;
        const transcript = result?.[0]?.transcript.trim();
        if (!transcript) continue;
        if (result.isFinal) finalParts.push(transcript);
        else interimParts.push(transcript);
      }

      if (finalParts.length > 0) callbackRef.current(finalParts.join(" "));
      setInterimTranscript(interimParts.join(" "));
    };
    recognition.onerror = (event) => {
      setError(getErrorMessage(event.error));
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
      setInterimTranscript("");
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setError("");
    setInterimTranscript("");
    try {
      recognition.start();
      setListening(true);
    } catch {
      recognitionRef.current = null;
      setListening(false);
      setError("음성 인식을 시작하지 못했습니다. 타이핑으로 계속할 수 있습니다.");
    }
  }, [listening]);

  useEffect(() => () => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
  }, []);

  return { supported, listening, interimTranscript, error, start, stop };
}
