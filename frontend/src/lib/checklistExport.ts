import type { Plan, Risk } from "../api";
import { formatCentral } from "./time";

type ExportInput = {
  plan: Plan;
  risk: Risk | null;
  completed: string[];
};

function buildText({ plan, risk, completed }: ExportInput) {
  const done = plan.checklist.filter((a) => completed.includes(a.action_id));
  const lines = [
    "WattWise preparation checklist",
    "Completion tracks your selections, not a household safety score.",
    "",
  ];
  if (risk) {
    lines.push(
      `Area: ${risk.county_name ?? risk.county_fips ?? "Unknown"}`,
      `Status: ${risk.status}`,
      `Mode: ${risk.mode}`,
      `Weather index: ${risk.index_value ?? "—"} / ${risk.index_scale ?? "—"}`,
      `Forecast window: ${formatCentral(risk.valid_from)} → ${formatCentral(risk.valid_to)}`,
      `Assessment created: ${formatCentral(risk.assessment_created_at)}`,
      `Retrieved: ${formatCentral(risk.fetched_at)}`,
      "",
    );
  } else {
    lines.push("No current area assessment attached.", "");
  }
  lines.push(
    `Checklist progress: ${done.length} of ${plan.checklist.length} completed`,
    "",
  );
  for (const action of plan.checklist) {
    const mark = completed.includes(action.action_id) ? "[x]" : "[ ]";
    lines.push(`${mark} ${action.title}`);
    lines.push(`    ${action.explanation}`);
    for (const id of action.source_ids) {
      const source = plan.sources.find((s) => s.source_id === id);
      if (source) lines.push(`    Source: ${source.name} — ${source.url}`);
    }
    lines.push("");
  }
  if (plan.limitations.length) {
    lines.push("Limitations:");
    for (const item of plan.limitations) lines.push(`- ${item}`);
  }
  lines.push("", `Saved ${formatCentral(new Date().toISOString())}`);
  return lines.join("\n");
}

export function downloadChecklist(input: ExportInput) {
  const text = buildText(input);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "wattwise-checklist.txt";
  a.click();
  URL.revokeObjectURL(url);
}

export function printChecklist(input: ExportInput) {
  const text = buildText(input).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const html = `<!doctype html><html><head><title>WattWise checklist</title>
<style>
body{font-family:Manrope,Segoe UI,sans-serif;color:#122A33;padding:24px;line-height:1.5}
h1{font-size:20px;margin:0 0 8px}
pre{white-space:pre-wrap;font:inherit}
.note{color:#5f7270;font-size:12px;margin-bottom:16px}
</style></head><body>
<h1>WattWise preparation checklist</h1>
<p class="note">Completion tracks your selections, not a household safety score.</p>
<pre>${text}</pre>
</body></html>`;
  const frame = document.createElement("iframe");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) {
    document.body.removeChild(frame);
    window.print();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  frame.contentWindow?.focus();
  frame.contentWindow?.print();
  setTimeout(() => document.body.removeChild(frame), 1000);
}
