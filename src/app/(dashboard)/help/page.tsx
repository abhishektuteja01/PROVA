import Card from "@/components/ui/Card";

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: "var(--font-playfair)",
  fontSize: "20px",
  fontWeight: 700,
  color: "var(--color-text-primary)",
  margin: "0 0 16px",
  lineHeight: 1.3,
};

const bodyStyle: React.CSSProperties = {
  fontFamily: "var(--font-geist)",
  fontSize: "14px",
  color: "var(--color-text-secondary)",
  lineHeight: 1.7,
  margin: 0,
};

const codeStyle: React.CSSProperties = {
  fontFamily: "var(--font-ibm-plex-mono)",
  fontSize: "13px",
  color: "var(--color-accent)",
  fontWeight: 500,
};

const pillarHeadingStyle: React.CSSProperties = {
  fontFamily: "var(--font-playfair)",
  fontSize: "16px",
  fontWeight: 700,
  color: "var(--color-text-primary)",
  margin: "0 0 12px",
};

const elementNameStyle: React.CSSProperties = {
  fontFamily: "var(--font-geist)",
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--color-text-primary)",
};

const elementDescStyle: React.CSSProperties = {
  fontFamily: "var(--font-geist)",
  fontSize: "13px",
  color: "var(--color-text-secondary)",
  lineHeight: 1.6,
};

interface ElementDef {
  code: string;
  name: string;
  description: string;
}

const csElements: ElementDef[] = [
  {
    code: "CS-01",
    name: "Model Purpose and Intended Use",
    description:
      "What the model does, what business decisions it supports, and what it should not be used for.",
  },
  {
    code: "CS-02",
    name: "Theoretical/Mathematical Framework",
    description:
      "The underlying theory, equations, or algorithms the model is built on.",
  },
  {
    code: "CS-03",
    name: "Key Assumptions Documentation",
    description:
      "The assumptions the model relies on, each explicitly named and explained.",
  },
  {
    code: "CS-04",
    name: "Assumption Limitations and Boundaries",
    description:
      "Where the assumptions break down and the model becomes unreliable.",
  },
  {
    code: "CS-05",
    name: "Data Inputs and Sources",
    description:
      "What data the model requires, where it comes from, and data quality requirements.",
  },
  {
    code: "CS-06",
    name: "Model Scope and Applicability",
    description:
      "The boundaries of where the model can and cannot be validly applied.",
  },
  {
    code: "CS-07",
    name: "Known Model Weaknesses",
    description:
      "Proactively disclosed limitations, failure modes, or areas of poor performance.",
  },
];

const oaElements: ElementDef[] = [
  {
    code: "OA-01",
    name: "Backtesting Methodology",
    description:
      "How the model's predictions are compared to actual outcomes, including the backtesting period and frequency.",
  },
  {
    code: "OA-02",
    name: "Performance Metrics",
    description:
      "Specific metrics defined (e.g., RMSE, hit rate) with actual reported values, not just metric names.",
  },
  {
    code: "OA-03",
    name: "Benchmarking Against Alternatives",
    description:
      "Comparison of model performance against at least one alternative model or benchmark.",
  },
  {
    code: "OA-04",
    name: "Sensitivity Analysis",
    description:
      "How model outputs change when input parameters vary, with quantitative results rather than qualitative statements.",
  },
  {
    code: "OA-05",
    name: "Stress Testing",
    description:
      "Model behavior under extreme or stressed conditions, with defined scenarios and reported results.",
  },
  {
    code: "OA-06",
    name: "Out-of-Sample Testing",
    description:
      "Evidence that performance was tested on data not used in model development or calibration.",
  },
  {
    code: "OA-07",
    name: "Statistical Validation Results",
    description:
      "Formal statistical tests with reported test statistics and p-values, not just statements that tests were conducted.",
  },
];

const omElements: ElementDef[] = [
  {
    code: "OM-01",
    name: "KPIs and Performance Thresholds",
    description:
      "Specific performance indicators and numeric thresholds defined for ongoing model monitoring.",
  },
  {
    code: "OM-02",
    name: "Monitoring Frequency",
    description:
      "How often each monitoring activity occurs (monthly, quarterly, etc.), stated explicitly.",
  },
  {
    code: "OM-03",
    name: "Escalation Procedures",
    description:
      "Who is notified, what actions are taken, and within what timelines when performance degrades.",
  },
  {
    code: "OM-04",
    name: "Trigger Conditions for Review",
    description:
      "Specific conditions that would trigger a formal model revalidation, such as regime changes or threshold breaches.",
  },
  {
    code: "OM-05",
    name: "Data Quality Monitoring",
    description:
      "A framework for monitoring data quality, completeness, and timeliness on an ongoing basis.",
  },
  {
    code: "OM-06",
    name: "Change Management Process",
    description:
      "How model changes are assessed, validated, and approved before implementation.",
  },
];

