"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import Toggle from "@/components/ui/Toggle";
import {
  BENCHMARK_MIN_CORPUS_N,
  MODEL_TYPE_LABELS,
  type BenchmarkStats,
  type CorpusDisclosure,
  type SubmissionListItem,
} from "@/lib/validation/schemas";
import { getScoreColor } from "./utils";

interface BenchmarksViewProps {
  submissions: SubmissionListItem[];
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color?: string;
  fill?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function ChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        background: "var(--color-bg-tertiary)",
        border: "1px solid var(--color-border)",
        borderRadius: "2px",
        padding: "10px 14px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-geist)",
          fontSize: "11px",
          color: "var(--color-text-secondary)",
          marginBottom: "6px",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </div>
      {payload.map((entry) => (
        <div
          key={entry.name}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "2px",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              background: entry.color ?? entry.fill,
              display: "inline-block",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "11px",
              color: "var(--color-text-secondary)",
              flex: 1,
            }}
          >
            {entry.name}
          </span>
          <span
            style={{
              fontFamily: "var(--font-ibm-plex-mono)",
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            {Math.round(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

interface StatsEntry {
  key: string;
  data: BenchmarkStats | null;
  error: string | null;
}

interface DisclosureEntry {
  loaded: boolean;
  data: CorpusDisclosure | null;
}

function statsKey(modelType: string, includeSynthetic: boolean): string {
  return `${modelType}|${includeSynthetic ? "syn" : "real"}`;
}

export default function BenchmarksView({ submissions }: BenchmarksViewProps) {
  const [focalId, setFocalId] = useState<string | "">(
    submissions[0]?.id ?? ""
  );
  const [includeSynthetic, setIncludeSynthetic] = useState(true);
  // Single state object so loading is *derived* from whether the resolved
  // entry's key matches the currently requested key. This avoids synchronous
  // setState within the effect body (react-hooks/set-state-in-effect).
  const [statsEntry, setStatsEntry] = useState<StatsEntry | null>(null);
  const [disclosureEntry, setDisclosureEntry] = useState<DisclosureEntry>({
    loaded: false,
    data: null,
  });

  const focal = useMemo(
    () => submissions.find((s) => s.id === focalId) ?? null,
    [submissions, focalId]
  );

  const requestedKey = focal ? statsKey(focal.model_type, includeSynthetic) : null;
  const statsLoading = requestedKey !== null && statsEntry?.key !== requestedKey;
  const stats = statsEntry?.key === requestedKey ? statsEntry.data : null;
  const statsError =
    statsEntry?.key === requestedKey ? statsEntry.error : null;
  const disclosure = disclosureEntry.data;
  const disclosureLoading = !disclosureEntry.loaded;

  // Fetch corpus disclosure once on mount.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/benchmarks/disclosure")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
      .then((data: CorpusDisclosure) => {
        if (!cancelled) setDisclosureEntry({ loaded: true, data });
      })
      .catch(() => {
        if (!cancelled) setDisclosureEntry({ loaded: true, data: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch benchmark stats whenever focal model_type or synthetic toggle changes.
  useEffect(() => {
    if (!focal) return;
    const key = statsKey(focal.model_type, includeSynthetic);
    let cancelled = false;
    const params = new URLSearchParams({
      model_type: focal.model_type,
      include_synthetic: includeSynthetic ? "true" : "false",
    });
    fetch(`/api/benchmarks?${params.toString()}`)
      .then((res) =>
        res.ok ? res.json() : Promise.reject(`HTTP ${res.status}`)
      )
      .then((data: BenchmarkStats) => {
        if (!cancelled) setStatsEntry({ key, data, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setStatsEntry({
            key,
            data: null,
            error: typeof err === "string" ? err : "Failed to load benchmarks.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [focal, includeSynthetic]);

  if (submissions.length === 0) {
    return (
      <Card animate>
        <div
          style={{
            textAlign: "center",
            padding: "32px 0",
            fontFamily: "var(--font-geist)",
            fontSize: "13px",
            color: "var(--color-text-secondary)",
          }}
        >
          No assessments yet. Run a compliance check to begin benchmarking.
        </div>
      </Card>
    );
  }

  const insufficient =
    stats !== null && stats.corpus_n < BENCHMARK_MIN_CORPUS_N;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <DisclosureBanner
        disclosure={disclosure}
        loading={disclosureLoading}
      />

      <Card animate delay={0.04}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <div style={{ flex: "1 1 320px", minWidth: "260px" }}>
            <label
              htmlFor="focal-select"
              style={{
                display: "block",
                fontFamily: "var(--font-geist)",
                fontSize: "11px",
                fontWeight: 500,
                color: "var(--color-text-secondary)",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Assessment
            </label>
            <select
              id="focal-select"
              value={focalId}
              onChange={(e) => setFocalId(e.target.value)}
              style={{
                fontFamily: "var(--font-geist)",
                fontSize: "13px",
                color: "var(--color-text-primary)",
                background: "var(--color-bg-tertiary)",
                border: "1px solid var(--color-border)",
                borderRadius: "2px",
                padding: "10px 14px",
                width: "100%",
                cursor: "pointer",
              }}
            >
              {submissions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.model_name} · v{s.version_number} ·{" "}
                  {MODEL_TYPE_LABELS[s.model_type]}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "8px 0",
            }}
          >
            <Toggle
              checked={includeSynthetic}
              onChange={setIncludeSynthetic}
            />
            <div>
              <div
                style={{
                  fontFamily: "var(--font-geist)",
                  fontSize: "12px",
                  color: "var(--color-text-primary)",
                  fontWeight: 500,
                }}
              >
                Include synthetic
              </div>
              <div
                style={{
                  fontFamily: "var(--font-geist)",
                  fontSize: "11px",
                  color: "var(--color-text-secondary)",
                  opacity: 0.7,
                }}
              >
                {includeSynthetic
                  ? "Showing synthetic + real assessments"
                  : "Showing real assessments only"}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {focal && (
        <FocalHeader focal={focal} />
      )}

      {focal && statsLoading && <BenchmarkSkeleton />}

      {focal && !statsLoading && statsError && (
        <Card>
          <div
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "13px",
              color: "var(--color-critical)",
              padding: "16px 0",
              textAlign: "center",
            }}
          >
            Could not load benchmark stats. Please try again.
          </div>
        </Card>
      )}

      {focal && !statsLoading && stats && insufficient && (
        <InsufficientCorpus stats={stats} focal={focal} />
      )}

      {focal && !statsLoading && stats && !insufficient && (
        <>
          <PillarComparison focal={focal} stats={stats} />
          <TopGapsTable stats={stats} />
        </>
      )}
    </div>
  );
}

// ─── Disclosure banner ──────────────────────────────────────────────────────

function DisclosureBanner({
  disclosure,
  loading,
}: {
  disclosure: CorpusDisclosure | null;
  loading: boolean;
}) {
  return (
    <Card
      animate
      delay={0.02}
      style={{
        padding: "16px 20px",
        background: "var(--color-bg-tertiary)",
        borderColor: "var(--color-border)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ flex: "1 1 280px", minWidth: "240px" }}>
          <div
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--color-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "4px",
            }}
          >
            Benchmark corpus
          </div>
          {loading ? (
            <Skeleton width={260} height={14} />
          ) : disclosure ? (
            <div
              style={{
                fontFamily: "var(--font-geist)",
                fontSize: "13px",
                color: "var(--color-text-primary)",
                lineHeight: 1.5,
              }}
            >
              <span style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
                N={disclosure.total_n}
              </span>{" "}
              assessments (
              <span style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
                {disclosure.synthetic_n}
              </span>{" "}
              synthetic,{" "}
              <span style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
                {disclosure.real_n}
              </span>{" "}
              real). As real-world volume grows, benchmarks become more
              meaningful.
            </div>
          ) : (
            <div
              style={{
                fontFamily: "var(--font-geist)",
                fontSize: "13px",
                color: "var(--color-text-secondary)",
              }}
            >
              Corpus counts unavailable.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Focal assessment header ────────────────────────────────────────────────

function FocalHeader({ focal }: { focal: SubmissionListItem }) {
  return (
    <Card animate delay={0.06}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "32px",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ minWidth: 0, flex: "1 1 280px" }}>
          <div
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--color-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "6px",
            }}
          >
            This assessment
          </div>
          <div
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              marginBottom: "4px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {focal.model_name}{" "}
            <span
              style={{
                fontFamily: "var(--font-ibm-plex-mono)",
                fontSize: "14px",
                color: "var(--color-text-secondary)",
                fontWeight: 400,
              }}
            >
              v{focal.version_number}
            </span>
          </div>
          <div
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "12px",
              color: "var(--color-text-secondary)",
            }}
          >
            {MODEL_TYPE_LABELS[focal.model_type]}
            {focal.is_synthetic && (
              <span
                style={{
                  marginLeft: "10px",
                  fontFamily: "var(--font-geist)",
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "var(--color-warning)",
                  border: "1px solid var(--color-warning)",
                  padding: "1px 6px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Synthetic
              </span>
            )}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--color-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "4px",
            }}
          >
            Final score
          </div>
          <div
            style={{
              fontFamily: "var(--font-ibm-plex-mono)",
              fontSize: "44px",
              fontWeight: 600,
              color: getScoreColor(focal.final_score),
              lineHeight: 1,
            }}
          >
            {Math.round(focal.final_score)}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Insufficient corpus state ──────────────────────────────────────────────

function InsufficientCorpus({
  stats,
  focal,
}: {
  stats: BenchmarkStats;
  focal: SubmissionListItem;
}) {
  return (
    <Card animate delay={0.08}>
      <div
        style={{
          textAlign: "center",
          padding: "32px 16px",
          maxWidth: 520,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-geist)",
            fontSize: "11px",
            fontWeight: 500,
            color: "var(--color-warning)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "12px",
          }}
        >
          Insufficient corpus
        </div>
        <div
          style={{
            fontFamily: "var(--font-geist)",
            fontSize: "14px",
            color: "var(--color-text-primary)",
            marginBottom: "8px",
            lineHeight: 1.5,
          }}
        >
          Insufficient corpus (
          <span style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
            N={stats.corpus_n}
          </span>
          ) — benchmarks unavailable for {MODEL_TYPE_LABELS[focal.model_type]} yet.
        </div>
        <div
          style={{
            fontFamily: "var(--font-geist)",
            fontSize: "12px",
            color: "var(--color-text-secondary)",
            lineHeight: 1.5,
          }}
        >
          A minimum of {BENCHMARK_MIN_CORPUS_N} assessments in this model_type
          is required before showing medians, both for statistical relevance
          and to prevent any inference about a single user&rsquo;s assessment.
        </div>
      </div>
    </Card>
  );
}

// ─── Pillar comparison chart ────────────────────────────────────────────────

function PillarComparison({
  focal,
  stats,
}: {
  focal: SubmissionListItem;
  stats: BenchmarkStats;
}) {
  const data = [
    {
      name: "Conceptual Soundness",
      focal: focal.conceptual_score,
      median: stats.cs_median ?? 0,
    },
    {
      name: "Outcomes Analysis",
      focal: focal.outcomes_score,
      median: stats.oa_median ?? 0,
    },
    {
      name: "Ongoing Monitoring",
      focal: focal.monitoring_score,
      median: stats.om_median ?? 0,
    },
  ];

  return (
    <Card animate delay={0.08}>
      <div style={{ marginBottom: "16px" }}>
        <h2
          style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "18px",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            margin: 0,
          }}
        >
          Pillar comparison
        </h2>
        <div
          style={{
            fontFamily: "var(--font-geist)",
            fontSize: "12px",
            color: "var(--color-text-secondary)",
            marginTop: "4px",
          }}
        >
          Your scores vs. corpus median for{" "}
          {MODEL_TYPE_LABELS[focal.model_type]} ·{" "}
          <span style={{ fontFamily: "var(--font-ibm-plex-mono)" }}>
            N={stats.corpus_n}
          </span>{" "}
          ({stats.synthetic_n} synthetic, {stats.real_n} real)
        </div>
      </div>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
            barCategoryGap="30%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{
                fill: "var(--color-text-secondary)",
                fontSize: 11,
                fontFamily: "var(--font-geist)",
              }}
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{
                fill: "var(--color-text-secondary)",
                fontSize: 11,
                fontFamily: "var(--font-ibm-plex-mono)",
              }}
              axisLine={{ stroke: "var(--color-border)" }}
              tickLine={false}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: "var(--color-bg-tertiary)", opacity: 0.4 }}
            />
            <Legend
              wrapperStyle={{
                fontFamily: "var(--font-geist)",
                fontSize: 11,
                color: "var(--color-text-secondary)",
              }}
            />
            <Bar
              dataKey="focal"
              name="This assessment"
              fill="var(--color-accent)"
            />
            <Bar
              dataKey="median"
              name="Corpus median"
              fill="var(--color-text-secondary)"
              fillOpacity={0.55}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {stats.final_median !== null && (
        <div
          style={{
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-geist)",
              fontSize: "12px",
              color: "var(--color-text-secondary)",
            }}
          >
            Final-score corpus median
          </div>
          <div
            style={{
              fontFamily: "var(--font-ibm-plex-mono)",
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            {Math.round(stats.final_median)}
          </div>
        </div>
      )}
    </Card>
  );
}

// ─── Top gaps table ─────────────────────────────────────────────────────────

function TopGapsTable({ stats }: { stats: BenchmarkStats }) {
  if (stats.top_gaps.length === 0) {
    return null;
  }

  return (
    <Card animate delay={0.1} style={{ padding: 0, overflow: "hidden" }}>
      <div
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "18px",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            margin: 0,
          }}
        >
          Top 5 most common gaps
        </h2>
        <div
          style={{
            fontFamily: "var(--font-geist)",
            fontSize: "12px",
            color: "var(--color-text-secondary)",
            marginTop: "4px",
          }}
        >
          Across all {MODEL_TYPE_LABELS[stats.model_type]} assessments in the
          corpus.
        </div>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          borderRadius: 0,
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                ...TH_STYLE,
                width: "120px",
              }}
            >
              Element
            </th>
            <th style={TH_STYLE}>Name</th>
            <th
              style={{
                ...TH_STYLE,
                textAlign: "right",
                width: "120px",
              }}
            >
              Frequency
            </th>
          </tr>
        </thead>
        <tbody>
          {stats.top_gaps.map((gap, i) => (
            <tr
              key={gap.element_code}
              style={{
                borderBottom:
                  i === stats.top_gaps.length - 1
                    ? "none"
                    : "1px solid var(--color-border)",
              }}
            >
              <td
                style={{
                  ...TD_STYLE,
                  fontFamily: "var(--font-ibm-plex-mono)",
                  fontWeight: 500,
                }}
              >
                {gap.element_code}
              </td>
              <td style={TD_STYLE}>{gap.element_name}</td>
              <td
                style={{
                  ...TD_STYLE,
                  fontFamily: "var(--font-ibm-plex-mono)",
                  textAlign: "right",
                  fontWeight: 600,
                }}
              >
                {gap.frequency} / {stats.corpus_n}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// ─── Skeleton loading state ─────────────────────────────────────────────────

function BenchmarkSkeleton() {
  return (
    <>
      <Card style={{ padding: "24px" }}>
        <Skeleton width={160} height={12} style={{ marginBottom: "12px" }} />
        <Skeleton height={280} style={{ width: "100%" }} />
      </Card>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <Skeleton width={180} height={16} />
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              padding: "12px 24px",
              borderBottom:
                i === 4 ? "none" : "1px solid var(--color-border)",
              display: "flex",
              gap: "20px",
              opacity: 1 - i * 0.12,
            }}
          >
            <Skeleton width={60} height={12} />
            <Skeleton width={200} height={12} style={{ flex: 1 }} />
            <Skeleton width={50} height={12} />
          </div>
        ))}
      </Card>
    </>
  );
}

// ─── Shared style constants ─────────────────────────────────────────────────

const TH_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-geist)",
  fontSize: "10px",
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--color-text-secondary)",
  padding: "10px 24px",
  textAlign: "left",
  whiteSpace: "nowrap",
  background: "var(--color-bg-tertiary)",
  borderBottom: "1px solid var(--color-border)",
};

const TD_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-geist)",
  fontSize: "13px",
  color: "var(--color-text-primary)",
  padding: "12px 24px",
};
