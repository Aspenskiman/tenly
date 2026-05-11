import {
  AbsoluteFill,
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

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
        fontFamily: fontFamily ?? fontInter,
        color: textWhite,
        alignItems: "center",
        justifyContent: "center",
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
          Stop asking how they're doing.
        </div>

        <div
          style={{
            fontSize: 84,
            fontWeight: 800,
            opacity: startOpacity,
            color: accentViolet,
          }}
        >
          Start knowing.
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
          tenly.app
        </div>
      </div>
    </AbsoluteFill>
  );
};
