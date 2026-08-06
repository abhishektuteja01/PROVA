import type { Metadata } from "next";
import Link from "next/link";
import Card from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Privacy Policy · Prova",
  description:
    "What Prova collects when you assess model documentation, where it goes, and how to delete it.",
};

// Last substantive revision. Update whenever the data practices below change,
// not on incidental copy edits.
const EFFECTIVE_DATE = "5 August 2026";
const CONTACT_EMAIL = "atutejawork@gmail.com";

const pageHeadingStyle: React.CSSProperties = {
  fontFamily: "var(--font-playfair)",
  fontSize: "34px",
  fontWeight: 700,
  color: "var(--color-text-primary)",
  margin: "0 0 12px",
  lineHeight: 1.2,
};

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: "var(--font-playfair)",
  fontSize: "20px",
  fontWeight: 700,
  color: "var(--color-text-primary)",
  margin: "0 0 16px",
  lineHeight: 1.3,
};

const subHeadingStyle: React.CSSProperties = {
  fontFamily: "var(--font-geist)",
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--color-text-primary)",
  margin: "0 0 6px",
};

const bodyStyle: React.CSSProperties = {
  fontFamily: "var(--font-geist)",
  fontSize: "14px",
  color: "var(--color-text-secondary)",
  lineHeight: 1.7,
  margin: 0,
};

const metaStyle: React.CSSProperties = {
  fontFamily: "var(--font-ibm-plex-mono)",
  fontSize: "12px",
  color: "var(--color-text-secondary-faint)",
  margin: 0,
  letterSpacing: "0.02em",
};

const codeStyle: React.CSSProperties = {
  fontFamily: "var(--font-ibm-plex-mono)",
  fontSize: "13px",
  color: "var(--color-accent)",
  fontWeight: 500,
};

const linkStyle: React.CSSProperties = {
  color: "var(--color-accent)",
  textDecoration: "none",
};

const listStyle: React.CSSProperties = {
  ...bodyStyle,
  paddingLeft: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  // Sharp corners on data tables — see src/components/CLAUDE.md
  borderRadius: 0,
};

const thStyle: React.CSSProperties = {
  fontFamily: "var(--font-geist)",
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--color-text-secondary-faint)",
  textAlign: "left",
  padding: "0 16px 10px 0",
  borderBottom: "1px solid var(--color-border)",
};

const tdStyle: React.CSSProperties = {
  fontFamily: "var(--font-geist)",
  fontSize: "13px",
  color: "var(--color-text-secondary)",
  lineHeight: 1.6,
  padding: "12px 16px 12px 0",
  borderBottom: "1px solid var(--color-white-divider)",
  verticalAlign: "top",
};

interface Processor {
  name: string;
  purpose: string;
  data: string;
}

const processors: Processor[] = [
  {
    name: "Anthropic",
    purpose: "Runs the four assessment agents (Claude Haiku 4.5)",
    data: "The sanitised text of every document you submit, plus the model name you label it with",
  },
  {
    name: "Supabase",
    purpose: "Database and authentication",
    data: "Your account record and everything stored against it, including document text",
  },
  {
    name: "Vercel",
    purpose: "Application hosting and aggregate traffic analytics",
    data: "Request metadata (IP address, user agent, page paths); no document content",
  },
  {
    name: "Sentry",
    purpose: "Error monitoring and session replay",
    data: "Stack traces, error context, and a sampled subset of session recordings",
  },
  {
    name: "Google",
    purpose: "Optional sign-in provider",
    data: "Only your email address and basic profile, and only if you choose Google sign-in",
  },
];

