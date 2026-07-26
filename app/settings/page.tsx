import { SettingsView } from "@/src/features/settings/SettingsView";

export default function SettingsPage() {
  return <div className="page-wrap narrow"><section className="page-header"><p className="eyebrow">LOCAL SETTINGS</p><h1>내 기록은 이 기기에만</h1><p>계정 없이 기록을 옮기거나 초기화할 수 있습니다.</p></section><SettingsView /></div>;
}
