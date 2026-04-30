import { z } from "zod";

// ─── File upload constants ────────────────────────────────────────────────────

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const ALLOWED_EXTENSIONS = [".pdf", ".docx"] as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// ─── Auth schemas ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

export const signupSchema = z
  .object({
    email: z.string().email().max(255),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const documentUploadSchema = z.object({
  name: z.string().min(1),
  type: z.enum(ALLOWED_MIME_TYPES),
  size: z.number().min(1).max(MAX_FILE_SIZE_BYTES),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;

// ─── Enums ────────────────────────────────────────────────────────────────────

export const PillarEnum = z.enum([
  "conceptual_soundness",
  "outcomes_analysis",
  "ongoing_monitoring",
]);

export const SeverityEnum = z.enum(["Critical", "Major", "Minor"]);

export const StatusEnum = z.enum([
  "Compliant",
  "Needs Improvement",
  "Critical Gaps",
]);

export type Status = z.infer<typeof StatusEnum>;

export const ConfidenceLabelEnum = z.enum(["High", "Medium", "Low"]);

// SR 11-7 element codes — exactly the codes defined in PRD Section 14.5
export const CSElementCodeEnum = z.enum([
  "CS-01",
  "CS-02",
  "CS-03",
  "CS-04",
  "CS-05",
  "CS-06",
  "CS-07",
]);

export const OAElementCodeEnum = z.enum([
  "OA-01",
  "OA-02",
  "OA-03",
  "OA-04",
  "OA-05",
  "OA-06",
  "OA-07",
]);

export const OMElementCodeEnum = z.enum([
  "OM-01",
  "OM-02",
  "OM-03",
  "OM-04",
  "OM-05",
  "OM-06",
]);

export const ElementCodeEnum = z.union([
  CSElementCodeEnum,
  OAElementCodeEnum,
  OMElementCodeEnum,
]);

// ─── Gap schema ───────────────────────────────────────────────────────────────

export const GapSchema = z.object({
  element_code: ElementCodeEnum,
  element_name: z.string().min(1).max(200),
  severity: SeverityEnum,
  description: z.string().min(1).max(1000),
  recommendation: z.string().min(1).max(1000),
});

export type Gap = z.infer<typeof GapSchema>;

// ─── Agent output schema ──────────────────────────────────────────────────────

export const AgentOutputSchema = z.object({
  pillar: PillarEnum,
  score: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1),
  gaps: z.array(GapSchema),
  summary: z.string().min(1).max(2000),
});

export type AgentOutput = z.infer<typeof AgentOutputSchema>;

// ─── Agent feedback schema (used within JudgeOutputSchema) ────────────────────

export const AgentFeedbackSchema = z.object({
  complete: z.boolean(),
  issues: z.array(z.string()),
});

export type AgentFeedback = z.infer<typeof AgentFeedbackSchema>;

// ─── Judge output schema ──────────────────────────────────────────────────────

export const JudgeOutputSchema = z.object({
  confidence: z.number().min(0).max(1),
  confidence_label: ConfidenceLabelEnum,
  is_consistent: z.boolean(),
  anomaly_detected: z.boolean(),
  anomaly_description: z.string().nullable(),
  agent_feedback: z.object({
    conceptual_soundness: AgentFeedbackSchema,
    outcomes_analysis: AgentFeedbackSchema,
    ongoing_monitoring: AgentFeedbackSchema,
  }),
  retry_recommended: z.boolean(),
});

export type JudgeOutput = z.infer<typeof JudgeOutputSchema>;

// ─── Scoring schemas ──────────────────────────────────────────────────────────

export const PillarScoresSchema = z.object({
  conceptual_soundness: z.number().min(0).max(100),
  outcomes_analysis: z.number().min(0).max(100),
  ongoing_monitoring: z.number().min(0).max(100),
});

export type PillarScores = z.infer<typeof PillarScoresSchema>;

export const ScoringResultSchema = z.object({
  pillar_scores: PillarScoresSchema,
  final_score: z.number().min(0).max(100),
  status: StatusEnum,
  total_gaps: z.number().min(0),
  critical_gap_count: z.number().min(0),
  major_gap_count: z.number().min(0),
  minor_gap_count: z.number().min(0),
});

export type ScoringResult = z.infer<typeof ScoringResultSchema>;

// ─── Scoring calculator input schema ─────────────────────────────────────────

export const ScoringInputSchema = z.object({
  cs_output: AgentOutputSchema,
  oa_output: AgentOutputSchema,
  om_output: AgentOutputSchema,
});

export type ScoringInput = z.infer<typeof ScoringInputSchema>;

// ─── Compliance API request schemas ──────────────────────────────────────────

export const ComplianceRequestSchema = z.object({
  model_name: z
    .string()
    .min(1, "Model name is required")
    .max(200, "Model name must be under 200 characters")
    .regex(
      /^[a-zA-Z0-9 \-_().]+$/,
      "Model name contains invalid characters"
    ),
  // file is handled as multipart/form-data — not in this schema
  document_text: z
    .string()
    .min(100, "Document must be at least 100 characters")
    .max(50000, "Document must be under 50,000 characters")
    .optional(),
});

export type ComplianceRequest = z.infer<typeof ComplianceRequestSchema>;

export const ReportRequestSchema = z.object({
  submission_id: z.string().uuid("Invalid submission ID"),
});

export type ReportRequest = z.infer<typeof ReportRequestSchema>;

// ─── Compliance API response schema ──────────────────────────────────────────

export const ComplianceResponseSchema = z.object({
  submission_id: z.string().uuid(),
  model_name: z.string(),
  version: z.number().int().min(1),
  scoring: ScoringResultSchema,
  pillar_outputs: z.object({
    conceptual_soundness: AgentOutputSchema,
    outcomes_analysis: AgentOutputSchema,
    ongoing_monitoring: AgentOutputSchema,
  }),
  judge: JudgeOutputSchema,
  all_gaps: z.array(GapSchema),
  retry_count: z.number().int().min(0).max(2),
  created_at: z.string().datetime(),
});

export type ComplianceResponse = z.infer<typeof ComplianceResponseSchema>;

// ─── Submission list and detail schemas ──────────────────────────────────────

export const SubmissionListItemSchema = z.object({
  id: z.string().uuid(),
  model_name: z.string(),
  version_number: z.number().int().min(1),
  conceptual_score: z.number().min(0).max(100),
  outcomes_score: z.number().min(0).max(100),
  monitoring_score: z.number().min(0).max(100),
  final_score: z.number().min(0).max(100),
  status: StatusEnum,
  assessment_confidence_label: ConfidenceLabelEnum,
  created_at: z.string().datetime(),
});

export type SubmissionListItem = z.infer<typeof SubmissionListItemSchema>;

export const GapWithIdSchema = GapSchema.extend({
  id: z.string().uuid(),
});

export type GapWithId = z.infer<typeof GapWithIdSchema>;

export const SubmissionDetailSchema = SubmissionListItemSchema.extend({
  document_text: z.string().min(100).max(50000),
  gap_analysis: z.array(GapWithIdSchema),
  judge_confidence: z.number().min(0).max(1),
});

export type SubmissionDetail = z.infer<typeof SubmissionDetailSchema>;

// ─── Database row schemas ─────────────────────────────────────────────────────

export const ModelRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  model_name: z.string().max(200),
  created_at: z.string().datetime(),
});

export type ModelRow = z.infer<typeof ModelRowSchema>;

export const SubmissionRowSchema = z.object({
  id: z.string().uuid(),
  model_id: z.string().uuid(),
  user_id: z.string().uuid(),
  version_number: z.number().int().min(1),
  document_text: z.string().min(100).max(50000),
  conceptual_score: z.number(),
  outcomes_score: z.number(),
  monitoring_score: z.number(),
  final_score: z.number(),
  gap_analysis: z.array(GapSchema).nullable(),
  judge_confidence: z.number(),
  assessment_confidence_label: ConfidenceLabelEnum,
  created_at: z.string().datetime(),
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
  created_at: z.string().datetime(),
});

export type GapRow = z.infer<typeof GapRowSchema>;

// ─── User preferences schema ──────────────────────────────────────────────────

export const UserPreferencesSchema = z.object({
  show_overview_panel: z.boolean().default(true),
  show_model_inventory: z.boolean().default(true),
  show_score_progression: z.boolean().default(true),
  show_recent_activity: z.boolean().default(true),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

// ─── Error response schema ────────────────────────────────────────────────────

export const ErrorResponseSchema = z.object({
  error: z.string(),
  error_code: z.string(),
  message: z.string(),
  retry_after_seconds: z.number().optional(), // Only for RATE_LIMIT_EXCEEDED
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// ─── Pagination & param schemas ─────────────────────────────────────────────

export const PaginationParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type PaginationParams = z.infer<typeof PaginationParamsSchema>;

export const UuidParamSchema = z.object({
  id: z.string().uuid("Invalid submission ID"),
});

export type UuidParam = z.infer<typeof UuidParamSchema>;

export const DeleteAllConfirmSchema = z.object({
  confirm: z.literal(true, { message: "Confirmation required" }),
});

export type DeleteAllConfirm = z.infer<typeof DeleteAllConfirmSchema>;

// ─── Dispute / scoped re-assessment schemas ─────────────────────────────────

export const DisputeTypeEnum = z.enum([
  "false_positive",
  "wrong_severity",
  "missing_context",
]);

export type DisputeType = z.infer<typeof DisputeTypeEnum>;

export const DisputeRequestSchema = z.object({
  assessment_id: z.string().uuid("Invalid submission ID"),
  gap_id: z.string().uuid("Invalid gap ID"),
  dispute_type: DisputeTypeEnum,
  reviewer_rationale: z
    .string()
    .min(10, "Rationale must be at least 10 characters")
    .max(2000, "Rationale must be under 2,000 characters"),
  proposed_resolution: z
    .string()
    .max(2000, "Proposed resolution must be under 2,000 characters")
    .optional(),
});

export type DisputeRequest = z.infer<typeof DisputeRequestSchema>;

export const DisputeEventRowSchema = z.object({
  id: z.string().uuid(),
  assessment_id: z.string().uuid().nullable(),
  gap_id: z.string().uuid().nullable(),
  user_id: z.string().uuid(),
  dispute_type: DisputeTypeEnum,
  reviewer_rationale: z.string(),
  proposed_resolution: z.string().nullable(),
  created_at: z.string().datetime(),
});

export type DisputeEventRow = z.infer<typeof DisputeEventRowSchema>;

export const ReassessmentResponseSchema = z.object({
  reassessment_id: z.string().uuid(),
  parent_assessment_id: z.string().uuid(),
  pillar_reassessed: PillarEnum,
  scoring: ScoringResultSchema,
  judge_confidence: z.number().min(0).max(1),
  judge_confidence_label: ConfidenceLabelEnum,
  low_confidence_manual_review: z.boolean(),
  dispute_event_id: z.string().uuid(),
  created_at: z.string().datetime(),
});

export type ReassessmentResponse = z.infer<typeof ReassessmentResponseSchema>;

export const CompareResponseSchema = z.object({
  parent: SubmissionDetailSchema,
  reassessment: SubmissionDetailSchema.extend({
    parent_assessment_id: z.string().uuid(),
    low_confidence_manual_review: z.boolean(),
  }),
  pillar_reassessed: PillarEnum,
  pillar_score_deltas: z.object({
    conceptual_soundness: z.number(),
    outcomes_analysis: z.number(),
    ongoing_monitoring: z.number(),
    final_score: z.number(),
  }),
  gap_diff: z.object({
    added: z.array(GapWithIdSchema),
    removed: z.array(GapWithIdSchema),
    severity_changed: z.array(
      z.object({
        element_code: ElementCodeEnum,
        element_name: z.string(),
        before: SeverityEnum,
        after: SeverityEnum,
      })
    ),
  }),
  dispute_events: z.array(DisputeEventRowSchema),
});

export type CompareResponse = z.infer<typeof CompareResponseSchema>;
