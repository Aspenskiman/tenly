import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  bg,
  border,
  fontUi,
  scoreColor,
  scoreZoneLabel,
  springConfig,
  surface,
  textFaint,
  textLabel,
  textMuted,
  textWhite,
  trendUp,
} from "../theme";
import { TrendChart } from "./dashboard/TrendChart";

const MEMBER_NAME = "Maya Chen";
const LATEST_SCORE = 7;
const AVG_SCORE = 6.4;
const CHECKIN_COUNT = 13;

const RANGES: { readonly label: string; readonly highlighted: boolean }[] = [
  { label: "4w", highlighted: false },
  { label: "8w", highlighted: false },
  { label: "12w", highlighted: true },
  { label: "16w", highlighted: false },
];

export const DashboardScene: React.FC = () => {
  const frame = useCurrentFrame(); // local 0..509
  const { fps } = useVideoConfig();

  // Header — local 0–30.
  const headerSpring = spring({ frame, fps, config: springConfig });
  const headerOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headerTranslate = (1 - headerSpring) * -20;

  // Hero card — local 30–90.
  const heroSpring = spring({
    frame: frame - 30,
    fps,
    config: springConfig,
  });
  const heroOpacity = interpolate(frame, [30, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const heroTranslate = (1 - heroSpring) * 20;

  // Range pills — local 90–120.
  const rangeOpacity = interpolate(frame, [90, 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Chart frame — local 120–150 fade in.
  const chartFrameOpacity = interpolate(frame, [120, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Story So Far card — local 390–450.
  const storySpring = spring({
    frame: frame - 390,
    fps,
    config: springConfig,
  });
  const storyOpacity = interpolate(frame, [390, 450], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const storyTranslate = (1 - storySpring) * 20;

  // Cross-fade to outro — local 480–510.
  const fadeOutOpacity = interpolate(frame, [480, 510], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bg,
        fontFamily: fontUi,
        color: textWhite,
        padding: "100px 64px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 920,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 36,
        }}
      >
        {/* Header */}
        <div
          style={{
            opacity: headerOpacity,
            transform: `translateY(${headerTranslate}px)`,
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div style={{ fontSize: 28, color: textMuted }}>← Back</div>
          <div style={{ fontSize: 48, fontWeight: 900 }}>{MEMBER_NAME}</div>
        </div>

        {/* Hero card */}
        <div
          style={{
            opacity: heroOpacity,
            transform: `translateY(${heroTranslate}px)`,
            backgroundColor: surface,
            border: `1px solid ${border}`,
            borderRadius: 24,
            padding: 32,
            display: "flex",
            alignItems: "center",
            gap: 32,
          }}
        >
          {/* Score circle */}
          <div
            style={{
              width: 144,
              height: 144,
              borderRadius: "50%",
              border: `3px solid ${scoreColor(LATEST_SCORE)}`,
              boxShadow: `0 0 48px ${scoreColor(LATEST_SCORE)}66`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 72,
                fontWeight: 900,
                color: scoreColor(LATEST_SCORE),
              }}
            >
              {LATEST_SCORE}
            </span>
          </div>

          {/* Trend + meta */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 40, fontWeight: 900, color: trendUp }}>↑</span>
              <span style={{ fontSize: 24, color: textLabel }}>
                Avg{" "}
                <span style={{ color: textWhite, fontWeight: 700 }}>
                  {AVG_SCORE.toFixed(1)}
                </span>
              </span>
            </div>
            <div style={{ fontSize: 24, color: textMuted }}>
              {scoreZoneLabel(LATEST_SCORE)}
            </div>
            <div style={{ fontSize: 20, color: textFaint }}>
              {CHECKIN_COUNT} check-ins
            </div>
          </div>

          {/* Log score pill */}
          <div
            style={{
              padding: "14px 20px",
              backgroundColor: textWhite,
              color: "#000",
              fontSize: 20,
              fontWeight: 700,
              borderRadius: 16,
              flexShrink: 0,
            }}
          >
            Log score
          </div>
        </div>

        {/* Range pills */}
        <div
          style={{
            opacity: rangeOpacity,
            display: "flex",
            gap: 8,
            backgroundColor: surface,
            border: `1px solid ${border}`,
            borderRadius: 16,
            padding: 8,
          }}
        >
          {RANGES.map((r) => (
            <div
              key={r.label}
              style={{
                flex: 1,
                padding: "16px 0",
                fontSize: 22,
                fontWeight: 600,
                textAlign: "center",
                borderRadius: 10,
                backgroundColor: r.highlighted ? textWhite : "transparent",
                color: r.highlighted ? "#000" : textMuted,
              }}
            >
              {r.label}
            </div>
          ))}
        </div>

        {/* Chart card */}
        <div
          style={{
            opacity: chartFrameOpacity,
            backgroundColor: surface,
            border: `1px solid ${border}`,
            borderRadius: 24,
            padding: 32,
          }}
        >
          <TrendChart localFrame={frame} />
        </div>

        {/* Story So Far */}
        <div
          style={{
            opacity: storyOpacity,
            transform: `translateY(${storyTranslate}px)`,
            backgroundColor: surface,
            border: `1px solid ${border}`,
            borderLeft: `4px solid ${scoreColor(LATEST_SCORE)}`,
            borderRadius: 18,
            padding: "24px 28px",
            fontSize: 26,
            fontStyle: "italic",
            color: textLabel,
            lineHeight: 1.4,
          }}
        >
          In the last 12 weeks, Maya has averaged {AVG_SCORE.toFixed(1)} —
          currently in the {scoreZoneLabel(LATEST_SCORE)} zone.{" "}
          {CHECKIN_COUNT} check-ins total. Lowest score was a 4 on Mar 23.
        </div>
      </div>

      {/* Cross-fade to Scene 5 */}
      <AbsoluteFill
        style={{
          backgroundColor: "#000",
          opacity: fadeOutOpacity,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
