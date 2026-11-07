import React from "react";
import { ArrowUpRight } from "lucide-react";
import type { Plan } from "../api";
import { ACTION_BRIEFS, SOURCE_BRIEFS } from "../lib/sourceBriefs";

type Props = {
  actionId: string;
  sourceIds: string[];
  sources: Plan["sources"];
};

export function SourceGuidance({ actionId, sourceIds, sources }: Props) {
  const actionBrief = ACTION_BRIEFS[actionId];
  return (
    <div className="source-guidance">
      {actionBrief ? <p className="source-action-brief">{actionBrief}</p> : null}
      {sourceIds.map((id) => {
        const source = sources.find((s) => s.source_id === id);
        const brief = SOURCE_BRIEFS[id];
        if (!source) return null;
        return (
          <aside key={id} className="source-brief">
            {brief ? <p>{brief.blurb}</p> : null}
            <a href={source.url} target="_blank" rel="noreferrer">
              {brief?.moreLabel ?? `Additional details provided here (${source.name})`}{" "}
              <ArrowUpRight size={12} aria-hidden />
            </a>
          </aside>
        );
      })}
    </div>
  );
}
