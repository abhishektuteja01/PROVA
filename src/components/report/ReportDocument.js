/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// Plain JS — no JSX, no TypeScript, no imports.
// All dependencies injected via buildReportElement(React, pdf, props)
// to guarantee the same module instances as @react-pdf/renderer's reconciler.

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso) {
  var d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function scoreColor(score) {
  if (score >= 80) return "#10B981";
  if (score >= 60) return "#F59E0B";
  return "#EF4444";
}

var SEVERITY_COLORS = {
  Critical: "#EF4444",
  Major: "#F59E0B",
  Minor: "#6B7280",
};

var SEVERITY_ORDER = {
  Critical: 0,
  Major: 1,
  Minor: 2,
};

function severityColor(severity) {
  return SEVERITY_COLORS[severity] || "#6B7280";
}

function pillarLabel(code) {
  if (code.startsWith("CS-")) return "Conceptual Soundness";
  if (code.startsWith("OA-")) return "Outcomes Analysis";
  if (code.startsWith("OM-")) return "Ongoing Monitoring";
  return "Unknown";
}

function sortGapsBySeverity(gaps) {
  return gaps.slice().sort(function (a, b) {
    return (SEVERITY_ORDER[a.severity] || 3) - (SEVERITY_ORDER[b.severity] || 3);
  });
}

// ─── Build Element Tree ─────────────────────────────────────────────────────

function buildReportElement(React, pdf, props) {
  var h = React.createElement;
  var Document = pdf.Document;
  var Page = pdf.Page;
  var View = pdf.View;
  var Text = pdf.Text;
  var StyleSheet = pdf.StyleSheet;
  var Font = pdf.Font;

  // ─── Font Registration ──────────────────────────────────────────────────

  var basePath = (typeof process !== "undefined" ? process.cwd() : "") + "/public/fonts/pdf";

  Font.register({
    family: "Playfair",
    src: basePath + "/playfair.ttf",
  });

  Font.register({
    family: "IBM Plex Mono",
    src: basePath + "/ibm-plex-mono.ttf",
  });

  Font.register({
    family: "Inter",
    fonts: [
      {
        src: basePath + "/inter-regular.ttf",
        fontWeight: 400,
      },
      {
        src: basePath + "/inter-bold.ttf",
        fontWeight: 700,
      },
    ],
  });

  // ─── Styles ─────────────────────────────────────────────────────────────

  var s = StyleSheet.create({
    page: {
      paddingTop: 70,
      paddingBottom: 70,
      paddingHorizontal: 40,
      fontFamily: "Inter",
      fontSize: 10,
      color: "#111827",
      backgroundColor: "#FFFFFF",
    },
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
    headerBrand: { fontFamily: "Playfair", fontSize: 14, color: "#1E3A5F" },
    headerDate: { fontSize: 8, color: "#6B7280" },
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
    footerText: { fontSize: 7, color: "#6B7280" },
    footerPage: { fontSize: 7, color: "#6B7280" },
    title: { fontFamily: "Playfair", fontSize: 22, color: "#1E3A5F", marginBottom: 6 },
    subtitle: { fontSize: 12, color: "#111827", marginBottom: 2 },
    dateText: { fontSize: 10, color: "#6B7280", marginBottom: 24 },
    scoreSection: { marginBottom: 24, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
    scoreRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 4 },
    scoreLarge: { fontFamily: "IBM Plex Mono", fontSize: 36, fontWeight: 700 },
    statusLabel: { fontSize: 12, marginLeft: 10 },
    pillarRow: { flexDirection: "row", marginTop: 14, gap: 16 },
    pillarCard: { flex: 1, backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 2, padding: 10 },
    pillarName: { fontSize: 9, color: "#6B7280", marginBottom: 4 },
    pillarScore: { fontFamily: "IBM Plex Mono", fontSize: 16, fontWeight: 700 },
    confidenceSection: { marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
    sectionHeading: { fontFamily: "Playfair", fontSize: 14, color: "#1E3A5F", marginBottom: 8 },
    gapSection: { marginBottom: 24 },
    tableHeader: { flexDirection: "row", backgroundColor: "#F3F4F6", borderBottomWidth: 1, borderBottomColor: "#E5E7EB", paddingVertical: 6, paddingHorizontal: 8 },
    tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#F3F4F6", paddingVertical: 6, paddingHorizontal: 8, minHeight: 28 },
    thText: { fontSize: 8, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: 0.5 },
    tdText: { fontSize: 9, color: "#111827" },
    colSeverity: { width: "14%" },
    colCode: { width: "12%" },
    colPillar: { width: "22%" },
    colDescription: { width: "52%" },
    severityBadge: { fontSize: 8, fontWeight: 700, paddingVertical: 2, paddingHorizontal: 5, borderRadius: 2, color: "#FFFFFF", alignSelf: "flex-start" },
    remediationItem: { marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
    remediationHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4, gap: 6 },
    remediationCode: { fontFamily: "IBM Plex Mono", fontSize: 9, color: "#374151" },
    remediationName: { fontSize: 9, fontWeight: 700, color: "#111827" },
    remediationText: { fontSize: 9, color: "#374151", lineHeight: 1.5 },
    referenceSection: { marginTop: 16 },
    referenceText: { fontSize: 8, color: "#6B7280", lineHeight: 1.6 },
    emptyText: { fontSize: 10, color: "#6B7280", textAlign: "center", paddingVertical: 20 },
  });

  // ─── Data ───────────────────────────────────────────────────────────────

  var modelName = props.modelName;
  var versionNumber = props.versionNumber;
  var finalScore = props.finalScore;
  var status = props.status;
  var pillarScores = props.pillarScores;
  var gaps = props.gaps;
  var confidenceLabel = props.confidenceLabel;
  var createdAt = props.createdAt;

  var sortedGaps = sortGapsBySeverity(gaps);
  var formattedDate = formatDate(createdAt);

  // ─── Pillar cards ───────────────────────────────────────────────────────

  function pillarCard(label, weight, score) {
    return h(View, { style: s.pillarCard },
      h(Text, { style: s.pillarName }, label + " (" + weight + ")"),
      h(Text, { style: Object.assign({}, s.pillarScore, { color: scoreColor(score) }) }, String(Math.round(score)))
    );
  }

  // ─── Gap table rows ─────────────────────────────────────────────────────

  var gapRows = sortedGaps.map(function (gap) {
    return h(View, { style: s.tableRow, key: gap.element_code, wrap: false },
      h(View, { style: s.colSeverity },
        h(Text, { style: Object.assign({}, s.severityBadge, { backgroundColor: severityColor(gap.severity) }) }, gap.severity)
      ),
      h(View, { style: s.colCode },
        h(Text, { style: Object.assign({}, s.tdText, { fontFamily: "IBM Plex Mono" }) }, gap.element_code)
      ),
      h(View, { style: s.colPillar },
        h(Text, { style: s.tdText }, pillarLabel(gap.element_code))
      ),
      h(View, { style: s.colDescription },
        h(Text, { style: s.tdText }, gap.description)
      )
    );
  });

  // ─── Remediation rows ──────────────────────────────────────────────────

  var remediationRows = sortedGaps.map(function (gap) {
    return h(View, { style: s.remediationItem, key: gap.element_code, wrap: false },
      h(View, { style: s.remediationHeader },
        h(Text, { style: s.remediationCode }, gap.element_code),
        h(Text, { style: s.remediationName }, gap.element_name),
        h(Text, { style: Object.assign({}, s.severityBadge, { backgroundColor: severityColor(gap.severity) }) }, gap.severity)
      ),
      h(Text, { style: s.remediationText }, gap.recommendation)
    );
  });

  // ─── Confidence text ───────────────────────────────────────────────────

  var confidenceExtra = "";
  if (confidenceLabel === "High") confidenceExtra = " \u2014 Agent assessments were consistent and well-supported.";
  if (confidenceLabel === "Medium") confidenceExtra = " \u2014 Minor discrepancies detected between agent assessments.";
  if (confidenceLabel === "Low") confidenceExtra = " \u2014 Significant inconsistencies detected. Review results carefully.";

  // ─── Gap analysis section ──────────────────────────────────────────────
  // IMPORTANT: gapRows is an array — must be spread via h.apply + concat,
  // not passed as a single child (which causes React error #31).

  var gapContent;
  if (sortedGaps.length === 0) {
    gapContent = h(Text, { style: s.emptyText }, "No gaps identified");
  } else {
    gapContent = h.apply(null, [View, null,
      h(View, { style: s.tableHeader },
        h(Text, { style: Object.assign({}, s.thText, s.colSeverity) }, "Severity"),
        h(Text, { style: Object.assign({}, s.thText, s.colCode) }, "Code"),
        h(Text, { style: Object.assign({}, s.thText, s.colPillar) }, "Pillar"),
        h(Text, { style: Object.assign({}, s.thText, s.colDescription) }, "Description")
      )
    ].concat(gapRows));
  }

  // ─── Remediation section (only if gaps exist) ─────────────────────────
  // Same pattern: spread remediationRows via concat.

  var remediationSection = null;
  if (sortedGaps.length > 0) {
    remediationSection = h.apply(null, [View, null,
      h(Text, { style: s.sectionHeading }, "Remediation Recommendations")
    ].concat(remediationRows));
  }

  // ─── Full document ─────────────────────────────────────────────────────

  return h(Document, null,
    h(Page, { size: "A4", style: s.page },

      // Fixed Header
      h(View, { style: s.header, fixed: true },
        h(Text, { style: s.headerBrand }, "Prova"),
        h(Text, { style: s.headerDate }, formattedDate)
      ),

      // Fixed Footer
      h(View, { style: s.footer, fixed: true },
        h(Text, { style: s.footerText }, "For training and synthetic model documents only \u00b7 SR 11-7 Reference"),
        h(Text, { style: s.footerPage, render: function (p) { return "Page " + p.pageNumber + " of " + p.totalPages; } })
      ),

      // 1. Title Block
      h(Text, { style: s.title }, "Compliance Assessment Report"),
      h(Text, { style: s.subtitle }, modelName + " \u2014 Version " + String(versionNumber)),
      h(Text, { style: s.dateText }, formattedDate),

      // 2. Final Score
      h(View, { style: s.scoreSection },
        h(View, { style: s.scoreRow },
          h(Text, { style: Object.assign({}, s.scoreLarge, { color: scoreColor(finalScore) }) }, String(Math.round(finalScore))),
          h(Text, { style: Object.assign({}, s.statusLabel, { color: scoreColor(finalScore) }) }, status)
        ),
        h(View, { style: s.pillarRow },
          pillarCard("Conceptual Soundness", "40%", pillarScores.conceptual_soundness),
          pillarCard("Outcomes Analysis", "35%", pillarScores.outcomes_analysis),
          pillarCard("Ongoing Monitoring", "25%", pillarScores.ongoing_monitoring)
        )
      ),

      // 3. Assessment Confidence
      h(View, { style: s.confidenceSection },
        h(Text, { style: s.sectionHeading }, "Assessment Confidence"),
        h(Text, { style: s.tdText }, "Confidence Level: " + confidenceLabel + confidenceExtra)
      ),

      // 4. Gap Analysis Table
      h(View, { style: s.gapSection },
        h(Text, { style: s.sectionHeading }, "Gap Analysis"),
        gapContent
      ),

      // 5. Remediation Recommendations
      remediationSection,

      // 6. SR 11-7 Reference
      h(View, { style: s.referenceSection },
        h(Text, { style: s.sectionHeading }, "SR 11-7 Reference"),
        h(Text, { style: s.referenceText },
          "This assessment evaluates model documentation against the Federal Reserve\u2019s SR 11-7 Guidance on Model Risk Management. The three assessment pillars \u2014 Conceptual Soundness (40%), Outcomes Analysis (35%), and Ongoing Monitoring (25%) \u2014 are derived from the core principles outlined in this supervisory guidance. Scores reflect documentation completeness and are not a substitute for formal regulatory review."
        )
      )
    )
  );
}

module.exports = { buildReportElement: buildReportElement };