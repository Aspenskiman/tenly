import {
  AbsoluteFill,
  Freeze,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import {
  accentViolet,
  fontInter,
  springConfig,
  textMuted,
  textWhite,
} from "../theme";
import { DashboardScene } from "./DashboardScene";

// Frame inside DashboardScene at which to freeze the background.
// 500 = after all content (chart, story, check-in rows) has settled
// and before any fade-out would have started.
const DASHBOARD_FREEZE_FRAME = 500;

// Dim overlay strength on top of the frozen Dashboard. 0.6 = 60% black,
// so the dashboard shows through at ~40%.
const OVERLAY_OPACITY = 0.6;

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
});

export const OutroScene: React.FC = () => {
  // Local frame 0..299 (absolute 1500..1799).
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoSpring = spring({ frame, fps, config: springConfig });
  const logoScale = 0.6 + logoSpring * 0.4;
  const logoOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const stopOpacity = interpolate(frame, [60, 100], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const startOpacity = interpolate(frame, [120, 160], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const urlOpacity = interpolate(frame, [190, 230], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Dim overlay fades in over the first 30 frames so the transition from
  // live Scene 4 to overlaid Scene 4 is smooth.
  const overlayOpacity = interpolate(
    frame,
    [0, 30],
    [0, OVERLAY_OPACITY],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        fontFamily: fontFamily ?? fontInter,
        color: textWhite,
      }}
    >
      {/* Frozen Dashboard as background */}
      <Freeze frame={DASHBOARD_FREEZE_FRAME}>
        <DashboardScene />
      </Freeze>

      {/* Dim overlay on top of Dashboard */}
      <AbsoluteFill
        style={{
          backgroundColor: "#000",
          opacity: overlayOpacity,
          pointerEvents: "none",
        }}
      />

      {/* Outro content layered above */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 48,
          textAlign: "center",
        }}
      >
        <Img
          src={staticFile("tenlyiconapp.svg")}
          style={{
            width: 220,
            height: 220,
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
          }}
        />

        <div
          style={{
            fontSize: 56,
            fontWeight: 500,
            opacity: stopOpacity,
          }}
        >
          The new question is
        </div>

        <div
          style={{
            fontSize: 84,
            fontWeight: 800,
            opacity: startOpacity,
            color: accentViolet,
          }}
        >
          What's your Tenly score?
        </div>

        <div
          style={{
            fontSize: 36,
            fontWeight: 400,
            opacity: urlOpacity,
            color: textMuted,
            marginTop: 24,
          }}
        >
          www.tenly.us
        </div>
      </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
