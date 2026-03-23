import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Prova - SR 11-7 Model Documentation Compliance";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#ffffff",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            stroke="black"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <path d="M9 16.5V9h4.5a2.5 2.5 0 0 1 0 5H9" />
            <line x1="6" y1="11.5" x2="9" y2="11.5" />
            <line x1="6" y1="14" x2="13.5" y2="14" />
            <line x1="9" y1="20" x2="9" y2="16.5" />
            <line x1="13.5" y1="16.5" x2="13.5" y2="20" />
          </svg>
          <div
            style={{
              fontSize: "100px",
              fontFamily: "serif",
              color: "black",
              letterSpacing: "0.05em",
            }}
          >
            PROVA
          </div>
        </div>
        <div
          style={{
            marginTop: "40px",
            fontSize: "32px",
            color: "#666666",
            fontFamily: "sans-serif",
          }}
        >
          Model Documentation Compliance
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
