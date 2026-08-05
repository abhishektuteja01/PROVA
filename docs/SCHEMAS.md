# Prova — Zod Schemas
**Version:** 1.0 | **Date:** March 19, 2026

All schemas live in `/src/lib/validation/schemas.ts`.
Import from this file — do not define schemas inline in API routes or components.

---

## Installation
```bash
npm install zod
```

---

## Reference: schemas.ts

> **`src/lib/validation/schemas.ts` is the source of truth, not this file.**
> What follows is an annotated reference covering the schemas you will touch
> most often. It is not a complete transcription — the module also exports the
> element-code enums, `PillarScoresSchema`, `ScoringInputSchema`,
> `ModelRowSchema`, and the benchmark schemas documented in §Benchmarks below.
> When the two disagree, the code wins; fix the doc.

```typescript
import { z } from 'zod';

// ─── File upload constants ───────────────────────────────────────────────
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;
export const ALLOWED_EXTENSIONS = ['.pdf', '.docx'] as const;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// ─────────────────────────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────────────────────────

export const PillarEnum = z.enum([
  'conceptual_soundness',
  'outcomes_analysis',
  'ongoing_monitoring'
]);

export const SeverityEnum = z.enum(['Critical', 'Major', 'Minor']);

export const StatusEnum = z.enum([
  'Compliant',
  'Needs Improvement',
  'Critical Gaps'
]);

export const ConfidenceLabelEnum = z.enum(['High', 'Medium', 'Low']);

// Model type — must stay in lockstep with the public.model_type SQL enum
// (see supabase/migrations/20260501000000_model_type_benchmarks.sql).
// Adding a value here without the matching ALTER TYPE will fail at insert.
export const ModelTypeEnum = z.enum([
  'credit_risk_pd_lgd_ead',
  'allowance_cecl_ifrs9',
  'market_risk_var',
  'alm_irrbb',
  'stress_testing_ccar',
  'aml_fraud',
  'credit_decisioning',
  'other'
]);

export type ModelType = z.infer<typeof ModelTypeEnum>;

// MODEL_TYPE_LABELS maps each enum value to its display string — see code.

// CS element codes
export const CSElementCodeEnum = z.enum([
  'CS-01', 'CS-02', 'CS-03', 'CS-04', 'CS-05', 'CS-06', 'CS-07'
]);

// OA element codes
export const OAElementCodeEnum = z.enum([
  'OA-01', 'OA-02', 'OA-03', 'OA-04', 'OA-05', 'OA-06', 'OA-07'
]);

// OM element codes
export const OMElementCodeEnum = z.enum([
  'OM-01', 'OM-02', 'OM-03', 'OM-04', 'OM-05', 'OM-06'
]);

export const ElementCodeEnum = z.union([
  CSElementCodeEnum,
  OAElementCodeEnum,
  OMElementCodeEnum
]);

// ─────────────────────────────────────────────────────────────────────────────
// GAP SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export const GapSchema = z.object({
  element_code: ElementCodeEnum,
  element_name: z.string().min(1).max(200),
  severity: SeverityEnum,
  description: z.string().min(1).max(1000),
  recommendation: z.string().min(1).max(1000)
});

export type Gap = z.infer<typeof GapSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// AGENT OUTPUT SCHEMA
// Validates response from each of the three pillar agents
// ─────────────────────────────────────────────────────────────────────────────

export const AgentOutputSchema = z.object({
  pillar: PillarEnum,
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  gaps: z.array(GapSchema),
  summary: z.string().min(1).max(2000)
});

export type AgentOutput = z.infer<typeof AgentOutputSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// AGENT FEEDBACK SCHEMA (used within JudgeOutput)
// ─────────────────────────────────────────────────────────────────────────────

export const AgentFeedbackSchema = z.object({
  complete: z.boolean(),
  issues: z.array(z.string())
});

// ─────────────────────────────────────────────────────────────────────────────
// JUDGE OUTPUT SCHEMA
// Validates response from the Judge Agent
// ─────────────────────────────────────────────────────────────────────────────

export const JudgeOutputSchema = z.object({
  confidence: z.number().min(0).max(1),
  confidence_label: ConfidenceLabelEnum,
  is_consistent: z.boolean(),
  anomaly_detected: z.boolean(),
  anomaly_description: z.string().nullable(),
  agent_feedback: z.object({
    conceptual_soundness: AgentFeedbackSchema,
    outcomes_analysis: AgentFeedbackSchema,
    ongoing_monitoring: AgentFeedbackSchema
  }),
  retry_recommended: z.boolean()
});

export type JudgeOutput = z.infer<typeof JudgeOutputSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// SCORING TYPES
// ─────────────────────────────────────────────────────────────────────────────

export const PillarScoresSchema = z.object({
  conceptual_soundness: z.number().min(0).max(100),
  outcomes_analysis: z.number().min(0).max(100),
  ongoing_monitoring: z.number().min(0).max(100)
});

export type PillarScores = z.infer<typeof PillarScoresSchema>;

export const ScoringResultSchema = z.object({
  pillar_scores: PillarScoresSchema,
  final_score: z.number().min(0).max(100),
  status: StatusEnum,
  total_gaps: z.number().min(0),
  critical_gap_count: z.number().min(0),
  major_gap_count: z.number().min(0),
  minor_gap_count: z.number().min(0)
});

export type ScoringResult = z.infer<typeof ScoringResultSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128)
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  confirmPassword: z.string().min(8).max(128)
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export type SignupInput = z.infer<typeof signupSchema>;

export const documentUploadSchema = z.object({
  name: z.string().min(1),
  type: z.enum(ALLOWED_MIME_TYPES),
  size: z.number().min(1).max(MAX_FILE_SIZE_BYTES)
});

export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// API REQUEST SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/compliance — request body
export const ComplianceRequestSchema = z.object({
  model_name: z.string()
    .min(1, 'Model name is required')
    .max(200, 'Model name must be under 200 characters')
    .regex(/^[a-zA-Z0-9 \-_().]+$/, 'Model name contains invalid characters'),
  model_type: ModelTypeEnum.default('other'),
  // is_synthetic must be settable at submission time so the test suite can tag
  // synthetic-corpus runs without polluting real-corpus benchmark stats. The
  // route handler is the trust boundary — clients may pass true, but only
  // authenticated users can submit at all and synthetic-tagging is benign.
  is_synthetic: z.boolean().default(false),
  document_text: z.string()
    .min(100, 'Document must be at least 100 characters')
    .max(50000, 'Document must be under 50,000 characters')
    .optional(),
  // file is handled as multipart/form-data, not in this schema
});

export type ComplianceRequest = z.infer<typeof ComplianceRequestSchema>;

// POST /api/report — request body
export const ReportRequestSchema = z.object({
  submission_id: z.string().uuid('Invalid submission ID')
});

export type ReportRequest = z.infer<typeof ReportRequestSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// API RESPONSE SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/compliance — success response
export const ComplianceResponseSchema = z.object({
  submission_id: z.string().uuid(),
  model_name: z.string(),
  version: z.number().int().min(1),
  scoring: ScoringResultSchema,
  pillar_outputs: z.object({
    conceptual_soundness: AgentOutputSchema,
    outcomes_analysis: AgentOutputSchema,
    ongoing_monitoring: AgentOutputSchema
  }),
  judge: JudgeOutputSchema,
  all_gaps: z.array(GapSchema),
  retry_count: z.number().int().min(0).max(2),
  created_at: z.string().datetime()
});

export type ComplianceResponse = z.infer<typeof ComplianceResponseSchema>;

// GET /api/submissions — list response item
export const SubmissionListItemSchema = z.object({
  id: z.string().uuid(),
  model_name: z.string(),
  model_type: ModelTypeEnum,
  is_synthetic: z.boolean(),
  version_number: z.number().int().min(1),
  conceptual_score: z.number().min(0).max(100),
  outcomes_score: z.number().min(0).max(100),
  monitoring_score: z.number().min(0).max(100),
  final_score: z.number().min(0).max(100),
  status: StatusEnum,
  assessment_confidence_label: ConfidenceLabelEnum,
  created_at: z.string().datetime()
});

export type SubmissionListItem = z.infer<typeof SubmissionListItemSchema>;

// GET /api/submissions/[id] — full submission response
// Detail view needs each gap's row id so the UI can key and link individual
// gaps — the list view does not, so only this schema carries it.
export const GapWithIdSchema = GapSchema.extend({
  id: z.string().uuid()
});

export type GapWithId = z.infer<typeof GapWithIdSchema>;

export const SubmissionDetailSchema = SubmissionListItemSchema.extend({
  document_text: z.string().min(100).max(50000),
  gap_analysis: z.array(GapWithIdSchema),
  judge_confidence: z.number().min(0).max(1)
});

export type SubmissionDetail = z.infer<typeof SubmissionDetailSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// DATABASE ROW SCHEMAS
// Maps to Supabase table rows (after RLS — only user's own data)
// ─────────────────────────────────────────────────────────────────────────────

export const ModelRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  model_name: z.string().max(200),
  created_at: z.string().datetime()
});

export type ModelRow = z.infer<typeof ModelRowSchema>;

export const SubmissionRowSchema = z.object({
  id: z.string().uuid(),
  model_id: z.string().uuid(),
  user_id: z.string().uuid(),
  version_number: z.number().int().min(1),
  model_type: ModelTypeEnum,
  is_synthetic: z.boolean(),
  document_text: z.string().min(100).max(50000),
  conceptual_score: z.number(),
  outcomes_score: z.number(),
  monitoring_score: z.number(),
  final_score: z.number(),
  gap_analysis: z.array(GapSchema).nullable(),
  retry_count: z.number().int().min(0).max(2),
  judge_confidence: z.number(),
  assessment_confidence_label: ConfidenceLabelEnum,
  created_at: z.string().datetime()
});

export type SubmissionRow = z.infer<typeof SubmissionRowSchema>;

export const GapRowSchema = z.object({
  id: z.string().uuid(),
  submission_id: z.string().uuid(),
  user_id: z.string().uuid(),
  pillar: PillarEnum,
  element_code: ElementCodeEnum,
  element_name: z.string(),
  severity: SeverityEnum,
  description: z.string(),
  recommendation: z.string(),
  created_at: z.string().datetime()
});

export type GapRow = z.infer<typeof GapRowSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// USER PREFERENCES SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export const UserPreferencesSchema = z.object({
  show_overview_panel: z.boolean().default(true),
  show_model_inventory: z.boolean().default(true),
  show_score_progression: z.boolean().default(true),
  show_recent_activity: z.boolean().default(true)
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// SCORING CALCULATOR TYPES (used in /src/lib/scoring/calculator.ts)
// ─────────────────────────────────────────────────────────────────────────────

export const ScoringInputSchema = z.object({
  cs_output: AgentOutputSchema,
  oa_output: AgentOutputSchema,
  om_output: AgentOutputSchema
});

export type ScoringInput = z.infer<typeof ScoringInputSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// ERROR RESPONSE SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

export const ErrorResponseSchema = z.object({
  error: z.string(),
  error_code: z.string(),
  message: z.string(),
  retry_after_seconds: z.number().optional() // Only for rate limit errors
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// PAGINATION & PARAM SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const PaginationParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});

export type PaginationParams = z.infer<typeof PaginationParamsSchema>;

export const UuidParamSchema = z.object({
  id: z.string().uuid('Invalid submission ID')
});

export type UuidParam = z.infer<typeof UuidParamSchema>;

export const DeleteAllConfirmSchema = z.object({
  confirm: z.literal(true, { message: 'Confirmation required' })
});

export type DeleteAllConfirm = z.infer<typeof DeleteAllConfirmSchema>;
```

