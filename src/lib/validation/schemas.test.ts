import {
  loginSchema,
  signupSchema,
  documentUploadSchema,
  GapSchema,
  AgentOutputSchema,
  JudgeOutputSchema,
  ComplianceRequestSchema,
  ComplianceResponseSchema,
  ScoringResultSchema,
  ScoringInputSchema,
  UserPreferencesSchema,
  ReportRequestSchema,
  SubmissionListItemSchema,
  ErrorResponseSchema,
  PillarEnum,
  SeverityEnum,
  StatusEnum,
  ConfidenceLabelEnum,
  ElementCodeEnum,
  AgentFeedbackSchema,
  PillarScoresSchema,
  SubmissionDetailSchema,
  ModelRowSchema,
  SubmissionRowSchema,
  GapRowSchema,
} from "./schemas";

// ─── loginSchema ──────────────────────────────────────────────────────────────

describe("loginSchema", () => {
  it("accepts valid email and password", () => {
    const result = loginSchema.safeParse({ email: "user@bank.com", password: "secret123" });
    expect(result.success).toBe(true);
  });

  it("rejects missing email", () => {
    const result = loginSchema.safeParse({ email: "", password: "secret123" });
    expect(result.success).toBe(false);
  });

  it("rejects malformed email", () => {
    const result = loginSchema.safeParse({ email: "notanemail", password: "secret123" });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = loginSchema.safeParse({ email: "user@bank.com", password: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects missing password", () => {
    const result = loginSchema.safeParse({ email: "user@bank.com", password: "" });
    expect(result.success).toBe(false);
  });
});

// ─── signupSchema ─────────────────────────────────────────────────────────────

describe("signupSchema", () => {
  it("accepts valid email, password, and matching confirmPassword", () => {
    const result = signupSchema.safeParse({
      email: "user@bank.com",
      password: "secret123",
      confirmPassword: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when passwords do not match", () => {
    const result = signupSchema.safeParse({
      email: "user@bank.com",
      password: "secret123",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = signupSchema.safeParse({
      email: "user@bank.com",
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects malformed email", () => {
    const result = signupSchema.safeParse({
      email: "notanemail",
      password: "secret123",
      confirmPassword: "secret123",
    });
    expect(result.success).toBe(false);
  });
});

// ─── documentUploadSchema ─────────────────────────────────────────────────────

describe("documentUploadSchema", () => {
  it("accepts a pdf file within size limit", () => {
    const result = documentUploadSchema.safeParse({
      name: "model-doc.pdf",
      type: "application/pdf",
      size: 1024 * 1024, // 1 MB
    });
    expect(result.success).toBe(true);
  });

  it("accepts a docx file within size limit", () => {
    const result = documentUploadSchema.safeParse({
      name: "model-doc.docx",
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 2 * 1024 * 1024, // 2 MB
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unsupported file type", () => {
    const result = documentUploadSchema.safeParse({
      name: "malware.exe",
      type: "application/octet-stream",
      size: 1024,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a file exceeding 10 MB", () => {
    const result = documentUploadSchema.safeParse({
      name: "huge.pdf",
      type: "application/pdf",
      size: 11 * 1024 * 1024, // 11 MB
    });
    expect(result.success).toBe(false);
  });

  it("rejects a file with zero size", () => {
    const result = documentUploadSchema.safeParse({
      name: "empty.pdf",
      type: "application/pdf",
      size: 0,
    });
    expect(result.success).toBe(false);
  });
});

// ─── Enum schemas ─────────────────────────────────────────────────────────────

describe("PillarEnum", () => {
  it("accepts all three valid pillar values", () => {
    expect(PillarEnum.safeParse("conceptual_soundness").success).toBe(true);
    expect(PillarEnum.safeParse("outcomes_analysis").success).toBe(true);
    expect(PillarEnum.safeParse("ongoing_monitoring").success).toBe(true);
  });

  it("rejects an unknown pillar", () => {
    expect(PillarEnum.safeParse("unknown_pillar").success).toBe(false);
  });
});

describe("ElementCodeEnum", () => {
  it("accepts valid CS element codes", () => {
    for (const code of ["CS-01", "CS-02", "CS-03", "CS-04", "CS-05", "CS-06", "CS-07"]) {
      expect(ElementCodeEnum.safeParse(code).success).toBe(true);
    }
  });

  it("accepts valid OA element codes", () => {
    for (const code of ["OA-01", "OA-02", "OA-03", "OA-04", "OA-05", "OA-06", "OA-07"]) {
      expect(ElementCodeEnum.safeParse(code).success).toBe(true);
    }
  });

  it("accepts valid OM element codes", () => {
    for (const code of ["OM-01", "OM-02", "OM-03", "OM-04", "OM-05", "OM-06"]) {
      expect(ElementCodeEnum.safeParse(code).success).toBe(true);
    }
  });

  it("rejects an invented element code", () => {
    expect(ElementCodeEnum.safeParse("XX-01").success).toBe(false);
  });

  it("rejects an out-of-range code (OM-07 does not exist)", () => {
    expect(ElementCodeEnum.safeParse("OM-07").success).toBe(false);
  });

  it("rejects a freeform string", () => {
    expect(ElementCodeEnum.safeParse("Model Purpose").success).toBe(false);
  });
});

describe("SeverityEnum", () => {
  it("accepts Critical, Major, Minor", () => {
    expect(SeverityEnum.safeParse("Critical").success).toBe(true);
    expect(SeverityEnum.safeParse("Major").success).toBe(true);
    expect(SeverityEnum.safeParse("Minor").success).toBe(true);
  });

  it("rejects a non-enum value", () => {
    expect(SeverityEnum.safeParse("High").success).toBe(false);
  });
});

describe("StatusEnum", () => {
  it("accepts all three status values", () => {
    expect(StatusEnum.safeParse("Compliant").success).toBe(true);
    expect(StatusEnum.safeParse("Needs Improvement").success).toBe(true);
    expect(StatusEnum.safeParse("Critical Gaps").success).toBe(true);
  });

  it("rejects an unknown status", () => {
    expect(StatusEnum.safeParse("Partial").success).toBe(false);
  });
});

describe("ConfidenceLabelEnum", () => {
  it("accepts High, Medium, Low", () => {
    expect(ConfidenceLabelEnum.safeParse("High").success).toBe(true);
    expect(ConfidenceLabelEnum.safeParse("Medium").success).toBe(true);
    expect(ConfidenceLabelEnum.safeParse("Low").success).toBe(true);
  });

  it("rejects Very High", () => {
    expect(ConfidenceLabelEnum.safeParse("Very High").success).toBe(false);
  });
});

// ─── GapSchema ────────────────────────────────────────────────────────────────

describe("GapSchema", () => {
  const validGap = {
    element_code: "CS-01",
    element_name: "Model Purpose and Intended Use",
    severity: "Critical",
    description: "No model purpose documented.",
    recommendation: "Add a section describing the model's intended use.",
  };

  it("accepts a valid gap object", () => {
    expect(GapSchema.safeParse(validGap).success).toBe(true);
  });

  it("accepts all severity values", () => {
    for (const severity of ["Critical", "Major", "Minor"]) {
      expect(GapSchema.safeParse({ ...validGap, severity }).success).toBe(true);
    }
  });

  it("rejects an invalid severity value", () => {
    expect(GapSchema.safeParse({ ...validGap, severity: "High" }).success).toBe(false);
  });

  it("rejects an unrecognised element_code (not in SR 11-7 spec)", () => {
    expect(GapSchema.safeParse({ ...validGap, element_code: "XX-01" }).success).toBe(false);
  });

  it("rejects an out-of-range element_code (OM-07 does not exist)", () => {
    expect(GapSchema.safeParse({ ...validGap, element_code: "OM-07" }).success).toBe(false);
  });

  it("rejects an empty description", () => {
    expect(GapSchema.safeParse({ ...validGap, description: "" }).success).toBe(false);
  });

  it("rejects an empty recommendation", () => {
    expect(GapSchema.safeParse({ ...validGap, recommendation: "" }).success).toBe(false);
  });

  it("rejects an empty element_name", () => {
    expect(GapSchema.safeParse({ ...validGap, element_name: "" }).success).toBe(false);
  });

  it("rejects description exceeding 1000 characters", () => {
    expect(GapSchema.safeParse({ ...validGap, description: "x".repeat(1001) }).success).toBe(false);
  });

  it("rejects recommendation exceeding 1000 characters", () => {
    expect(GapSchema.safeParse({ ...validGap, recommendation: "x".repeat(1001) }).success).toBe(false);
  });
});

// ─── AgentOutputSchema ────────────────────────────────────────────────────────

describe("AgentOutputSchema", () => {
  const validOutput = {
    pillar: "conceptual_soundness",
    score: 75,
    confidence: 0.9,
    gaps: [],
    summary: "The document covers most conceptual soundness elements adequately.",
  };

  it("accepts a valid agent output with empty gaps", () => {
    expect(AgentOutputSchema.safeParse(validOutput).success).toBe(true);
  });

  it("accepts a valid agent output with a populated gap", () => {
    const withGap = {
      ...validOutput,
      gaps: [
        {
          element_code: "CS-03",
          element_name: "Key Assumptions Documentation",
          severity: "Major",
          description: "Assumptions are listed but not quantified.",
          recommendation: "Add quantitative bounds for each assumption.",
        },
      ],
    };
    expect(AgentOutputSchema.safeParse(withGap).success).toBe(true);
  });

  it("rejects score above 100", () => {
    expect(AgentOutputSchema.safeParse({ ...validOutput, score: 101 }).success).toBe(false);
  });

  it("rejects score below 0", () => {
    expect(AgentOutputSchema.safeParse({ ...validOutput, score: -1 }).success).toBe(false);
  });

  it("rejects confidence above 1", () => {
    expect(AgentOutputSchema.safeParse({ ...validOutput, confidence: 1.1 }).success).toBe(false);
  });

  it("rejects confidence below 0", () => {
    expect(AgentOutputSchema.safeParse({ ...validOutput, confidence: -0.1 }).success).toBe(false);
  });

  it("rejects invalid pillar value", () => {
    expect(AgentOutputSchema.safeParse({ ...validOutput, pillar: "unknown_pillar" }).success).toBe(false);
  });

  it("rejects an empty summary", () => {
    expect(AgentOutputSchema.safeParse({ ...validOutput, summary: "" }).success).toBe(false);
  });

  it("rejects summary exceeding 2000 characters", () => {
    expect(AgentOutputSchema.safeParse({ ...validOutput, summary: "x".repeat(2001) }).success).toBe(false);
  });

  it("rejects a gap with an invalid element_code", () => {
    const withBadGap = {
      ...validOutput,
      gaps: [{ element_code: "XX-99", element_name: "Fake", severity: "Minor", description: "desc", recommendation: "rec" }],
    };
    expect(AgentOutputSchema.safeParse(withBadGap).success).toBe(false);
  });
});

// ─── JudgeOutputSchema ────────────────────────────────────────────────────────

describe("JudgeOutputSchema", () => {
  const validJudge = {
    confidence: 0.85,
    confidence_label: "High",
    is_consistent: true,
    anomaly_detected: false,
    anomaly_description: null,
    agent_feedback: {
      conceptual_soundness: { complete: true, issues: [] },
      outcomes_analysis: { complete: true, issues: [] },
      ongoing_monitoring: { complete: false, issues: ["Missing OM-04"] },
    },
    retry_recommended: false,
  };

  it("accepts a valid judge output", () => {
    expect(JudgeOutputSchema.safeParse(validJudge).success).toBe(true);
  });

  it("accepts anomaly_description as a non-null string", () => {
    expect(
      JudgeOutputSchema.safeParse({
        ...validJudge,
        anomaly_detected: true,
        anomaly_description: "Suspiciously uniform scores across all pillars.",
      }).success
    ).toBe(true);
  });

  it("rejects invalid confidence_label", () => {
    expect(JudgeOutputSchema.safeParse({ ...validJudge, confidence_label: "Very High" }).success).toBe(false);
  });

  it("rejects missing agent_feedback pillar", () => {
    const { agent_feedback: { ongoing_monitoring: _om, ...feedbackRest } } = validJudge;
    void _om;
    expect(
      JudgeOutputSchema.safeParse({ ...validJudge, agent_feedback: feedbackRest }).success
    ).toBe(false);
  });

  it("rejects confidence above 1", () => {
    expect(JudgeOutputSchema.safeParse({ ...validJudge, confidence: 1.1 }).success).toBe(false);
  });
});

// ─── ComplianceRequestSchema ──────────────────────────────────────────────────

describe("ComplianceRequestSchema", () => {
  it("accepts a valid request with model_name and document_text", () => {
    expect(
      ComplianceRequestSchema.safeParse({
        model_name: "Black-Scholes v1",
        document_text: "A".repeat(100),
      }).success
    ).toBe(true);
  });

  it("accepts a request with model_name only (document_text optional)", () => {
    expect(ComplianceRequestSchema.safeParse({ model_name: "My Model" }).success).toBe(true);
  });

  it("rejects empty model_name", () => {
    expect(ComplianceRequestSchema.safeParse({ model_name: "" }).success).toBe(false);
  });

  it("rejects model_name exceeding 200 characters", () => {
    expect(ComplianceRequestSchema.safeParse({ model_name: "x".repeat(201) }).success).toBe(false);
  });

  it("rejects model_name with invalid characters", () => {
    expect(ComplianceRequestSchema.safeParse({ model_name: "Model <script>" }).success).toBe(false);
  });

  it("accepts model_name with allowed special characters", () => {
    expect(ComplianceRequestSchema.safeParse({ model_name: "BS-Model_v2 (Final)" }).success).toBe(true);
  });

  it("rejects document_text shorter than 100 characters", () => {
    expect(
      ComplianceRequestSchema.safeParse({ model_name: "My Model", document_text: "short" }).success
    ).toBe(false);
  });

  it("rejects document_text exceeding 50,000 characters", () => {
    expect(
      ComplianceRequestSchema.safeParse({ model_name: "My Model", document_text: "A".repeat(50001) }).success
    ).toBe(false);
  });

  it("accepts document_text at the 100-character minimum boundary", () => {
    expect(
      ComplianceRequestSchema.safeParse({ model_name: "My Model", document_text: "A".repeat(100) }).success
    ).toBe(true);
  });

  it("accepts document_text at the 50,000-character maximum boundary", () => {
    expect(
      ComplianceRequestSchema.safeParse({ model_name: "My Model", document_text: "A".repeat(50000) }).success
    ).toBe(true);
  });
});

// ─── ReportRequestSchema ──────────────────────────────────────────────────────

describe("ReportRequestSchema", () => {
  it("accepts a valid UUID submission_id", () => {
    expect(
      ReportRequestSchema.safeParse({ submission_id: "550e8400-e29b-41d4-a716-446655440000" }).success
    ).toBe(true);
  });

  it("rejects a non-UUID submission_id", () => {
    expect(ReportRequestSchema.safeParse({ submission_id: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects missing submission_id", () => {
    expect(ReportRequestSchema.safeParse({}).success).toBe(false);
  });
});

// ─── ComplianceResponseSchema ─────────────────────────────────────────────────

describe("ComplianceResponseSchema", () => {
  const agentOutputCS = {
    pillar: "conceptual_soundness",
    score: 80,
    confidence: 0.9,
    gaps: [],
    summary: "CS assessment complete.",
  };
  const agentOutputOA = { ...agentOutputCS, pillar: "outcomes_analysis", summary: "OA assessment complete." };
  const agentOutputOM = { ...agentOutputCS, pillar: "ongoing_monitoring", summary: "OM assessment complete." };

  const validResponse = {
    submission_id: "550e8400-e29b-41d4-a716-446655440000",
    model_name: "Black-Scholes",
    version: 1,
    scoring: {
      pillar_scores: {
        conceptual_soundness: 80,
        outcomes_analysis: 70,
        ongoing_monitoring: 90,
      },
      final_score: 80,
      status: "Compliant",
      total_gaps: 1,
      critical_gap_count: 0,
      major_gap_count: 1,
      minor_gap_count: 0,
    },
    pillar_outputs: {
      conceptual_soundness: agentOutputCS,
      outcomes_analysis: agentOutputOA,
      ongoing_monitoring: agentOutputOM,
    },
    judge: {
      confidence: 0.85,
      confidence_label: "High",
      is_consistent: true,
      anomaly_detected: false,
      anomaly_description: null,
      agent_feedback: {
        conceptual_soundness: { complete: true, issues: [] },
        outcomes_analysis: { complete: true, issues: [] },
        ongoing_monitoring: { complete: true, issues: [] },
      },
      retry_recommended: false,
    },
    all_gaps: [],
    retry_count: 0,
    created_at: "2026-03-23T10:00:00.000Z",
  };

  it("accepts a valid compliance response", () => {
    expect(ComplianceResponseSchema.safeParse(validResponse).success).toBe(true);
  });

  it("rejects non-UUID submission_id", () => {
    expect(ComplianceResponseSchema.safeParse({ ...validResponse, submission_id: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects version less than 1", () => {
    expect(ComplianceResponseSchema.safeParse({ ...validResponse, version: 0 }).success).toBe(false);
  });

  it("rejects non-integer version", () => {
    expect(ComplianceResponseSchema.safeParse({ ...validResponse, version: 1.5 }).success).toBe(false);
  });

  it("rejects retry_count above 2", () => {
    expect(ComplianceResponseSchema.safeParse({ ...validResponse, retry_count: 3 }).success).toBe(false);
  });

  it("rejects an invalid status in scoring", () => {
    expect(
      ComplianceResponseSchema.safeParse({
        ...validResponse,
        scoring: { ...validResponse.scoring, status: "Partial" },
      }).success
    ).toBe(false);
  });

  it("rejects a gap with an invalid element_code in all_gaps", () => {
    expect(
      ComplianceResponseSchema.safeParse({
        ...validResponse,
        all_gaps: [
          { element_code: "XX-01", element_name: "Fake", severity: "Minor", description: "desc", recommendation: "rec" },
        ],
      }).success
    ).toBe(false);
  });

  it("rejects a missing created_at field", () => {
    const { created_at: _createdAt, ...withoutDate } = validResponse;
    void _createdAt;
    expect(ComplianceResponseSchema.safeParse(withoutDate).success).toBe(false);
  });
});

// ─── ScoringResultSchema ──────────────────────────────────────────────────────

describe("ScoringResultSchema", () => {
  const validResult = {
    pillar_scores: {
      conceptual_soundness: 90,
      outcomes_analysis: 80,
      ongoing_monitoring: 70,
    },
    final_score: 82,
    status: "Compliant",
    total_gaps: 2,
    critical_gap_count: 0,
    major_gap_count: 1,
    minor_gap_count: 1,
  };

  it("accepts a valid scoring result", () => {
    expect(ScoringResultSchema.safeParse(validResult).success).toBe(true);
  });

  it("rejects a pillar score above 100", () => {
    expect(
      ScoringResultSchema.safeParse({
        ...validResult,
        pillar_scores: { ...validResult.pillar_scores, conceptual_soundness: 101 },
      }).success
    ).toBe(false);
  });

  it("rejects a pillar score below 0", () => {
    expect(
      ScoringResultSchema.safeParse({
        ...validResult,
        pillar_scores: { ...validResult.pillar_scores, outcomes_analysis: -1 },
      }).success
    ).toBe(false);
  });

  it("rejects final_score above 100", () => {
    expect(ScoringResultSchema.safeParse({ ...validResult, final_score: 101 }).success).toBe(false);
  });

  it("rejects final_score below 0", () => {
    expect(ScoringResultSchema.safeParse({ ...validResult, final_score: -1 }).success).toBe(false);
  });

  it("rejects an invalid status value", () => {
    expect(ScoringResultSchema.safeParse({ ...validResult, status: "Unknown" }).success).toBe(false);
  });

  it("rejects negative total_gaps", () => {
    expect(ScoringResultSchema.safeParse({ ...validResult, total_gaps: -1 }).success).toBe(false);
  });

  it("rejects negative critical_gap_count", () => {
    expect(ScoringResultSchema.safeParse({ ...validResult, critical_gap_count: -1 }).success).toBe(false);
  });

  it("accepts a zero-gap all-compliant result", () => {
    expect(
      ScoringResultSchema.safeParse({
        pillar_scores: { conceptual_soundness: 100, outcomes_analysis: 100, ongoing_monitoring: 100 },
        final_score: 100,
        status: "Compliant",
        total_gaps: 0,
        critical_gap_count: 0,
        major_gap_count: 0,
        minor_gap_count: 0,
      }).success
    ).toBe(true);
  });
});

// ─── ScoringInputSchema ───────────────────────────────────────────────────────

describe("ScoringInputSchema", () => {
  const makeOutput = (pillar: string) => ({
    pillar,
    score: 80,
    confidence: 0.9,
    gaps: [],
    summary: "Assessment complete.",
  });

  it("accepts valid cs_output, oa_output, and om_output", () => {
    expect(
      ScoringInputSchema.safeParse({
        cs_output: makeOutput("conceptual_soundness"),
        oa_output: makeOutput("outcomes_analysis"),
        om_output: makeOutput("ongoing_monitoring"),
      }).success
    ).toBe(true);
  });

  it("rejects when a required output is missing", () => {
    expect(
      ScoringInputSchema.safeParse({
        cs_output: makeOutput("conceptual_soundness"),
        oa_output: makeOutput("outcomes_analysis"),
      }).success
    ).toBe(false);
  });

  it("rejects when an output has an invalid pillar", () => {
    expect(
      ScoringInputSchema.safeParse({
        cs_output: makeOutput("conceptual_soundness"),
        oa_output: makeOutput("bad_pillar"),
        om_output: makeOutput("ongoing_monitoring"),
      }).success
    ).toBe(false);
  });
});

// ─── UserPreferencesSchema ────────────────────────────────────────────────────

describe("UserPreferencesSchema", () => {
  it("accepts all boolean preferences", () => {
    expect(
      UserPreferencesSchema.safeParse({
        show_overview_panel: true,
        show_model_inventory: false,
        show_score_progression: true,
        show_recent_activity: false,
      }).success
    ).toBe(true);
  });

  it("applies defaults when no fields are provided", () => {
    const result = UserPreferencesSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.show_overview_panel).toBe(true);
      expect(result.data.show_model_inventory).toBe(true);
      expect(result.data.show_score_progression).toBe(true);
      expect(result.data.show_recent_activity).toBe(true);
    }
  });

  it("rejects a non-boolean value", () => {
    expect(UserPreferencesSchema.safeParse({ show_overview_panel: "yes" }).success).toBe(false);
  });
});

// ─── SubmissionListItemSchema ─────────────────────────────────────────────────

describe("SubmissionListItemSchema", () => {
  const validItem = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    model_name: "Black-Scholes",
    version_number: 1,
    conceptual_score: 80,
    outcomes_score: 70,
    monitoring_score: 90,
    final_score: 80,
    status: "Compliant",
    assessment_confidence_label: "High",
    created_at: "2026-03-23T10:00:00.000Z",
  };

  it("accepts a valid list item", () => {
    expect(SubmissionListItemSchema.safeParse(validItem).success).toBe(true);
  });

  it("rejects non-UUID id", () => {
    expect(SubmissionListItemSchema.safeParse({ ...validItem, id: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects version_number of 0", () => {
    expect(SubmissionListItemSchema.safeParse({ ...validItem, version_number: 0 }).success).toBe(false);
  });

  it("rejects final_score above 100", () => {
    expect(SubmissionListItemSchema.safeParse({ ...validItem, final_score: 101 }).success).toBe(false);
  });

  it("rejects an invalid status", () => {
    expect(SubmissionListItemSchema.safeParse({ ...validItem, status: "Partial" }).success).toBe(false);
  });

  it("rejects an invalid assessment_confidence_label", () => {
    expect(SubmissionListItemSchema.safeParse({ ...validItem, assessment_confidence_label: "Very High" }).success).toBe(false);
  });
});

// ─── ErrorResponseSchema ──────────────────────────────────────────────────────

describe("ErrorResponseSchema", () => {
  it("accepts a valid error response without retry_after_seconds", () => {
    expect(
      ErrorResponseSchema.safeParse({
        error: "RATE_LIMIT_EXCEEDED",
        error_code: "RATE_LIMIT_EXCEEDED",
        message: "Assessment limit reached. Try again in 23 minutes.",
      }).success
    ).toBe(true);
  });

  it("accepts a valid error response with retry_after_seconds", () => {
    expect(
      ErrorResponseSchema.safeParse({
        error: "RATE_LIMIT_EXCEEDED",
        error_code: "RATE_LIMIT_EXCEEDED",
        message: "Assessment limit reached.",
        retry_after_seconds: 1380,
      }).success
    ).toBe(true);
  });

  it("rejects a missing error_code", () => {
    expect(
      ErrorResponseSchema.safeParse({
        error: "RATE_LIMIT_EXCEEDED",
        message: "Assessment limit reached.",
      }).success
    ).toBe(false);
  });
});

// ─── AgentFeedbackSchema ──────────────────────────────────────────────────────

describe("AgentFeedbackSchema", () => {
  it("accepts complete feedback with no issues", () => {
    expect(AgentFeedbackSchema.safeParse({ complete: true, issues: [] }).success).toBe(true);
  });

  it("accepts incomplete feedback with issues listed", () => {
    expect(
      AgentFeedbackSchema.safeParse({ complete: false, issues: ["Missing OM-04", "OM-06 not addressed"] }).success
    ).toBe(true);
  });

  it("rejects missing complete field", () => {
    expect(AgentFeedbackSchema.safeParse({ issues: [] }).success).toBe(false);
  });

  it("rejects non-boolean complete", () => {
    expect(AgentFeedbackSchema.safeParse({ complete: "yes", issues: [] }).success).toBe(false);
  });

  it("rejects non-string items in the issues array", () => {
    expect(AgentFeedbackSchema.safeParse({ complete: false, issues: [1, 2, 3] }).success).toBe(false);
  });
});

// ─── PillarScoresSchema ───────────────────────────────────────────────────────

describe("PillarScoresSchema", () => {
  const validScores = {
    conceptual_soundness: 80,
    outcomes_analysis: 70,
    ongoing_monitoring: 90,
  };

  it("accepts valid pillar scores", () => {
    expect(PillarScoresSchema.safeParse(validScores).success).toBe(true);
  });

  it("rejects a score above 100", () => {
    expect(PillarScoresSchema.safeParse({ ...validScores, conceptual_soundness: 101 }).success).toBe(false);
  });

  it("rejects a score below 0", () => {
    expect(PillarScoresSchema.safeParse({ ...validScores, outcomes_analysis: -1 }).success).toBe(false);
  });

  it("rejects a missing pillar", () => {
    const { ongoing_monitoring: _om, ...partial } = validScores;
    void _om;
    expect(PillarScoresSchema.safeParse(partial).success).toBe(false);
  });
});

// ─── SubmissionDetailSchema ───────────────────────────────────────────────────

describe("SubmissionDetailSchema", () => {
  const validDetail = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    model_name: "Black-Scholes",
    version_number: 1,
    conceptual_score: 80,
    outcomes_score: 70,
    monitoring_score: 90,
    final_score: 80,
    status: "Compliant",
    assessment_confidence_label: "High",
    created_at: "2026-03-23T10:00:00.000Z",
    document_text: "A".repeat(100),
    gap_analysis: [],
    judge_confidence: 0.9,
  };

  it("accepts a valid submission detail", () => {
    expect(SubmissionDetailSchema.safeParse(validDetail).success).toBe(true);
  });

  it("rejects judge_confidence above 1", () => {
    expect(SubmissionDetailSchema.safeParse({ ...validDetail, judge_confidence: 1.1 }).success).toBe(false);
  });

  it("rejects a gap with an invalid element_code in gap_analysis", () => {
    expect(
      SubmissionDetailSchema.safeParse({
        ...validDetail,
        gap_analysis: [
          { element_code: "XX-01", element_name: "Fake", severity: "Minor", description: "desc", recommendation: "rec" },
        ],
      }).success
    ).toBe(false);
  });

  it("rejects missing document_text", () => {
    const { document_text: _docText, ...withoutText } = validDetail;
    void _docText;
    expect(SubmissionDetailSchema.safeParse(withoutText).success).toBe(false);
  });
});

// ─── ModelRowSchema ───────────────────────────────────────────────────────────

describe("ModelRowSchema", () => {
  const validRow = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    user_id: "660e8400-e29b-41d4-a716-446655440001",
    model_name: "Black-Scholes",
    created_at: "2026-03-23T10:00:00.000Z",
  };

  it("accepts a valid model row", () => {
    expect(ModelRowSchema.safeParse(validRow).success).toBe(true);
  });

  it("rejects a non-UUID id", () => {
    expect(ModelRowSchema.safeParse({ ...validRow, id: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects a non-UUID user_id", () => {
    expect(ModelRowSchema.safeParse({ ...validRow, user_id: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects an invalid created_at datetime", () => {
    expect(ModelRowSchema.safeParse({ ...validRow, created_at: "not-a-date" }).success).toBe(false);
  });
});

// ─── SubmissionRowSchema ──────────────────────────────────────────────────────

describe("SubmissionRowSchema", () => {
  const validRow = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    model_id: "660e8400-e29b-41d4-a716-446655440001",
    user_id: "770e8400-e29b-41d4-a716-446655440002",
    version_number: 1,
    document_text: "A".repeat(100),
    conceptual_score: 80,
    outcomes_score: 70,
    monitoring_score: 90,
    final_score: 80,
    gap_analysis: [],
    judge_confidence: 0.9,
    assessment_confidence_label: "High",
    created_at: "2026-03-23T10:00:00.000Z",
  };

  it("accepts a valid submission row", () => {
    expect(SubmissionRowSchema.safeParse(validRow).success).toBe(true);
  });

  it("rejects version_number of 0", () => {
    expect(SubmissionRowSchema.safeParse({ ...validRow, version_number: 0 }).success).toBe(false);
  });

  it("rejects an invalid assessment_confidence_label", () => {
    expect(
      SubmissionRowSchema.safeParse({ ...validRow, assessment_confidence_label: "Very High" }).success
    ).toBe(false);
  });

  it("rejects non-integer version_number", () => {
    expect(SubmissionRowSchema.safeParse({ ...validRow, version_number: 1.5 }).success).toBe(false);
  });
});

// ─── GapRowSchema ─────────────────────────────────────────────────────────────

describe("GapRowSchema", () => {
  const validRow = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    submission_id: "660e8400-e29b-41d4-a716-446655440001",
    user_id: "770e8400-e29b-41d4-a716-446655440002",
    pillar: "conceptual_soundness",
    element_code: "CS-03",
    element_name: "Key Assumptions Documentation",
    severity: "Major",
    description: "Assumptions listed but not quantified.",
    recommendation: "Add quantitative bounds for each assumption.",
    created_at: "2026-03-23T10:00:00.000Z",
  };

  it("accepts a valid gap row", () => {
    expect(GapRowSchema.safeParse(validRow).success).toBe(true);
  });

  it("rejects an invalid element_code", () => {
    expect(GapRowSchema.safeParse({ ...validRow, element_code: "XX-01" }).success).toBe(false);
  });

  it("rejects an invalid pillar", () => {
    expect(GapRowSchema.safeParse({ ...validRow, pillar: "unknown_pillar" }).success).toBe(false);
  });

  it("rejects an invalid severity", () => {
    expect(GapRowSchema.safeParse({ ...validRow, severity: "High" }).success).toBe(false);
  });

  it("rejects a non-UUID submission_id", () => {
    expect(GapRowSchema.safeParse({ ...validRow, submission_id: "not-a-uuid" }).success).toBe(false);
  });
});
