import Link from "next/link";
import type { ReactNode } from "react";

const nav = [
  ["/", "홈"],
  ["/expressions", "표현"],
  ["/history", "기록"],
  ["/settings", "설정"],
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="OPIc Speech Quest 홈">
          <span className="brand-mark">SQ</span>
          <span>Speech Quest</span>
        </Link>
        <nav aria-label="주요 메뉴">
          {nav.map(([href, label]) => (
            <Link key={href} href={href}>{label}</Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}

