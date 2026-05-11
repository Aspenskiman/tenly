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
import { fontInter, springConfig, textWhite } from "../theme";

// Load Inter weights used across narrative scenes.
const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
});

export const IntroLogo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo: spring scale 0.6 -> 1, opacity 0 -> 1, starts f 6.
  const logoSpring = spring({ frame: frame - 6, fps, config: springConfig });
  const logoScale = 0.6 + logoSpring * 0.4;
  const logoOpacity = interpolate(frame, [6, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Text "Every manager asks" — fade in f 45–75.
  const askOpacity = interpolate(frame, [45, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Quoted "How are you doing?" — fade in f 90–115.
  const quoteOpacity = interpolate(frame, [90, 115], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "Fine." — fade in f 130–160, slightly larger and bolder.
  const fineOpacity = interpolate(frame, [130, 160], [0, 1], {
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
          gap: 56,
        }}
      >
        <Img
          src={staticFile("tenlyiconapp.svg")}
          style={{
            width: 280,
            height: 280,
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
          }}
        />

        <div
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: 28,
          }}
        >
          <div
            style={{ fontSize: 56, fontWeight: 400, opacity: askOpacity }}
          >
            Every manager asks
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 600,
              opacity: quoteOpacity,
            }}
          >
            "How are you doing?"
          </div>
          <div
            style={{ fontSize: 96, fontWeight: 700, opacity: fineOpacity }}
          >
            "Fine."
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
