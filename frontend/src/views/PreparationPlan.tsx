import React, { useState } from "react";
import {
  ShieldCheck,
  Check,
  RefreshCw,
  House,
  Download,
  Printer,
  Circle,
} from "lucide-react";
import type { Answer, Household, Plan, Risk } from "../api";
import { SourceGuidance } from "../components/SourceGuidance";
import { downloadChecklist, printChecklist } from "../lib/checklistExport";

type Props = {
  household: Household;
  onHouseholdChange: (next: Household) => void;
  useAI: boolean;
  onUseAIChange: (value: boolean) => void;
  plan: Plan | null;
  risk: Risk | null;
  planning: boolean;
  planError: string;
  completed: string[];
  onToggleComplete: (actionId: string) => void;
  supported: boolean;
  status: string | null;
  onAssess: () => void;
  onGoArea: () => void;
};

const QUESTIONS = [
  { key: "backup_power" as const, label: "Backup power available?" },
  {
    key: "equipment" as const,
    label: "Electricity-dependent equipment in the home?",
  },
  {
    key: "transportation" as const,
    label: "Reliable transportation available?",
  },
];

function answerLabel(a: Answer) {
  switch (a) {
    case "yes":
      return "Yes";
    case "no":
      return "No";
    case "unknown":
      return "Unsure";
    case "prefer_not_to_answer":
      return "Skip";
    default: {
      const _exhaustive: never = a;
      return _exhaustive;
    }
  }
}

