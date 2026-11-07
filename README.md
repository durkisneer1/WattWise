# WattWise

A Houston-area outage-readiness prototype: check the next 24 hours of weather, then build a source-linked household preparation plan. Different household answers change the plan, never the area weather assessment.

## Run locally

Requirements: Node.js 22.12+ with npm, Rust 1.85+ with Cargo, and Python 3 for the data audit. Internet access is needed for initial dependencies and live forecasts. Run the server from the repository root so it can serve the frontend build.

```sh
cd frontend
npm ci
npm run build
cd ..
cargo run --manifest-path backend/Cargo.toml
```

Open http://127.0.0.1:3001. The Rust server serves the built React application and API together. It binds to loopback, not the public network. No database, credentials, or Python process is needed for the weather-index workflow.

For frontend development, keep Rust running and run `npm run dev` inside `frontend`. Open http://127.0.0.1:5173; Vite proxies `/api` and `/health` to port 3001. If changing ports, update the Vite proxy and CORS origin accordingly.

On the implementation machine, Node was absent from PATH; a temporary official runtime was downloaded to `/tmp/node-v22.23.4-linux-x64/bin`. To reuse it while it exists, prepend that directory to PATH. Rust dependencies were tested with `CARGO_HOME=/tmp/wattwise-cargo`. These temporary caches are not repository requirements and may disappear after reboot.

## Implemented

- React + TypeScript + Vite + Tailwind, responsive layout, keyboard-operable forms, native expandable evidence/checklists, and SVG weather chart with an accessible values table.
- Rust Axum API with typed county selection, real Open-Meteo weather, input validation, timeouts, shared refresh cache, explicit unavailable/stale/unsupported states, and expiring assessment IDs.
- Harris County selection, using a clearly disclosed Houston reference weather point. No address, ZIP geocoder, boundary inference or county-wide weather aggregation.
- Documented 0–9 weather index. **It is not an outage probability.** Probability is always null; no model accuracy claims are made.
- Optional household selections, three pending priorities, completion tracking, and reviewed Red Cross/CDC source links. No names, diagnoses, accounts, request-body logs, household persistence or analytics.
- Optional OpenAI integration selecting approved explanation variants for general actions, strict output validation, concurrency limit and deterministic fallback. Free-form generated safety advice is not displayed.
- Python county-outage CSV audit that identifies missing intervals without treating missing observations as zero.

## Architecture and API

`frontend/src/api.ts` validates responses with Zod. `backend/src/risk.rs` owns forecast normalization and the index; `plan.rs` owns approved actions, applicability, priorities and AI validation; `main.rs` owns routing, cache and assessment identity. `ml/audit_data.py` is an offline data gate; there is no running Python inference service because no model has passed validation.

| Endpoint | Behavior |
| --- | --- |
| `GET /health` | Application status and observed dependency/configuration state; does not claim configured AI was verified. |
| `GET /api/risk?county_fips=48201` | County weather index and provenance. Other valid FIPS codes produce unsupported status. Coordinates are intentionally not accepted. |
| `POST /api/plan` | Resolves server-issued risk ID and validates optional household fields/completed IDs. Unknown or expired ID: HTTP 409. |
| `GET /api/actions` | Approved action bank, applicability and source registry. |
| `GET /api/method` | Index rules and version. |

See [API contract](docs/api.md), [methodology/data gate](docs/data-gate.md), and [implementation plan](docs/implementation-plan.md). Synthetic contract fixtures under `tests/fixtures` are test-only and never imported by the application entry point.

## Configuration

`.env.example` lists settings. Environment variables must be **exported in your shell**; the app does not automatically read `.env`.

| Variable | Default / purpose |
| --- | --- |
| `PORT` | 3001 |
| `FRONTEND_ORIGIN` | `http://127.0.0.1:5173`; exact allowed development origin |
| `OPENAI_API_KEY` | Optional server-only secret; never put in a Vite variable |
| `OPENAI_MODEL` | Required along with key to enable AI; choose a model available to your account that supports Chat Completions JSON mode |

Residents must opt into AI wording. Only general weather and approved general-action candidates are sent to OpenAI; raw household answers, equipment/support actions, completion history and precise home location are not sent. Responses use `store: false`; provider policies still apply. No provider credentials were present during verification, so a real model call has **not** been tested.

## Verification

```sh
cargo test --manifest-path backend/Cargo.toml
cd frontend
npm test
npm run build
cd ..
python3 -m unittest discover -s ml -v
# With the local server running:
python3 tests/smoke.py
```

Verified November 7, 2026: 14 Rust tests, 5 frontend tests, 4 Python tests; TypeScript/production build; live-weather HTTP smoke; desktop and 390px mobile browser checks; household-priority changes; checklist completion; unsupported county; no-key AI fallback; evidence panel. Browser error logs were empty. Dependency installation audit reported zero advisories after updating affected packages. See [verification details](docs/verification.md).

## Limits and next steps

Weather is a point forecast, not grid telemetry, a whole-county aggregate or an official warning. Project-chosen thresholds have not been validated against outages. Open-Meteo's forecast endpoint does not supply model issue time: `issued_at` remains null, separately from actual fetch/assessment timestamps. Display times use America/Chicago. Cached results refresh after ten minutes; results are stale after thirty. A missing forecast cannot become a zero index.

No trained ML model or measured predictive performance exists. EAGLE-I retrieval was blocked by a rate-limit page; archive overlap and credible negative labels remain unverified. Training/inference is therefore deferred, not simulated. See the data gate before attempting training.

Priority next steps: configure and evaluate real AI wording selection, obtain and audit licensed county outage data with as-issued forecasts, calibrate/evaluate a model before probability presentation, then harden for deployment (authentication/rate limits, monitoring and production review). Additional counties, Spanish, resources, battery sizing, notifications and accounts are outside this release.

[Four-minute demo](docs/demo.md) · [AI we used and how we checked it](docs/ai-validation.md)
