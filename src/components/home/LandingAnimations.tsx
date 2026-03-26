"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

// ---- Helpers ----------------------------------------------------------------

function getScoreColor(s: number) {
  if (s >= 80) return "var(--color-compliant)";
  if (s >= 60) return "var(--color-warning)";
  return "var(--color-critical)";
}

function getScoreLabel(s: number) {
  if (s >= 80) return "Compliant";
  if (s >= 60) return "Needs Improvement";
  return "Critical Gaps";
}

function useCountUp(target: number, duration = 1800, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(eased * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(t);
  }, [target, duration, delay]);
  return val;
}

// ---- Data -------------------------------------------------------------------

const PILLARS = [
  {
    code: "PILLAR 01",
    name: "Conceptual Soundness",
    weight: "40%",
    score: 91,
    description:
      "Assesses the theoretical basis, methodology, and documentation of model assumptions across all seven CS elements.",
    elements: ["CS-01", "CS-02", "CS-03", "CS-04", "CS-05", "CS-06", "CS-07"],
  },
  {
    code: "PILLAR 02",
    name: "Outcomes Analysis",
    weight: "35%",
    score: 84,
    description:
      "Evaluates backtesting, benchmarking, and performance documentation to verify the model produces reliable outputs.",
    elements: ["OA-01", "OA-02", "OA-03", "OA-04", "OA-05", "OA-06", "OA-07"],
  },
  {
    code: "PILLAR 03",
    name: "Ongoing Monitoring",
    weight: "25%",
    score: 78,
    description:
      "Reviews governance, monitoring protocols, and change management procedures that sustain the model over time.",
    elements: ["OM-01", "OM-02", "OM-03", "OM-04", "OM-05", "OM-06"],
  },
];

const STEPS = [
  {
    n: "01",
    title: "Upload your model documentation",
    body: "Paste text or upload a PDF or DOCX. Any format your validation team already uses.",
  },
  {
    n: "02",
    title: "Three agents assess in parallel",
    body: "Each SR 11-7 pillar is evaluated simultaneously across all 20 required elements.",
  },
  {
    n: "03",
    title: "Score, gaps, and PDF report",
    body: "A weighted compliance score, prioritised gap analysis, and a downloadable report — in under 30 seconds.",
  },
];

// ---- Score Card -------------------------------------------------------------

