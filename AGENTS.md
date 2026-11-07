# WattWise agent notes

Read these before editing. Prefer repo docs over memory.

## Branches

- Teammate base: `codex/wattwise-implementation`
- UI / presentation work: `codex/wattwise-ui-presentation`
- Do not merge the UI branch into the implementation branch. Do not force-push the teammate’s branch.

## Sync

```sh
git fetch origin
git rev-parse HEAD origin/codex/wattwise-implementation
git log --oneline HEAD..origin/codex/wattwise-implementation
```

If the implementation tip moved, review commits and shared files, then integrate onto the UI branch only.

## Authority

| Topic | Source |
| --- | --- |
| HTTP contract | `docs/api.md`, `frontend/src/api.ts` |
| Data / probability gate | `docs/data-gate.md` |
| AI claims | `docs/ai-validation.md` |
| Demo script | `docs/demo.md` |
| Verification record | `docs/verification.md` |

## Cursor guidance

- Always-on: `.cursor/rules/wattwise-invariants.mdc`
- Frontend: `.cursor/rules/wattwise-frontend.mdc`
- API boundary: `.cursor/rules/wattwise-api-boundary.mdc`
- Workflow skill: `.cursor/skills/wattwise-collab/SKILL.md`

## Ownership

Alan — resident UI, preparation, presenter assets, UI/API integration. 
Teammate — weather/outage data, index validation, Rust risk API. Coordinate shared module edits explicitly.

## Git identity (this machine)

- Commits must use **Alan Perez** / `uhaop` (`50084395+uhaop@users.noreply.github.com`).
- Do not author as `durkisneer1` or other teammate identities even if those appear in history.
- See `.cursor/rules/git-identity.mdc`.