export function PreparationPlan({
  household,
  onHouseholdChange,
  useAI,
  onUseAIChange,
  plan,
  risk,
  planning,
  planError,
  completed,
  onToggleComplete,
  supported,
  status,
  onAssess,
  onGoArea,
}: Props) {
  const [openBrief, setOpenBrief] = useState<string | null>(null);

  const items = plan?.checklist ?? [];
  const doneCount = items.filter((a) =>
    completed.includes(a.action_id),
  ).length;
  const total = items.length;
  const openItems = items.filter((a) => !completed.includes(a.action_id));
  const doneItems = items.filter((a) => completed.includes(a.action_id));
  const pct = total === 0 ? 0 : Math.round((doneCount / total) * 100);

  return (
    <div className="prep-layout">
      <header className="prep-intro">
        <div>
          <p className="eyebrow">Preparation</p>
          <h2>Household priorities</h2>
          <p>
            Answers reorder this checklist only — they never change the area
            weather index.
          </p>
        </div>
        {plan && supported && status !== "stale" ? (
          <div className="prep-ring" aria-hidden>
            <svg viewBox="0 0 36 36">
              <circle
                className="prep-ring-track"
                cx="18"
                cy="18"
                r="15.5"
                pathLength={100}
              />
              <circle
                className="prep-ring-value"
                cx="18"
                cy="18"
                r="15.5"
                pathLength={100}
                style={{
                  strokeDasharray: `${pct} ${100 - pct}`,
                }}
              />
            </svg>
            <span>
              <strong>
                {doneCount}/{total}
              </strong>
              done
            </span>
          </div>
        ) : null}
      </header>

      <div className="prep-grid">
        <aside className="prep-household">
          <div className="prep-household-head">
            <House size={18} aria-hidden />
            <div>
              <h3>About your household</h3>
              <p>Session only · no medical advice</p>
            </div>
          </div>

          {QUESTIONS.map((q) => (
            <fieldset key={q.key} className="prep-question">
              <legend>{q.label}</legend>
              <div className="prep-segments" role="radiogroup">
                {(
                  ["yes", "no", "unknown", "prefer_not_to_answer"] as Answer[]
                ).map((a) => (
                  <label
                    key={a}
                    className={
                      household[q.key] === a ? "prep-segment selected" : "prep-segment"
                    }
                  >
                    <input
                      type="radio"
                      name={q.key}
                      value={a}
                      checked={household[q.key] === a}
                      onChange={() =>
                        onHouseholdChange({ ...household, [q.key]: a })
                      }
                    />
                    {answerLabel(a)}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          <label className="ai-toggle">
            <input
              type="checkbox"
              checked={useAI}
              onChange={(e) => onUseAIChange(e.target.checked)}
            />
            <span>
              Prefer AI-selected wording when available
              <small>
                Only general actions and weather go to the provider. Household
                answers stay on this server.
              </small>
            </span>
          </label>

          <div className="privacy">
            <ShieldCheck size={15} aria-hidden />
            <span>No names or addresses. Nothing is stored after this session.</span>
          </div>
        </aside>

        <section className="prep-board" aria-live="polite" aria-busy={planning && !plan}>
          <div className="prep-board-head">
            <div>
              <h3>Checklist</h3>
              <p>
                {planning && plan
                  ? "Updating priorities…"
                  : plan
                    ? plan.explanation_mode === "ai_selected_approved_text"
                      ? "AI-selected approved text"
                      : "Source-backed guidance"
                    : "Ready when an area assessment loads"}
              </p>
            </div>
            {plan && total > 0 ? (
              <span className="prep-count">
                {doneCount} of {total} complete
              </span>
            ) : null}
          </div>

          {!supported ? (
            <div className="plan-empty">
              <ShieldCheck size={30} />
              <h3>Start with your area</h3>
              <p>
                Check a supported county on Area outlook, then return here for a
                source-linked checklist.
              </p>
              <button
                type="button"
                className="primary"
                style={{ margin: "16px auto 0" }}
                onClick={onGoArea}
              >
                Go to area outlook
              </button>
            </div>
          ) : status === "stale" ? (
            <div className="plan-empty">
              <RefreshCw size={28} />
              <h3>Refresh your area assessment</h3>
              <p>
                Your household answers stay put. Refresh so the checklist can
                reconnect to a recent forecast.
              </p>
              <button
                type="button"
                className="primary"
                style={{ margin: "16px auto 0" }}
                onClick={onAssess}
              >
                Refresh assessment
              </button>
            </div>
          ) : planning && !plan ? (
            <div className="plan-empty">
              <RefreshCw className="spin" size={24} />
              <p>Preparing your next steps…</p>
            </div>
          ) : planError && !plan ? (
            <div className="error" role="alert">
              {planError}
              <button type="button" onClick={onAssess}>
                Refresh assessment
              </button>
            </div>
          ) : plan ? (
            <>
              {planError ? (
                <div className="error" role="alert">
                  {planError}
                  <button type="button" onClick={onAssess}>
                    Refresh assessment
                  </button>
                </div>
              ) : null}

              <div className="prep-progress">
                <div
                  className="progress-bar"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-valuenow={doneCount}
                  aria-label={`${doneCount} of ${total} checklist items completed`}
                >
                  <i style={{ width: `${pct}%` }} />
                </div>
                <p>
                  Progress tracks what you marked — not a household safety
                  score.
                </p>
              </div>

              {openItems.length === 0 ? (
                <div className="plan-empty compact">
                  <Check size={28} />
                  <h3>Checklist complete for now</h3>
                  <p>
                    Review again when circumstances change. Completion is not a
                    safety score.
                  </p>
                </div>
              ) : (
                <ol className="prep-list">
                  {openItems.map((a, i) => {
                    const briefOpen = openBrief === a.action_id;
                    return (
                      <li key={a.action_id} className="prep-item">
                        <button
                          type="button"
                          className="prep-check"
                          aria-label={`Mark complete: ${a.title}`}
                          onClick={() => onToggleComplete(a.action_id)}
                        >
                          <span className="prep-step">{i + 1}</span>
                        </button>
                        <div className="prep-item-body">
                          <h4>{a.title}</h4>
                          <p>{a.explanation}</p>
                          <button
                            type="button"
                            className="prep-why"
                            aria-expanded={briefOpen}
                            onClick={() =>
                              setOpenBrief(briefOpen ? null : a.action_id)
                            }
                          >
                            {briefOpen ? "Hide guidance" : "Why this matters"}
                          </button>
                          {briefOpen ? (
                            <SourceGuidance
                              actionId={a.action_id}
                              sourceIds={a.source_ids}
                              sources={plan.sources}
                            />
                          ) : null}
                        </div>
                        <button
                          type="button"
                          className="prep-mark"
                          onClick={() => onToggleComplete(a.action_id)}
                        >
                          <Circle size={18} aria-hidden />
                          Mark done
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}

              {doneItems.length > 0 ? (
                <div className="prep-done-block">
                  <h4>Completed</h4>
                  <ul className="prep-list prep-list-done">
                    {doneItems.map((a) => (
                      <li key={a.action_id} className="prep-item done">
                        <button
                          type="button"
                          className="prep-check checked"
                          aria-label={`Mark incomplete: ${a.title}`}
                          onClick={() => onToggleComplete(a.action_id)}
                        >
                          <Check size={14} aria-hidden />
                        </button>
                        <div className="prep-item-body">
                          <h4>{a.title}</h4>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="checklist-actions no-print">
                <button
                  type="button"
                  className="primary"
                  onClick={() => downloadChecklist({ plan, risk, completed })}
                >
                  <Download size={15} /> Save checklist
                </button>
                <button
                  type="button"
                  className="primary primary-accent"
                  onClick={() => printChecklist({ plan, risk, completed })}
                >
                  <Printer size={15} /> Print checklist
                </button>
              </div>
              <p className="plan-note">
                {useAI && plan.explanation_mode === "approved_text_fallback"
                  ? "AI wording was not available or did not pass validation. Approved guidance is shown."
                  : "Prepared from reviewed public preparedness guidance."}
              </p>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
