# API integration contract

All timestamps are ISO 8601 UTC. UI converts them to America/Chicago. `/api/risk` accepts only `county_fips` (required). Invalid syntax returns 400; unrecognized query fields are rejected. Unsupported five-digit county codes return a response with status `unsupported`, null county identity, null index and probability. The supported code is 48201.

The exact serialized fixtures produced by Rust tests are in `tests/fixtures/risk.json` and `plan.json`. They are **synthetic test data**, never live forecasts or historical replays. The frontend tests parse these same files with runtime schemas.

Risk fields:

- `risk_id`: server-generated UUID; a new assessment is created on successful weather refresh.
- `county_fips`, `county_name`: nullable; `geographic_unit`: `county`.
- `event_definition`: null, because the weather index does not predict a validated outage event.
- `issued_at`: null (upstream model issue time unavailable); `assessment_created_at`: application calculation time.
- `valid_from`, `valid_to`: nullable, next full UTC hour through 24 hours later. 24 complete consecutive hourly samples required.
- `fetched_at`: nullable actual retrieval time; `expires_at`: assessment expiry, 30 minutes after creation.
- `mode`: `weather_index` or `unavailable`; `status`: `current`, `stale`, `unsupported`, `unavailable`.
- `probability`: always null. `index_value`: integer 0–9 or null; `index_scale`: 9 or null.
- `risk_band`: `lower`, `elevated`, `high`, `unknown`; `display_label`: visible method/status label.
- `weather_features`: nullable object with `max_gust_kmh`, `precipitation_mm`, `min_temperature_c`, `max_temperature_c`.
- `hourly`: list of `{time,gust_kmh,precipitation_mm,temperature_c}`; empty if unavailable.
- `evidence`: plain strings describing point contributions. `sources`: `{source_id,name,url}` list.
- `method_version`, `limitations`, `cached`: provenance. Stale responses preserve original timestamps; UI hides old weather values and blocks a new plan until refreshed.

Successful fetches are reused for ten minutes. A refresh mutex prevents concurrent upstream fan-out; attempts are at least sixty seconds apart. On refresh failure a previous result can remain current until its thirty-minute freshness limit, then becomes explicitly stale. Unknown source issue time must not be inferred from retrieval time.

Plan request:

```json
{
  "risk_id": "server-issued-id",
  "household": {"backup_power": "no", "equipment": "unknown", "transportation": "no"},
  "completed": ["lighting"],
  "use_ai": false
}
```

Household, completed and use_ai are optional. Each answer is `yes`, `no`, `unknown`, or `prefer_not_to_answer`; omitted answers become unknown. Unknown properties and enum values are rejected. Completed IDs must exist in the action bank; maximum eight entries. No user-supplied score is accepted.

Plan response: `risk_id`, `language` (`en`), `actions` (up to three unfinished eligible priorities), `checklist` (all eligible actions), `sources`, `explanation_mode` (`approved_text_fallback` or `ai_selected_approved_text`), and `limitations`.

Actions contain `action_id`, `priority` (lower means earlier), `title`, `explanation`, `source_ids`, `completed`, `alternative`, and `applicability`. Eligibility is enforced by code, not by parsing the human-readable applicability field. Unknown answers select only general guidance. Equipment=yes takes first priority; transportation=no next; backup=yes adds review, backup=no promotes lighting. Completion removes a recommendation from the pending top three, retaining it in the checklist. Fewer than three appear when fewer than three remain.

The action source registry is fixed. Model output contains only `{selections:[{action_id,variant}]}`; every ID, order, count, field and variant is checked. The model cannot supply URLs, text, timestamps, numbers, or priorities. The server ignores no unknown model fields: it rejects the response and falls back.

No API household payloads are logged or persisted. API responses use `Cache-Control: no-store`. CORS permits one exact configured origin. Request bodies are limited to 8 KiB. This is a local demo, not a hardened public multi-tenant API.