export default function PrivacyPage() {
  return (
    <main
      style={{
        maxWidth: "820px",
        margin: "0 auto",
        padding: "64px 24px 96px",
      }}
    >
      <Link href="/" style={{ ...metaStyle, ...linkStyle, display: "inline-block", marginBottom: "40px" }}>
        ← Back to Prova
      </Link>

      <header style={{ marginBottom: "40px" }}>
        <h1 style={pageHeadingStyle}>Privacy Policy</h1>
        <p style={metaStyle}>Effective {EFFECTIVE_DATE}</p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <Card>
          <p style={bodyStyle}>
            Prova assesses model documentation against the SR 11-7 supervisory guidance. To do
            that, it has to read the documents you give it and store the results. This page
            describes exactly what is kept, who else sees it, and how to get rid of it. It
            describes the software as actually built — not a superset of what it might do
            someday.
          </p>
        </Card>

        <Card>
          <h2 style={sectionHeadingStyle}>1. What we collect</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <p style={subHeadingStyle}>Account information</p>
              <p style={bodyStyle}>
                Your email address, and a password hash if you registered with a password.
                Authentication is handled by Supabase Auth; Prova never stores your password
                itself. If you sign in with Google, we receive your email address and basic
                profile information from Google and nothing else — Prova requests no access to
                your Gmail, Drive, contacts, or any other Google service.
              </p>
            </div>
            <div>
              <p style={subHeadingStyle}>Documents you submit</p>
              <p style={bodyStyle}>
                The full text of every document you assess is stored in your account, so that
                you can revisit an assessment, compare versions of the same model over time, and
                regenerate PDF reports. Treat this as the central fact of this policy: Prova
                retains your document text, not merely the scores derived from it. Do not submit
                material you are not permitted to store in a third-party system.
              </p>
            </div>
            <div>
              <p style={subHeadingStyle}>Assessment results</p>
              <p style={bodyStyle}>
                The model name and model type you supply, the three pillar scores and the final
                score, and every identified gap — its severity, the SR 11-7 element code, the
                description, and the recommendation. Gap descriptions quote and paraphrase your
                document, so they carry its substance.
              </p>
            </div>
            <div>
              <p style={subHeadingStyle}>Technical records</p>
              <p style={bodyStyle}>
                For each assessment we retain a diagnostic record containing the raw agent and
                judge outputs, the number of retries, total latency, the Claude model used, and a{" "}
                <span style={codeStyle}>SHA-256</span> hash of the submitted text. The hash lets
                us detect duplicate submissions and track scoring consistency over time without
                storing a second copy of the document. We also keep a per-hour counter of your
                assessments to enforce rate limits, and your dashboard display preferences.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 style={sectionHeadingStyle}>2. Uploaded files are never written to disk</h2>
          <p style={bodyStyle}>
            When you upload a <span style={codeStyle}>.pdf</span> or{" "}
            <span style={codeStyle}>.docx</span>, it is held in memory only, for as long as it
            takes to extract the text. The buffer holding the original bytes is then explicitly
            zeroed. The file is never persisted to disk, never placed in object storage, and
            never retained after the request completes. The <em>extracted text</em>, however, is
            stored as described in section 1 — the file is discarded, its contents are not.
          </p>
        </Card>

        <Card>
          <h2 style={sectionHeadingStyle}>3. Who else processes your data</h2>
          <p style={{ ...bodyStyle, marginBottom: "20px" }}>
            Prova is built on third-party infrastructure. Each provider below processes data on
            our behalf, under its own terms:
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Provider</th>
                  <th style={thStyle}>Purpose</th>
                  <th style={thStyle}>What it receives</th>
                </tr>
              </thead>
              <tbody>
                {processors.map((p) => (
                  <tr key={p.name}>
                    <td style={{ ...tdStyle, color: "var(--color-text-primary)", fontWeight: 600 }}>
                      {p.name}
                    </td>
                    <td style={tdStyle}>{p.purpose}</td>
                    <td style={tdStyle}>{p.data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ ...bodyStyle, marginTop: "20px" }}>
            Two of these deserve emphasis. <strong style={{ color: "var(--color-text-primary)" }}>Anthropic</strong>{" "}
            receives your document text, because assessing it is the entire function of the
            product; that text is sent through Anthropic&apos;s commercial API, which does not use
            submitted content to train its models.{" "}
            <strong style={{ color: "var(--color-text-primary)" }}>Sentry</strong> records a
            sampled fraction of browsing sessions — roughly one in twenty ordinary sessions, and
            every session in which an error occurs — to help diagnose faults. These replays mask
            text content by default, but they capture your interactions with pages that display
            assessment results. Prova sells your data to no one, and shares it with no one beyond
            the providers listed above.
          </p>
        </Card>

        <Card>
          <h2 style={sectionHeadingStyle}>4. Aggregate benchmarks</h2>
          <p style={bodyStyle}>
            Prova shows how a model&apos;s scores compare against others of the same type. These
            benchmarks are computed across all submissions in the system, including yours, so
            your assessments do contribute to figures other users see. What those figures expose
            is deliberately narrow: median scores per pillar, submission counts, and the five
            most frequent gap element codes with their frequencies. No document text, no gap
            descriptions, no model names, no submission identifiers, and no user identifiers ever
            enter a benchmark result. Nothing in a benchmark can be traced back to you or to a
            particular document.
          </p>
        </Card>

        <Card>
          <h2 style={sectionHeadingStyle}>5. Retention and deletion</h2>
          <p style={{ ...bodyStyle, marginBottom: "16px" }}>
            We keep your data until you delete it. There is no automatic expiry, and deletion is
            permanent — Prova hard-deletes; it does not flag rows as hidden and keep them.
          </p>
          <ul style={listStyle}>
            <li>
              <strong style={{ color: "var(--color-text-primary)" }}>A single assessment.</strong>{" "}
              Delete it from your submissions list. Its document text, gaps, and diagnostic
              record are removed with it.
            </li>
            <li>
              <strong style={{ color: "var(--color-text-primary)" }}>All assessments.</strong> Use
              the bulk delete in Settings to clear your entire history at once.
            </li>
            <li>
              <strong style={{ color: "var(--color-text-primary)" }}>Your whole account.</strong>{" "}
              Email us at the address below. Deleting the account cascades to every record
              associated with it — models, submissions, gaps, diagnostics, and preferences.
            </li>
          </ul>
          <p style={{ ...bodyStyle, marginTop: "16px" }}>
            One caveat worth stating plainly: once your submissions are deleted they no longer
            count toward the aggregate benchmarks in section 4, but benchmark figures already
            displayed to other users are not retroactively recomputed in their browsers. Since
            those figures are medians and counts containing none of your content, this leaves
            nothing of yours behind.
          </p>
        </Card>

        <Card>
          <h2 style={sectionHeadingStyle}>6. How your data is protected</h2>
          <ul style={listStyle}>
            <li>
              Every database table enforces row-level security keyed to your user ID. A query
              made with your session simply cannot return another user&apos;s rows.
            </li>
            <li>
              Every API request is authenticated server-side before any processing begins, and
              state-changing requests are additionally checked against the application&apos;s own
              origin.
            </li>
            <li>
              All traffic runs over HTTPS. Credentials for third-party services are held in
              server-side environment variables, each confined to a single module, and are never
              exposed to the browser.
            </li>
            <li>
              Submitted text is stripped of HTML and script-like content before it is stored or
              sent to any model, and is passed to the agents inside explicit delimiters so that
              document contents cannot be interpreted as instructions.
            </li>
            <li>
              Assessments are rate-limited per account per hour, which bounds both cost and abuse.
            </li>
          </ul>
          <p style={{ ...bodyStyle, marginTop: "16px" }}>
            No system is perfectly secure, and we make no claim of certification under any
            particular security framework.
          </p>
        </Card>

        <Card>
          <h2 style={sectionHeadingStyle}>7. Your choices</h2>
          <p style={bodyStyle}>
            You can view everything held about you from your dashboard, export any assessment as
            a PDF report, correct a model&apos;s details by submitting a new version, and delete
            any or all of your data at any time. To request a copy of your data in another format,
            or to ask a question this page does not answer, write to us. Depending on where you
            live you may have additional statutory rights over your personal data — including
            access, correction, portability, and erasure — and we will honour any such request
            you make.
          </p>
        </Card>

        <Card>
          <h2 style={sectionHeadingStyle}>8. What Prova is not</h2>
          <p style={bodyStyle}>
            Prova produces an automated, advisory assessment. It is not legal advice, not
            regulatory advice, and not a substitute for independent model validation or
            examination by your regulator. Scores are generated by language models and can be
            wrong. Nothing here creates any assurance that documentation Prova rates as compliant
            will satisfy a supervisory review.
          </p>
        </Card>

        <Card>
          <h2 style={sectionHeadingStyle}>9. Changes to this policy</h2>
          <p style={bodyStyle}>
            If our data practices change, this page changes with them and the effective date at
            the top is updated. Material changes affecting data already collected will be
            communicated to the email address on your account before they take effect.
          </p>
        </Card>

        <Card>
          <h2 style={sectionHeadingStyle}>10. Contact</h2>
          <p style={bodyStyle}>
            Questions about this policy, or requests concerning your data, go to{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} style={linkStyle}>
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Card>
      </div>
    </main>
  );
}
