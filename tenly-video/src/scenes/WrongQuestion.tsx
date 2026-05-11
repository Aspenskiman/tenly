import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";
import { accentViolet, bg, fontInter, textWhite } from "../theme";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
});

export const WrongQuestion: React.FC = () => {
  // Local frame: 0..209 maps to absolute 180..389.
  const frame = useCurrentFrame();

  // Echo of prior text — fades from 100% to 30% over local 0–15.
  const echoOpacity = interpolate(frame, [0, 15], [1, 0.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "It's not the wrong answer." — fade in local 30–60.
  const answerOpacity = interpolate(frame, [30, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "It's the wrong question." — fade in local 90–120.
  const questionOpacity = interpolate(frame, [90, 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Underline draws under the word "question" — local 120–150.
  const underlineLength = 400;
  const underlineDraw = interpolate(
    frame,
    [120, 150],
    [underlineLength, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Cross-fade to Scene 3 bg — local 180–210.
  const fadeToNext = interpolate(frame, [180, 210], [0, 1], {
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
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: 40,
          maxWidth: 920,
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            opacity: echoOpacity,
          }}
        >
          "Fine."
        </div>

        <div
          style={{
            fontSize: 52,
            fontWeight: 500,
            opacity: answerOpacity,
          }}
        >
          It's not the wrong answer.
        </div>

        <div
          style={{
            fontSize: 60,
            fontWeight: 700,
            opacity: questionOpacity,
            position: "relative",
          }}
        >
          It's the wrong{" "}
          <span style={{ position: "relative", whiteSpace: "nowrap" }}>
            question
            <svg
              width={underlineLength}
              height={12}
              style={{
                position: "absolute",
                left: 0,
                bottom: -10,
              }}
            >
              <line
                x1={0}
                y1={6}
                x2={underlineLength}
                y2={6}
                stroke={accentViolet}
                strokeWidth={6}
                strokeLinecap="round"
                strokeDasharray={underlineLength}
                strokeDashoffset={underlineDraw}
              />
            </svg>
          </span>
          .
        </div>
      </div>

      {/* Cross-fade overlay to Scene 3 bg */}
      <AbsoluteFill
        style={{
          backgroundColor: bg,
          opacity: fadeToNext,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
