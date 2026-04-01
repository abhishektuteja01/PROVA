import Skeleton from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <main
      style={{
        background: "var(--color-bg-primary)",
        minHeight: "100vh",
        padding: "32px 20px",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* Heading skeleton */}
        <div style={{ marginBottom: "32px" }}>
          <Skeleton width={160} height={28} style={{ marginBottom: "10px" }} />
          <Skeleton width={120} height={14} />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* Overview Panel skeleton — 4 cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  background: "var(--color-bg-secondary)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "2px",
                  padding: "24px",
                }}
              >
                <Skeleton
                  width={80}
                  height={10}
                  style={{ marginBottom: "14px" }}
                />
                <Skeleton width={60} height={32} />
              </div>
            ))}
          </div>

          {/* Model Inventory Table skeleton */}
          <div
            style={{
              background: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border)",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "20px 20px 16px" }}>
              <Skeleton width={140} height={18} />
            </div>
            <div style={{ padding: "0 20px" }}>
              {/* Header row */}
              <Skeleton
                height={36}
                style={{
                  marginBottom: "1px",
                  width: "100%",
                }}
              />
              {/* Data rows */}
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton
                  key={i}
                  height={42}
                  style={{
                    marginBottom: "1px",
                    width: "100%",
                    opacity: 1 - i * 0.15,
                  }}
                />
              ))}
            </div>
            <div style={{ padding: "14px 20px" }}>
              <Skeleton width={120} height={12} />
            </div>
          </div>

          {/* Score Progression Chart skeleton */}
          <div
            style={{
              background: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border)",
              borderRadius: "2px",
              padding: "24px",
            }}
          >
            <Skeleton
              width={160}
              height={18}
              style={{ marginBottom: "24px" }}
            />
            <Skeleton height={280} style={{ width: "100%" }} />
          </div>

          {/* Recent Activity skeleton */}
          <div
            style={{
              background: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border)",
              borderRadius: "2px",
              padding: "24px",
            }}
          >
            <Skeleton
              width={130}
              height={18}
              style={{ marginBottom: "16px" }}
            />
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderBottom:
                    i < 4 ? "1px solid var(--color-border)" : "none",
                }}
              >
                <Skeleton width={140} height={14} />
                <Skeleton width={40} height={14} />
                <Skeleton width={60} height={14} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
