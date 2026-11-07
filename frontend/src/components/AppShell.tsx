import React, { useEffect } from "react";
import {
  Zap,
  MapPinned,
  ClipboardList,
  LifeBuoy,
  BookOpen,
  Presentation,
} from "lucide-react";

export type ViewId =
  | "area"
  | "prepare"
  | "support"
  | "method"
  | "studio";

const NAV: {
  id: ViewId;
  label: string;
  short: string;
  hint: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "area",
    label: "Area outlook",
    short: "Area",
    hint: "24h weather index",
    icon: <MapPinned size={18} aria-hidden />,
  },
  {
    id: "prepare",
    label: "Preparation",
    short: "Prepare",
    hint: "Household plan",
    icon: <ClipboardList size={18} aria-hidden />,
  },
  {
    id: "support",
    label: "Local support",
    short: "Support",
    hint: "Official links",
    icon: <LifeBuoy size={18} aria-hidden />,
  },
  {
    id: "method",
    label: "Sources",
    short: "Method",
    hint: "How it works",
    icon: <BookOpen size={18} aria-hidden />,
  },
  {
    id: "studio",
    label: "Studio",
    short: "Studio",
    hint: "Demo sandbox",
    icon: <Presentation size={18} aria-hidden />,
  },
];

type Props = {
  view: ViewId;
  onNavigate: (view: ViewId) => void;
  children: React.ReactNode;
  statusNote?: string;
};

export function AppShell({ view, onNavigate, children, statusNote }: Props) {
  const active = NAV.find((n) => n.id === view);

  useEffect(() => {
    // New primary view should open at the top — don't keep the previous tab's scroll.
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const main = document.getElementById("main");
    if (main) main.scrollTop = 0;
  }, [view]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <aside className="sidebar" aria-label="WattWise navigation">
        <div className="sidebar-brand-block">
          <a
            href="#area"
            className="sidebar-brand"
            onClick={(e) => {
              e.preventDefault();
              onNavigate("area");
            }}
          >
            <span className="brand-mark" aria-hidden>
              <Zap size={22} fill="currentColor" />
            </span>
            <span className="brand-lockup">
              <span className="brand-text">
                Watt<span>Wise</span>
              </span>
              <span className="brand-sub">Houston readiness</span>
            </span>
          </a>
          <p className="sidebar-promise">
            See the weather stress ahead. Build a plan that fits your household.
          </p>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                "nav-item" + (view === item.id ? " nav-item-active" : "")
              }
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => onNavigate(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-copy">
                <span className="nav-label">{item.label}</span>
                <span className="nav-hint">{item.hint}</span>
              </span>
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <span className="coverage-pill">
            Harris · Fort Bend · Montgomery · Brazoria
          </span>
          {statusNote ? (
            <span className="sidebar-status">{statusNote}</span>
          ) : null}
          <span className="sidebar-meta">Experimental · not an outage %</span>
        </div>
      </aside>

      <div className="workspace">
        <header className="workspace-bar">
          <div className="workspace-bar-brand" aria-hidden>
            <Zap size={16} /> WattWise
          </div>
          <div className="workspace-bar-title">
            <p className="eyebrow">{active?.hint}</p>
            <h1>{active?.label}</h1>
          </div>
          {statusNote ? (
            <p className="workspace-status" aria-live="polite">
              {statusNote}
            </p>
          ) : (
            <span className="workspace-status muted">Awaiting assessment</span>
          )}
        </header>
        <main className="workspace-main" id="main">
          {children}
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Primary">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              "mobile-nav-item" +
              (view === item.id ? " mobile-nav-item-active" : "")
            }
            aria-current={view === item.id ? "page" : undefined}
            onClick={() => onNavigate(item.id)}
          >
            {item.icon}
            <span>{item.short}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
