"use client";

import { useRef, useState } from "react";
import { catalog } from "../../content/catalog";
import { createStorageRepository, StorageError } from "../../storage/repository";

export function SettingsView() {
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  function repository() { return createStorageRepository(window.localStorage, catalog.checksum); }
  function exportData() {
    const blob = new Blob([repository().exportData()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "speech-quest-data.json"; anchor.click(); URL.revokeObjectURL(url);
    setMessage("로컬 기록을 내보냈습니다.");
  }
  async function importData(file?: File) {
    if (!file) return;
    try { repository().importData(await file.text()); setMessage("기록을 가져왔습니다."); }
    catch (error) { setMessage(error instanceof StorageError ? error.message : "가져오기에 실패했습니다."); }
  }
  function reset() {
    if (!window.confirm("이 브라우저의 Speech Quest 기록을 모두 초기화할까요?")) return;
    repository().resetNamespace(); setMessage("로컬 기록을 초기화했습니다.");
  }
  return <div className="settings-list"><section><div><h2>데이터 내보내기</h2><p>연습 기록과 숙련도를 JSON 파일로 저장합니다.</p></div><button className="ghost-button" onClick={exportData}>내보내기</button></section><section><div><h2>데이터 가져오기</h2><p>이전에 내보낸 Speech Quest JSON만 적용합니다.</p></div><input ref={fileRef} type="file" accept="application/json" hidden onChange={(event) => void importData(event.target.files?.[0])}/><button className="ghost-button" onClick={() => fileRef.current?.click()}>가져오기</button></section><section className="danger-zone"><div><h2>로컬 기록 초기화</h2><p>다른 사이트의 브라우저 데이터에는 영향을 주지 않습니다.</p></div><button className="danger-button" onClick={reset}>초기화</button></section>{message && <p className="settings-message" role="status">{message}</p>}</div>;
}