function ElementTable({ elements }: { elements: ElementDef[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {elements.map((el) => (
        <div
          key={el.code}
          style={{
            display: "grid",
            gridTemplateColumns: "64px 1fr",
            gap: "12px",
            alignItems: "baseline",
          }}
        >
          <span style={codeStyle}>{el.code}</span>
          <div>
            <span style={elementNameStyle}>{el.name}</span>
            <span style={elementDescStyle}>{" \u2014 "}{el.description}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const deductions = [
  { severity: "Critical", description: "Element completely absent", points: "-20" },
  { severity: "Major", description: "Present but substantially incomplete", points: "-10" },
  { severity: "Minor", description: "Present with small gaps", points: "-5" },
];

const thresholds = [
  { range: "80\u2013100", label: "Compliant", color: "var(--color-compliant)" },
  { range: "60\u201379", label: "Needs Improvement", color: "var(--color-warning)" },
  { range: "0\u201359", label: "Critical Gaps", color: "var(--color-critical)" },
];

export default function HelpPage() {
  return (
    <main
      style={{
        background: "var(--color-bg-primary)",
        minHeight: "100vh",
        padding: "32px 20px",
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* Page heading */}
        <div style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "28px",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Help &amp; Reference
          </h1>
          <p
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "14px",
              color: "var(--color-text-secondary)",
              margin: "8px 0 0",
            }}
          >
            Understanding SR 11-7 compliance assessment
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* Section 1: What is SR 11-7? */}
          <Card animate delay={0}>
            <h2 style={sectionHeadingStyle}>What is SR 11-7?</h2>
            <p style={bodyStyle}>
              SR 11-7 is the Federal Reserve&apos;s Supervisory Guidance on
              Model Risk Management. It sets expectations for how banks and
              financial institutions document, validate, and monitor the models
              they use to make business decisions. Compliance with SR 11-7 is a
              regulatory requirement for institutions subject to Federal Reserve
              oversight.
            </p>
            <p style={{ ...bodyStyle, marginTop: "12px" }}>
              Prova automates the documentation assessment portion of SR 11-7
              compliance. You upload your model documentation, and three
              specialized AI agents evaluate it against the 20 specific elements
              that SR 11-7 requires. You receive a compliance score and a
              detailed report identifying gaps and remediation steps.
            </p>
          </Card>

          {/* Section 2: The Three Validation Pillars */}
          <Card animate delay={0.08}>
            <h2 style={sectionHeadingStyle}>The Three Validation Pillars</h2>
            <p style={{ ...bodyStyle, marginBottom: "20px" }}>
              SR 11-7 organizes model validation into three pillars. Prova
              assesses your documentation against each pillar independently,
              then combines the scores using the weights below.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              {[
                {
                  name: "Conceptual Soundness",
                  weight: "40%",
                  count: "7 elements",
                  description:
                    "Evaluates whether the model's theoretical foundation, assumptions, and scope are properly documented.",
                },
                {
                  name: "Outcomes Analysis",
                  weight: "35%",
                  count: "7 elements",
                  description:
                    "Evaluates whether the model's performance has been tested and validated with real data.",
                },
                {
                  name: "Ongoing Monitoring",
                  weight: "25%",
                  count: "6 elements",
                  description:
                    "Evaluates whether there's a framework for continuously monitoring the model after deployment.",
                },
              ].map((pillar) => (
                <div
                  key={pillar.name}
                  style={{
                    background: "var(--color-bg-tertiary)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "2px",
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-playfair)",
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                      marginBottom: "4px",
                    }}
                  >
                    {pillar.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-ibm-plex-mono)",
                      fontSize: "13px",
                      color: "var(--color-accent)",
                      fontWeight: 500,
                      marginBottom: "8px",
                    }}
                  >
                    {pillar.weight} weight &middot; {pillar.count}
                  </div>
                  <div style={elementDescStyle}>{pillar.description}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Section 3: All 20 Element Codes */}
          <Card animate delay={0.16}>
            <h2 style={sectionHeadingStyle}>All 20 Element Codes</h2>
            <p style={{ ...bodyStyle, marginBottom: "24px" }}>
              Each pillar is broken down into specific elements. Prova assesses
              your documentation against every element and identifies gaps by
              code.
            </p>

            {/* CS Elements */}
            <div style={{ marginBottom: "28px" }}>
              <h3 style={pillarHeadingStyle}>
                Conceptual Soundness{" "}
                <span style={{ ...codeStyle, fontSize: "13px" }}>
                  CS-01 &ndash; CS-07
                </span>
              </h3>
              <ElementTable elements={csElements} />
            </div>

            {/* OA Elements */}
            <div style={{ marginBottom: "28px" }}>
              <h3 style={pillarHeadingStyle}>
                Outcomes Analysis{" "}
                <span style={{ ...codeStyle, fontSize: "13px" }}>
                  OA-01 &ndash; OA-07
                </span>
              </h3>
              <ElementTable elements={oaElements} />
            </div>

            {/* OM Elements */}
            <div>
              <h3 style={pillarHeadingStyle}>
                Ongoing Monitoring{" "}
                <span style={{ ...codeStyle, fontSize: "13px" }}>
                  OM-01 &ndash; OM-06
                </span>
              </h3>
              <ElementTable elements={omElements} />
            </div>
          </Card>

          {/* Section 4: How Scoring Works */}
          <Card animate delay={0.24}>
            <h2 style={sectionHeadingStyle}>How Scoring Works</h2>
            <p style={{ ...bodyStyle, marginBottom: "16px" }}>
              Each pillar starts at 100 points. Points are deducted for each gap
              found in your documentation:
            </p>

            {/* Deduction table */}
            <div
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: "2px",
                overflow: "hidden",
                marginBottom: "20px",
              }}
            >
              {deductions.map((d, i) => (
                <div
                  key={d.severity}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "100px 1fr 80px",
                    gap: "12px",
                    padding: "10px 16px",
                    alignItems: "center",
                    background:
                      i % 2 === 0
                        ? "var(--color-bg-tertiary)"
                        : "transparent",
                    borderBottom:
                      i < deductions.length - 1
                        ? "1px solid var(--color-border)"
                        : "none",
                  }}
                >
                  <span
                    style={{
                      ...elementNameStyle,
                      fontSize: "13px",
                    }}
                  >
                    {d.severity}
                  </span>
                  <span style={elementDescStyle}>{d.description}</span>
                  <span
                    style={{
                      fontFamily: "var(--font-ibm-plex-mono)",
                      fontSize: "13px",
                      color: "var(--color-critical)",
                      fontWeight: 500,
                      textAlign: "right",
                    }}
                  >
                    {d.points}
                  </span>
                </div>
              ))}
            </div>

            <p style={{ ...bodyStyle, marginBottom: "8px" }}>
              The minimum score for any pillar is 0. Your final score is a
              weighted average:
            </p>
            <p
              style={{
                fontFamily: "var(--font-ibm-plex-mono)",
                fontSize: "13px",
                color: "var(--color-accent)",
                lineHeight: 1.7,
                margin: "0 0 20px",
                padding: "12px 16px",
                background: "var(--color-bg-tertiary)",
                borderRadius: "2px",
                border: "1px solid var(--color-border)",
              }}
            >
              Final Score = CS &times; 40% + OA &times; 35% + OM &times; 25%
            </p>

            <p style={{ ...bodyStyle, marginBottom: "12px" }}>
              Your final score determines your compliance status:
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {thresholds.map((t) => (
                <div
                  key={t.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: t.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={elementDescStyle}>
                    <span
                      style={{
                        fontFamily: "var(--font-ibm-plex-mono)",
                        color: t.color,
                        fontWeight: 500,
                      }}
                    >
                      {t.range}
                    </span>
                    {" \u2014 "}
                    {t.label}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Section 5: How to Read a Prova Report */}
          <Card animate delay={0.32}>
            <h2 style={sectionHeadingStyle}>How to Read a Prova Report</h2>
            <p style={{ ...bodyStyle, marginBottom: "12px" }}>
              After each compliance check, Prova generates a PDF report with the
              following sections:
            </p>
            <ul
              style={{
                ...bodyStyle,
                paddingLeft: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <li>
                <span style={elementNameStyle}>Final Score</span> &mdash; your
                overall weighted compliance score and status.
              </li>
              <li>
                <span style={elementNameStyle}>Pillar Breakdown</span> &mdash;
                individual scores for Conceptual Soundness, Outcomes Analysis,
                and Ongoing Monitoring.
              </li>
              <li>
                <span style={elementNameStyle}>Gap Analysis Table</span> &mdash;
                every gap found, sorted by severity. Each row shows the element
                code, what&apos;s missing, and the severity level.
              </li>
              <li>
                <span style={elementNameStyle}>
                  Remediation Recommendations
                </span>{" "}
                &mdash; actionable steps for addressing each gap, prioritized by
                impact on your score.
              </li>
            </ul>
          </Card>

          {/* Section 6: Disclaimer */}
          <Card animate delay={0.4}>
            <div
              style={{
                background: "var(--color-bg-tertiary)",
                border: "1px solid var(--color-border)",
                borderRadius: "2px",
                padding: "16px 20px",
              }}
            >
              <h2
                style={{
                  ...sectionHeadingStyle,
                  fontSize: "16px",
                  marginBottom: "8px",
                }}
              >
                Disclaimer
              </h2>
              <p style={{ ...bodyStyle, fontSize: "13px" }}>
                Prova is designed for training and synthetic model documents
                only. It is not a substitute for formal regulatory review or
                independent model validation. Assessment results should be used
                as a documentation quality indicator, not as regulatory
                compliance certification.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
