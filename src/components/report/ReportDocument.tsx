import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { Gap } from "@/lib/validation/schemas";

// ─── Font Registration (Google Fonts CDN) ────────────────────────────────────

Font.register({
  family: "Playfair",
  src: "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFRD-vYSZviVYUb_rj3ij__anPXDTnCjmHKM4nYO7KN_qiTbtbK-F2rA0s.ttf",
});

Font.register({
  family: "IBM Plex Mono",
  src: "https://fonts.gstatic.com/s/ibmplexmono/v19/-F63fjptAgt5VM-kVkqdyU8n5igy1MCzb9s.ttf",
});

Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hjQ.ttf",
      fontWeight: 700,
    },
  ],
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function scoreColor(score: number): string {
  if (score >= 80) return "#10B981";
  if (score >= 60) return "#F59E0B";
  return "#EF4444";
}

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "#EF4444",
  Major: "#F59E0B",
  Minor: "#6B7280",
};

const SEVERITY_ORDER: Record<string, number> = {
  Critical: 0,
  Major: 1,
  Minor: 2,
};

function severityColor(severity: string): string {
  return SEVERITY_COLORS[severity] ?? "#6B7280";
}

function pillarLabel(code: string): string {
  if (code.startsWith("CS-")) return "Conceptual Soundness";
  if (code.startsWith("OA-")) return "Outcomes Analysis";
  if (code.startsWith("OM-")) return "Ongoing Monitoring";
  return "Unknown";
}

function sortGapsBySeverity(gaps: Gap[]): Gap[] {
  return [...gaps].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3)
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    paddingTop: 70,
    paddingBottom: 70,
    paddingHorizontal: 40,
    fontFamily: "Inter",
    fontSize: 10,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },

  // Fixed header
  header: {
    position: "absolute",
    top: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerBrand: {
    fontFamily: "Playfair",
    fontSize: 14,
    color: "#1E3A5F",
  },
  headerDate: {
    fontSize: 8,
    color: "#6B7280",
  },

  // Fixed footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  footerText: {
    fontSize: 7,
    color: "#6B7280",
  },
  footerPage: {
    fontSize: 7,
    color: "#6B7280",
  },

  // Title block
  title: {
    fontFamily: "Playfair",
    fontSize: 22,
    color: "#1E3A5F",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: "#111827",
    marginBottom: 2,
  },
  dateText: {
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 24,
  },

  // Score section
  scoreSection: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  scoreLarge: {
    fontFamily: "IBM Plex Mono",
    fontSize: 36,
    fontWeight: 700,
  },
  statusLabel: {
    fontSize: 12,
    marginLeft: 10,
  },
  pillarRow: {
    flexDirection: "row",
    marginTop: 14,
    gap: 16,
  },
  pillarCard: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 2,
    padding: 10,
  },
  pillarName: {
    fontSize: 9,
    color: "#6B7280",
    marginBottom: 4,
  },
  pillarScore: {
    fontFamily: "IBM Plex Mono",
    fontSize: 16,
    fontWeight: 700,
  },

  // Confidence
  confidenceSection: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  sectionHeading: {
    fontFamily: "Playfair",
    fontSize: 14,
    color: "#1E3A5F",
    marginBottom: 8,
  },

  // Gap table
  gapSection: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingVertical: 6,
    paddingHorizontal: 8,
    minHeight: 28,
  },
  thText: {
    fontSize: 8,
    fontWeight: 700,
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tdText: {
    fontSize: 9,
    color: "#111827",
  },
  colSeverity: { width: "14%" },
  colCode: { width: "12%" },
  colPillar: { width: "22%" },
  colDescription: { width: "52%" },

  // Severity badge
  severityBadge: {
    fontSize: 8,
    fontWeight: 700,
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 2,
    color: "#FFFFFF",
    alignSelf: "flex-start",
  },

  // Remediation
  remediationItem: {
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  remediationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 6,
  },
  remediationCode: {
    fontFamily: "IBM Plex Mono",
    fontSize: 9,
    color: "#374151",
  },
  remediationName: {
    fontSize: 9,
    fontWeight: 700,
    color: "#111827",
  },
  remediationText: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.5,
  },

  // Reference
  referenceSection: {
    marginTop: 16,
  },
  referenceText: {
    fontSize: 8,
    color: "#6B7280",
    lineHeight: 1.6,
  },

  emptyText: {
    fontSize: 10,
    color: "#6B7280",
    textAlign: "center",
    paddingVertical: 20,
  },
});

// ─── Props ───────────────────────────────────────────────────────────────────

interface ReportDocumentProps {
  modelName: string;
  versionNumber: number;
  finalScore: number;
  status: string;
  pillarScores: {
    conceptual_soundness: number;
    outcomes_analysis: number;
    ongoing_monitoring: number;
  };
  gaps: Gap[];
  confidenceLabel: string;
  createdAt: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ReportDocument({
  modelName,
  versionNumber,
  finalScore,
  status,
  pillarScores,
  gaps,
  confidenceLabel,
  createdAt,
}: ReportDocumentProps) {
  const sortedGaps = sortGapsBySeverity(gaps);
  const formattedDate = formatDate(createdAt);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ── Fixed Header ── */}
        <View style={s.header} fixed>
          <Text style={s.headerBrand}>Prova</Text>
          <Text style={s.headerDate}>{formattedDate}</Text>
        </View>

