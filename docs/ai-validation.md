# AI we used and how we checked it

## What actually runs

- The weather index is **deterministic rules, not ML**. It uses retrieved Open-Meteo inputs and does not output outage probabilities.
- An optional OpenAI Chat Completions integration selects between two approved explanation variants for each general action, using supplied weather context. It is a constrained language-understanding task; it does not write unrestricted safety advice or change priority rules. Residents explicitly opt in.
- No live model call was verified: credentials/model configuration were not present. The displayed no-key mode is clearly labeled source-backed fallback. Do not claim the demo uses live AI until configuration and a real successful call have been checked.
- No trained outage classifier exists. Code-generation assistance is development tooling, not AI operating inside WattWise.

## Grounding and output validation

Deterministic rules select eligible action IDs and priorities. Equipment/support actions and raw household answers are excluded from provider requests. For general actions the provider receives only approved candidate wording and weather evidence. Its JSON response must preserve the exact action IDs, order and count, use only `standard`/`alternative`, and have no extra fields. Application code selects the corresponding fixed text and preserves approved sources. A timeout, refusal, malformed structure, missing/extra/unknown ID, reordered ID, injected prose, unknown variant, unavailable provider or exhausted concurrency slot returns approved fallback text.

[Official API reference](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create) was checked for the request format. JSON mode is followed by strict application validation. The request has a bounded token budget, a twelve-second client timeout and at most two concurrent AI calls. `store: false` is used. No secrets reach the frontend.

## Actual checks

Rust tests exercise malformed JSON, incomplete selections, invented IDs, forbidden extra fields, valid approved alternative selection, action-source integrity, household independence, unknown answers and completion. HTTP/browser checks verify the no-key fallback. No model-quality metric or human evaluation outcome is asserted.

Next: configure an available JSON-mode model and key, test fictional profiles across forecast scenarios, record actual fallback rates/latency, and review variant usefulness/readability. The constrained design limits novelty; that is an explicit product tradeoff. If hackathon rules require generative free text or a stronger AI contribution, review this scope with the team rather than claiming unsupported functionality.
