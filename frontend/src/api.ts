import { z } from "zod";
export const Source = z.object({
  source_id: z.string(),
  name: z.string(),
  url: z
    .string()
    .url()
    .refine((v) => v.startsWith("https://")),
});
const instant = z.string().datetime();
export const RiskSchema = z.object({
  risk_id: z.string(),
  county_fips: z.string().nullable(),
  county_name: z.string().nullable(),
  geographic_unit: z.literal("county"),
  event_definition: z.string().nullable(),
  issued_at: instant.nullable(),
  assessment_created_at: instant,
  valid_from: instant.nullable(),
  valid_to: instant.nullable(),
  fetched_at: instant.nullable(),
  expires_at: instant,
  mode: z.enum(["weather_index", "unavailable"]),
  status: z.enum(["current", "stale", "unsupported", "unavailable"]),
  probability: z.null(),
  index_value: z.number().min(0).max(9).nullable(),
  index_scale: z.literal(9).nullable(),
  risk_band: z.enum(["lower", "elevated", "high", "unknown"]),
  display_label: z.string(),
  weather_features: z
    .object({
      max_gust_kmh: z.number(),
      precipitation_mm: z.number(),
      min_temperature_c: z.number(),
      max_temperature_c: z.number(),
    })
    .nullable(),
  hourly: z.array(
    z.object({
      time: instant,
      gust_kmh: z.number(),
      precipitation_mm: z.number(),
      temperature_c: z.number(),
    }),
  ),
  daily_outlook: z.array(
    z.object({
      date: z.string(),
      max_gust_kmh: z.number(),
      precipitation_mm: z.number(),
      min_temperature_c: z.number(),
      max_temperature_c: z.number(),
    }),
  ),
  evidence: z.array(z.string()),
  sources: z.array(Source),
  method_version: z.string(),
  limitations: z.array(z.string()),
  cached: z.boolean(),
});
export type Risk = z.infer<typeof RiskSchema>;
export type DailyOutlook = Risk["daily_outlook"][number];
export const ActionSchema = z.object({
  action_id: z.string(),
  priority: z.number(),
  title: z.string(),
  explanation: z.string(),
  source_ids: z.array(z.string()),
  completed: z.boolean(),
  alternative: z.string(),
  applicability: z.string(),
});
export const PlanSchema = z.object({
  risk_id: z.string(),
  language: z.literal("en"),
  actions: z.array(ActionSchema),
  checklist: z.array(ActionSchema),
  sources: z.array(Source),
  explanation_mode: z.enum([
    "approved_text_fallback",
    "ai_selected_approved_text",
  ]),
  limitations: z.array(z.string()),
});
export type Plan = z.infer<typeof PlanSchema>;
export type Answer = "yes" | "no" | "unknown" | "prefer_not_to_answer";
export type Household = {
  backup_power: Answer;
  equipment: Answer;
  transportation: Answer;
};
export async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(20000)])
      : AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      data.error ??
        "The service could not complete this request. Please try again.",
    );
  }
  return schema.parse(await response.json());
}
export function freshness(r: Risk, now = Date.now()) {
  return r.status === "current" && now >= Date.parse(r.expires_at)
    ? "stale"
    : r.status;
}

/** GET /api/method — documented weather-index rules from the Rust service. */
export const MethodSchema = z.object({
  version: z.string(),
  scale: z.number(),
  wind: z.string(),
  rain: z.string(),
  temperature: z.string(),
  bands: z.string(),
});
export type Method = z.infer<typeof MethodSchema>;