        {/* ── Fixed Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            For training and synthetic model documents only · SR 11-7 Reference
          </Text>
          <Text
            style={s.footerPage}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>

        {/* ── 1. Title Block ── */}
        <Text style={s.title}>Compliance Assessment Report</Text>
        <Text style={s.subtitle}>
          {modelName} — Version {versionNumber}
        </Text>
        <Text style={s.dateText}>{formattedDate}</Text>

        {/* ── 2. Final Score ── */}
        <View style={s.scoreSection}>
          <View style={s.scoreRow}>
            <Text style={{ ...s.scoreLarge, color: scoreColor(finalScore) }}>
              {Math.round(finalScore)}
            </Text>
            <Text style={{ ...s.statusLabel, color: scoreColor(finalScore) }}>
              {status}
            </Text>
          </View>
          <View style={s.pillarRow}>
            <View style={s.pillarCard}>
              <Text style={s.pillarName}>Conceptual Soundness (40%)</Text>
              <Text
                style={{
                  ...s.pillarScore,
                  color: scoreColor(pillarScores.conceptual_soundness),
                }}
              >
                {Math.round(pillarScores.conceptual_soundness)}
              </Text>
            </View>
            <View style={s.pillarCard}>
              <Text style={s.pillarName}>Outcomes Analysis (35%)</Text>
              <Text
                style={{
                  ...s.pillarScore,
                  color: scoreColor(pillarScores.outcomes_analysis),
                }}
              >
                {Math.round(pillarScores.outcomes_analysis)}
              </Text>
            </View>
            <View style={s.pillarCard}>
              <Text style={s.pillarName}>Ongoing Monitoring (25%)</Text>
              <Text
                style={{
                  ...s.pillarScore,
                  color: scoreColor(pillarScores.ongoing_monitoring),
                }}
              >
                {Math.round(pillarScores.ongoing_monitoring)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── 3. Assessment Confidence ── */}
        <View style={s.confidenceSection}>
          <Text style={s.sectionHeading}>Assessment Confidence</Text>
          <Text style={s.tdText}>
            Confidence Level: {confidenceLabel}
            {confidenceLabel === "High" &&
              " — Agent assessments were consistent and well-supported."}
            {confidenceLabel === "Medium" &&
              " — Minor discrepancies detected between agent assessments."}
            {confidenceLabel === "Low" &&
              " — Significant inconsistencies detected. Review results carefully."}
          </Text>
        </View>

        {/* ── 4. Gap Analysis Table ── */}
        <View style={s.gapSection}>
          <Text style={s.sectionHeading}>Gap Analysis</Text>
          {sortedGaps.length === 0 ? (
            <Text style={s.emptyText}>No gaps identified</Text>
          ) : (
            <View>
              {/* Table header */}
              <View style={s.tableHeader}>
                <Text style={{ ...s.thText, ...s.colSeverity }}>Severity</Text>
                <Text style={{ ...s.thText, ...s.colCode }}>Code</Text>
                <Text style={{ ...s.thText, ...s.colPillar }}>Pillar</Text>
                <Text style={{ ...s.thText, ...s.colDescription }}>
                  Description
                </Text>
              </View>
              {/* Table rows */}
              {sortedGaps.map((gap, i) => (
                <View style={s.tableRow} key={i} wrap={false}>
                  <View style={s.colSeverity}>
                    <Text
                      style={{
                        ...s.severityBadge,
                        backgroundColor: severityColor(gap.severity),
                      }}
                    >
                      {gap.severity}
                    </Text>
                  </View>
                  <View style={s.colCode}>
                    <Text style={{ ...s.tdText, fontFamily: "IBM Plex Mono" }}>
                      {gap.element_code}
                    </Text>
                  </View>
                  <View style={s.colPillar}>
                    <Text style={s.tdText}>
                      {pillarLabel(gap.element_code)}
                    </Text>
                  </View>
                  <View style={s.colDescription}>
                    <Text style={s.tdText}>{gap.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── 5. Remediation Recommendations ── */}
        {sortedGaps.length > 0 && (
          <View>
            <Text style={s.sectionHeading}>Remediation Recommendations</Text>
            {sortedGaps.map((gap, i) => (
              <View style={s.remediationItem} key={i} wrap={false}>
                <View style={s.remediationHeader}>
                  <Text style={s.remediationCode}>{gap.element_code}</Text>
                  <Text style={s.remediationName}>{gap.element_name}</Text>
                  <Text
                    style={{
                      ...s.severityBadge,
                      backgroundColor: severityColor(gap.severity),
                    }}
                  >
                    {gap.severity}
                  </Text>
                </View>
                <Text style={s.remediationText}>{gap.recommendation}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── 6. SR 11-7 Reference ── */}
        <View style={s.referenceSection}>
          <Text style={s.sectionHeading}>SR 11-7 Reference</Text>
          <Text style={s.referenceText}>
            This assessment evaluates model documentation against the Federal
            Reserve&apos;s SR 11-7 Guidance on Model Risk Management. The three
            assessment pillars — Conceptual Soundness (40%), Outcomes Analysis
            (35%), and Ongoing Monitoring (25%) — are derived from the core
            principles outlined in this supervisory guidance. Scores reflect
            documentation completeness and are not a substitute for formal
            regulatory review.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
