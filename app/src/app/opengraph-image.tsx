import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Texas Title Insurance Manual Assistant";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #FAFAF9 0%, #F5F5F4 50%, #E7E5E4 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "60px",
            maxWidth: "900px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "32px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "#2563EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
            </div>
          </div>

          <div
            style={{
              fontSize: "52px",
              fontWeight: 700,
              color: "#1C1917",
              textAlign: "center",
              lineHeight: 1.15,
              letterSpacing: "-0.025em",
              marginBottom: "20px",
            }}
          >
            Texas Title Insurance
          </div>
          <div
            style={{
              fontSize: "52px",
              fontWeight: 700,
              color: "#1C1917",
              textAlign: "center",
              lineHeight: 1.15,
              letterSpacing: "-0.025em",
              marginBottom: "28px",
            }}
          >
            Manual Assistant
          </div>

          <div
            style={{
              fontSize: "22px",
              color: "#78716C",
              textAlign: "center",
              lineHeight: 1.5,
              maxWidth: "700px",
            }}
          >
            Ask plain-English questions about the TDI Basic Manual.
            Get cited answers from statutes, rules, and forms.
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "40px",
            }}
          >
            {["Statutes", "Rate Rules", "Procedures", "60+ Forms"].map(
              (tag) => (
                <div
                  key={tag}
                  style={{
                    padding: "8px 20px",
                    borderRadius: "999px",
                    background: "white",
                    border: "1px solid #E7E5E4",
                    fontSize: "16px",
                    color: "#57534E",
                    fontWeight: 500,
                  }}
                >
                  {tag}
                </div>
              )
            )}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "32px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            color: "#A8A29E",
          }}
        >
          Built by Republic Square Media
        </div>
      </div>
    ),
    { ...size }
  );
}
