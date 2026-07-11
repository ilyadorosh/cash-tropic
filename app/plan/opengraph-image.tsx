import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Action in Love — an open research plan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        color: "#f7f0e5",
        background:
          "radial-gradient(circle at 72% 45%, #4b3a24 0%, #24211f 25%, #101216 65%)",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -40,
          left: 820,
          width: 90,
          height: 600,
          display: "flex",
          background:
            "linear-gradient(180deg, rgba(255,207,111,0), rgba(255,195,74,.48), rgba(255,207,111,0))",
          filter: "blur(20px)",
          transform: "rotate(5deg)",
        }}
      />

      <div
        style={{
          width: 745,
          padding: "66px 0 58px 70px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 54,
              height: 48,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
              color: "#ffd06a",
              border: "3px solid #ffd06a",
              borderRadius: 22,
              fontSize: 17,
              boxShadow: "0 0 18px rgba(255,198,73,.42)",
            }}
          >
            ▶
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 32, letterSpacing: 2 }}>actinlove</div>
            <div
              style={{
                marginTop: 3,
                color: "#d2a94e",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 5,
              }}
            >
              OPEN RESEARCH PLAN
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              maxWidth: 680,
              fontSize: 61,
              fontWeight: 750,
              lineHeight: 0.98,
              letterSpacing: -3,
            }}
          >
            Build intelligence that learns
            <span style={{ color: "#ffd06a" }}> without losing itself.</span>
          </div>
          <div
            style={{
              marginTop: 24,
              color: "#cfc8be",
              fontSize: 19,
              lineHeight: 1.4,
            }}
          >
            Adaptive learning · stable dynamics · energy-aware compute · shared
            worlds
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          {["RUNNING", "TESTABLE", "OPEN", "TOGETHER"].map((label, index) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                marginRight: 24,
                color: "#aeb3bc",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 2,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  marginRight: 8,
                  background: ["#22c55e", "#3b82f6", "#a855f7", "#ec4899"][
                    index
                  ],
                  borderRadius: 3,
                }}
              />
              {label}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          width: 355,
          height: 390,
          position: "absolute",
          right: 74,
          top: 112,
          padding: 27,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(145deg, #32363d, #111317 68%)",
          border: "3px solid #5c5d60",
          borderRadius: 28,
          boxShadow: "20px 22px 0 #08090b, 0 0 38px rgba(242,181,70,.18)",
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-end",
            color: "#8d929a",
            fontSize: 12,
            letterSpacing: 3,
          }}
        >
          CORE / 0.2
        </div>
        <div
          style={{
            width: 128,
            height: 116,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffd780",
            border: "6px solid #ffd780",
            borderRadius: 55,
            boxShadow: "0 0 12px #ffc857, 0 0 32px rgba(255,190,76,.65)",
            fontSize: 34,
          }}
        >
          ▶
        </div>
        <div
          style={{
            color: "#c6bfb3",
            fontSize: 13,
            fontWeight: 700,
            textAlign: "center",
            letterSpacing: 2,
            lineHeight: 1.5,
          }}
        >
          PERCEIVE → REMEMBER → MODEL → DECIDE → ACT
        </div>
        <div style={{ display: "flex" }}>
          {[0, 1, 2, 3].map((port) => (
            <div
              key={port}
              style={{
                width: 14,
                height: 14,
                margin: "0 10px",
                background: "#ffd06a",
                border: "2px solid #08090b",
                borderRadius: 7,
                boxShadow: "0 0 8px #ffc452",
              }}
            />
          ))}
        </div>
      </div>
    </div>,
    size,
  );
}