function ScoreCard() {
  const score = useCountUp(87, 1800, 500);
  const cs = useCountUp(91, 1500, 700);
  const oa = useCountUp(84, 1500, 800);
  const om = useCountUp(78, 1500, 900);
  const color = getScoreColor(score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      className="bg-bg-secondary border border-border p-6 md:p-9 w-full md:w-[290px] shrink-0 relative"
      style={{ borderRadius: "2px" }}
    >
      <div className="absolute top-0 left-[15%] right-[15%] h-[1px]" style={{ background: `linear-gradient(90deg,transparent,var(--color-accent-medium),transparent)` }} />

      <div style={{ fontFamily: "var(--font-geist)", fontSize: "10px", letterSpacing: "0.14em", color: "var(--color-text-secondary)", textTransform: "uppercase", marginBottom: "10px" }}>
        Compliance Score
      </div>

      <div style={{ fontFamily: "var(--font-ibm-plex-mono)", fontSize: "86px", fontWeight: 600, lineHeight: 1, letterSpacing: "-2px", color, transition: "color 0.4s ease", marginBottom: "14px" }}>
        {score}
      </div>

      <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "4px 12px", borderRadius: "100px", background: `${color}15`, border: `1px solid ${color}35`, marginBottom: "26px", opacity: score > 4 ? 1 : 0, transition: "opacity 0.4s ease" }}>
        <span style={{ display: "block", width: "6px", height: "6px", borderRadius: "50%", background: color, transition: "background 0.4s ease" }} />
        <span style={{ fontFamily: "var(--font-geist)", fontSize: "12px", fontWeight: 500, color, transition: "color 0.4s ease" }}>
          {getScoreLabel(score)}
        </span>
      </div>

      <div style={{ height: "1px", background: "var(--color-border)", marginBottom: "20px" }} />

      {[
        { short: "CS", val: cs, w: "40%" },
        { short: "OA", val: oa, w: "35%" },
        { short: "OM", val: om, w: "25%" },
      ].map(({ short, val, w }) => {
        const c = getScoreColor(val);
        return (
          <div key={short} style={{ marginBottom: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="font-mono text-[11px] font-medium text-text-secondary">{short}</span>
                <span className="font-mono text-[10px] opacity-35">{w}</span>
              </div>
              <span style={{ fontFamily: "var(--font-ibm-plex-mono)", fontSize: "13px", fontWeight: 600, color: c, transition: "color 0.3s ease" }}>{val}</span>
            </div>
            <div style={{ height: "3px", background: "var(--color-white-faint)", borderRadius: "0px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${val}%`, background: c, borderRadius: "0px", transition: "width 0.06s linear, background 0.3s ease" }} />
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: "12px", paddingTop: "14px", borderTop: `1px solid var(--color-white-divider)`, display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--font-ibm-plex-mono)", fontSize: "10px", color: "var(--color-text-secondary-dim)", letterSpacing: "0.06em" }}>CREDIT RISK MODEL v3</span>
        <span style={{ fontFamily: "var(--font-ibm-plex-mono)", fontSize: "10px", color: "var(--color-text-secondary-dim)" }}>ACME BANK</span>
      </div>
    </motion.div>
  );
}

// ---- Fade-in wrapper --------------------------------------------------------

function FadeIn({ children, delay = 0, className, style }: { children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ---- Landing Page Content ---------------------------------------------------

export default function LandingAnimations() {
  return (
    <div style={{ background: "var(--color-bg-primary)", minHeight: "100vh", position: "relative", overflowX: "hidden" }}>

      {/* Background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-15%", right: "-8%", width: "600px", height: "600px", borderRadius: "50%", background: `radial-gradient(circle, var(--color-accent-subtle) 0%, transparent 65%)`, filter: "blur(60px)", animation: "orb1 24s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "-18%", left: "-8%", width: "500px", height: "500px", borderRadius: "50%", background: `radial-gradient(circle, var(--color-accent-hint) 0%, transparent 65%)`, filter: "blur(72px)", animation: "orb2 30s ease-in-out infinite" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, var(--color-text-secondary) 1px, transparent 1px)", backgroundSize: "30px 30px", opacity: 0.1, maskImage: "radial-gradient(ellipse 80% 70% at 50% 40%, black 20%, transparent 100%)" }} />
      </div>

      {/* Hero */}
      <section className="relative z-10 min-h-screen flex flex-col md:flex-row items-center px-5 py-24 md:px-20 md:py-28 max-w-[1280px] mx-auto gap-12 md:gap-20">
        <div className="flex-1 min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "32px", padding: "5px 14px", border: `1px solid var(--color-accent-border-light)`, borderRadius: "100px", background: "var(--color-accent-subtle)" }}
          >
            <span style={{ display: "block", width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-accent)", animation: "pulse 2.5s ease-in-out infinite" }} />
            <span style={{ fontFamily: "var(--font-ibm-plex-mono)", fontSize: "11px", color: "var(--color-accent)", letterSpacing: "0.1em" }}>
              SR 11-7 · MODEL RISK COMPLIANCE
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            style={{ fontFamily: "var(--font-playfair)", fontSize: "clamp(42px, 5.2vw, 68px)", fontWeight: 400, lineHeight: 1.08, letterSpacing: "-0.5px", marginBottom: "22px" }}
          >
            <span style={{ color: "var(--color-text-primary)" }}>Know what&apos;s missing</span>
            <br />
            <span style={{ color: "var(--color-text-secondary)" }}>before regulators do.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
            style={{ fontFamily: "var(--font-geist)", fontSize: "17px", color: "var(--color-text-secondary)", lineHeight: 1.7, maxWidth: "460px", marginBottom: "44px" }}
          >
            Prova scores your model documentation against every SR 11-7 requirement. Three AI agents. Twenty elements. One compliance score.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.48 }}
            style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "56px" }}
          >
            <Link
              href="/signup"
              className="focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
              style={{ fontFamily: "var(--font-geist)", fontSize: "14px", fontWeight: 500, color: "var(--color-bg-primary)", background: "var(--color-accent)", padding: "13px 28px", borderRadius: "0px", textDecoration: "none", transition: "opacity 0.15s ease" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              Start checking →
            </Link>
            <Link
              href="/login"
              className="focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
              style={{ fontFamily: "var(--font-geist)", fontSize: "14px", fontWeight: 400, color: "var(--color-text-secondary)", border: "1px solid var(--color-border)", padding: "13px 28px", borderRadius: "0px", textDecoration: "none", transition: "color 0.15s ease, border-color 0.15s ease" }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--color-text-primary)"; e.currentTarget.style.borderColor = "var(--color-text-secondary)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--color-text-secondary)"; e.currentTarget.style.borderColor = "var(--color-border)"; }}
            >
              Sign in
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex flex-wrap md:flex-nowrap pt-9"
            style={{ borderTop: `1px solid var(--color-white-divider)` }}
          >
            {[
              { value: "20", label: "SR 11-7 elements" },
              { value: "3", label: "parallel agents" },
              { value: "<30s", label: "to a full score" },
            ].map(({ value, label }, i) => (
              <div key={label} className={`flex-1 min-w-[120px] mb-6 md:mb-0`} style={i > 0 ? { borderLeft: `1px solid var(--color-white-divider)`, paddingLeft: "28px", marginLeft: "28px" } : undefined}>
                <div className="font-mono text-2xl font-semibold text-text-primary mb-1">{value}</div>
                <div className="font-sans text-[12px] text-text-secondary">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        <ScoreCard />
      </section>

      {/* Pillars */}
      <section className="relative z-10 max-w-[1280px] mx-auto px-5 md:px-20 py-10 md:py-24">
        <FadeIn className="mb-12">
          <div className="font-mono text-[10px] tracking-widest text-accent mb-3 opacity-70">THE THREE PILLARS</div>
          <h2 className="font-serif text-[clamp(26px,2.8vw,40px)] leading-tight text-text-primary m-0">
            Every SR 11-7 dimension, covered.
          </h2>
        </FadeIn>

        <div className="flex flex-col md:flex-row gap-4">
          {PILLARS.map((pillar, i) => (
            <FadeIn key={pillar.code} delay={i * 0.08} style={{ flex: 1 }}>
              <div style={{ height: "100%", background: "var(--color-bg-secondary)", border: "1px solid var(--color-border)", borderRadius: "2px", padding: "28px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: "1px", background: `linear-gradient(90deg,transparent,var(--color-accent-line),transparent)` }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-ibm-plex-mono)", fontSize: "10px", letterSpacing: "0.12em", color: "var(--color-accent)", marginBottom: "7px", opacity: 0.65 }}>{pillar.code}</div>
                    <div style={{ fontFamily: "var(--font-playfair)", fontSize: "20px", color: "var(--color-text-primary)", lineHeight: 1.2 }}>{pillar.name}</div>
                  </div>
                  <div style={{ fontFamily: "var(--font-ibm-plex-mono)", fontSize: "11px", fontWeight: 600, color: "var(--color-accent)", background: "var(--color-accent-faint)", padding: "4px 10px", borderRadius: "6px", border: `1px solid var(--color-accent-border)`, flexShrink: 0, marginLeft: "14px" }}>
                    {pillar.weight}
                  </div>
                </div>

                <p style={{ fontFamily: "var(--font-geist)", fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.65, marginBottom: "24px" }}>
                  {pillar.description}
                </p>

                <div style={{ marginBottom: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontFamily: "var(--font-geist)", fontSize: "11px", color: "var(--color-text-secondary-faint)" }}>Sample score</span>
                    <span style={{ fontFamily: "var(--font-ibm-plex-mono)", fontSize: "12px", fontWeight: 600, color: getScoreColor(pillar.score) }}>{pillar.score}</span>
                  </div>
                  <div style={{ height: "3px", background: "var(--color-white-faint)", borderRadius: "0px", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pillar.score}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 + 0.2 }}
                      style={{ height: "100%", background: getScoreColor(pillar.score), borderRadius: "0px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                  {pillar.elements.map(el => (
                    <span key={el} style={{ fontFamily: "var(--font-ibm-plex-mono)", fontSize: "10px", color: "var(--color-text-secondary-ghost)", background: "var(--color-white-hint)", border: `1px solid var(--color-white-border)`, padding: "2px 7px", borderRadius: "3px" }}>
                      {el}
                    </span>
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="relative z-10 max-w-[1280px] mx-auto px-5 md:px-20 py-5 md:py-24">
        <FadeIn className="mb-12">
          <div className="font-mono text-[10px] tracking-widest text-accent mb-3 opacity-70">HOW IT WORKS</div>
          <h2 className="font-serif text-[clamp(26px,2.8vw,40px)] leading-tight text-text-primary m-0">
            From document to score in three steps.
          </h2>
        </FadeIn>

        <div className="flex flex-col md:flex-row relative">
          <div style={{ position: "absolute", top: "19px", left: "20px", right: "20px", height: "1px", background: "var(--color-white-rule)" }}>
            <motion.div
              initial={{ width: "0%" }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              style={{ height: "100%", background: `linear-gradient(90deg, transparent, var(--color-accent-medium), transparent)` }}
            />
          </div>

          {STEPS.map((step, i) => (
            <FadeIn key={step.n} delay={i * 0.1 + 0.15} className={`flex-1 pt-14 md:pt-14 ${i < STEPS.length - 1 ? "md:pr-12" : ""} mb-10 md:mb-0 relative`}>
              <div className="absolute top-0 md:-top-0 left-0 md:left-0 w-9 h-9 border border-accent/20 bg-bg-secondary flex items-center justify-center font-mono text-[11px] font-semibold text-accent" style={{ borderRadius: "50%" }}>
                {step.n}
              </div>
              <h3 className="font-sans text-[16px] font-medium text-text-primary mb-3 leading-snug">
                {step.title}
              </h3>
              <p className="font-sans text-[14px] text-text-secondary leading-relaxed m-0">
                {step.body}
              </p>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-[1280px] mx-auto px-5 md:px-20 mb-20">
        <FadeIn>
          <div className="border border-accent/10 p-9 md:p-12 flex flex-col md:flex-row items-center justify-between gap-10" style={{ borderRadius: "2px", background: "var(--color-accent-hint)" }}>
            <div className="text-center md:text-left">
              <h2 className="font-serif text-[clamp(22px,2.2vw,34px)] text-text-primary mb-2 m-0">
                Ready to score your documentation?
              </h2>
              <p className="font-sans text-[14px] text-text-secondary m-0">
                Upload a model doc and get a full SR 11-7 compliance assessment.
              </p>
            </div>
            <Link
              href="/signup"
              className="bg-accent text-bg-primary font-sans text-[14px] font-medium px-7 py-3 w-full md:w-auto text-center shrink-0 transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
              style={{ borderRadius: "0px", textDecoration: "none" }}
            >
              Get started →
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-5 md:px-20 py-7 max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6" style={{ borderTop: `1px solid var(--color-white-divider)` }}>
        <span className="font-serif text-[17px] text-text-secondary">Prova</span>
        <span className="font-sans text-[12px] text-center" style={{ color: "var(--color-text-secondary-dim)" }}>
          For training and synthetic model documents only
        </span>
        <div className="flex gap-6">
          {([["Sign in", "/login"], ["Get started", "/signup"]] as const).map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="font-sans text-[13px] transition-colors hover:text-text-secondary focus-visible:ring-2 focus-visible:ring-accent"
              style={{ textDecoration: "none", color: "var(--color-text-secondary-dim)" }}
            >
              {label}
            </Link>
          ))}
        </div>
      </footer>

      <style>{`
        @keyframes orb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(-30px,22px) scale(1.05); }
          66%      { transform: translate(20px,-16px) scale(0.97); }
        }
        @keyframes orb2 {
          0%,100% { transform: translate(0,0) scale(1); }
          45%      { transform: translate(28px,-20px) scale(1.04); }
          75%      { transform: translate(-16px,16px) scale(0.98); }
        }
        @keyframes pulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