---

## Usage Examples

### Validating agent output in orchestrator.ts
```typescript
import { AgentOutputSchema, type AgentOutput } from '@/lib/validation/schemas';

const rawOutput = JSON.parse(response.content[0].text);
const result = AgentOutputSchema.safeParse(rawOutput);

if (!result.success) {
  // Schema validation failed — trigger retry
  throw new Error(`Agent output schema validation failed: ${result.error.message}`);
}

const validatedOutput: AgentOutput = result.data;
```

### Validating API request body
```typescript
import { ComplianceRequestSchema } from '@/lib/validation/schemas';

export async function POST(request: Request) {
  const body = await request.json();
  const result = ComplianceRequestSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      { error: 'VALIDATION_ERROR', message: result.error.message },
      { status: 400 }
    );
  }

  const { model_name, document_text } = result.data;
  // proceed...
}
```

---

## Benchmarks

Backing `GET /api/benchmarks` and `GET /api/benchmarks/disclosure`.

```typescript
// Below this corpus size, medians are suppressed rather than shown.
// A median over 1–4 rows can equal another user's exact score, so publishing
// it would leak individual data through an aggregate endpoint.
export const BENCHMARK_MIN_CORPUS_N = 5;

export const TopGapEntrySchema = z.object({
  element_code: ElementCodeEnum,
  element_name: z.string(),
  frequency: z.number().int().min(0)
});

export const BenchmarkStatsSchema = z.object({
  model_type: ModelTypeEnum,
  include_synthetic: z.boolean(),
  corpus_n: z.number().int().min(0),
  synthetic_n: z.number().int().min(0),
  real_n: z.number().int().min(0),
  // Medians are nullable: suppressed when corpus_n < BENCHMARK_MIN_CORPUS_N
  // (server-side enforcement on top of any client-side guard).
  cs_median: z.number().min(0).max(100).nullable(),
  oa_median: z.number().min(0).max(100).nullable(),
  om_median: z.number().min(0).max(100).nullable(),
  final_median: z.number().min(0).max(100).nullable(),
  top_gaps: z.array(TopGapEntrySchema)
});

export const CorpusDisclosureSchema = z.object({
  total_n: z.number().int().min(0),
  synthetic_n: z.number().int().min(0),
  real_n: z.number().int().min(0)
});

export const BenchmarkQuerySchema = z.object({
  model_type: ModelTypeEnum,
  include_synthetic: z.coerce.boolean().default(true)
});
```

Two things these schemas encode deliberately:

- **The medians are `.nullable()`, not optional.** Suppression is a value the
  API returns, not a field it omits, so a client cannot mistake "withheld for
  privacy" for "not sent". `corpus_n` is always returned truthfully so the UI
  can render "Insufficient corpus (N=X)".
- **`top_gaps` carries `element_code`, `element_name` and a frequency — and
  nothing else.** No description, no recommendation, no submission or user id.
  The schema is the second line of defence behind the `SECURITY DEFINER`
  function; both are written so per-row content cannot leave the database.

---

*Prova Schemas v1.0 | March 2026*
