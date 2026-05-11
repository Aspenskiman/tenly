import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  accentViolet,
  bg,
  border,
  cardBg,
  cardBorder,
  fontUi,
  scoreColor,
  springConfig,
  textFaint,
  textLabel,
  textMuted,
  textWhite,
} from "../theme";

const MEMBER_NAME = "Maya Chen";
const SELECTED_SCORE = 7;
const NUDGE_TEXT = "What's been working well for you lately?";
const NOTE_TEXT =
  "Strong week — project launch landed. Wants more ownership next quarter.";

export const LogScoreScene: React.FC = () => {
  const frame = useCurrentFrame(); // local 0..599
  const { fps } = useVideoConfig();

  // Header — local 0–30.
  const headerSpring = spring({ frame, fps, config: springConfig });
  const headerOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headerTranslate = (1 - headerSpring) * -20;

  // Member pill — local 30–60.
  const memberOpacity = interpolate(frame, [30, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Question label — local 60–90.
  const labelOpacity = interpolate(frame, [60, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Grid buttons — spring in row by row, stagger 3 frames per button (local 90–150).
  const buttons = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Cursor glide — local 210–260. Travels from screen center to "7" button.
  const cursorProgress = interpolate(frame, [210, 260], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => t * t * (3 - 2 * t), // smoothstep
  });

  // "7" selected state — local 260–290.
  const selectedProgress = spring({
    frame: frame - 260,
    fps,
    config: springConfig,
  });

  // Cursor fade out — local 280–310.
  const cursorOpacity = interpolate(frame, [200, 240, 280, 310], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Nudge card — local 310–370. Slides up + fades in.
  const nudgeSpring = spring({
    frame: frame - 310,
    fps,
    config: springConfig,
  });
  const nudgeOpacity = interpolate(frame, [310, 370], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const nudgeTranslateY = (1 - nudgeSpring) * 24;

  // Zone label + teaching line — local 390–430.
  const zoneOpacity = interpolate(frame, [390, 430], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Notes field — label + empty textarea fade in local 440–470.
  const notesFieldOpacity = interpolate(frame, [440, 470], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Typewriter — characters revealed local 470–560.
  const typedCount = Math.round(
    interpolate(frame, [470, 560], [0, NOTE_TEXT.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const typedText = NOTE_TEXT.slice(0, typedCount);
  // Blinking cursor caret — show while typing, blink after.
  const cursorVisible =
    frame < 560 ? true : Math.floor((frame - 560) / 15) % 2 === 0;

  // Breathing animation on selected button — local 430–600. 1.05 ↔ 1.06 sine.
  const breathe =
    frame >= 430
      ? 1.05 + 0.01 * Math.sin(((frame - 430) / 60) * Math.PI)
      : 1;

  // Cross-fade to next scene — local 570–600.
  const fadeOutOpacity = interpolate(frame, [570, 600], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bg,
        fontFamily: fontUi,
        color: textWhite,
        padding: "120px 80px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 56,
        }}
      >
        {/* Header */}
        <div
          style={{
            opacity: headerOpacity,
            transform: `translateY(${headerTranslate}px)`,
          }}
        >
          <div style={{ fontSize: 56, fontWeight: 900, color: textWhite }}>
            Log a Score
          </div>
          <div
            style={{
              fontSize: 28,
              color: textFaint,
              marginTop: 12,
            }}
          >
            After every 1:1. One number. Real signal.
          </div>
        </div>

        {/* Member pill */}
        <div style={{ opacity: memberOpacity }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: textLabel,
              textTransform: "uppercase",
              letterSpacing: 2,
              marginBottom: 12,
            }}
          >
            Team member
          </div>
          <div
            style={{
              padding: "24px 28px",
              backgroundColor: cardBg,
              border: `1px solid ${border}`,
              borderRadius: 18,
              fontSize: 32,
              color: textWhite,
              fontWeight: 500,
            }}
          >
            {MEMBER_NAME}
          </div>
        </div>

        {/* Question label */}
        <div
          style={{
            opacity: labelOpacity,
            fontSize: 22,
            fontWeight: 600,
            color: textLabel,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          How is Maya's whole life this week?
        </div>

        {/* Score grid 5x2 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 18,
            position: "relative",
          }}
        >
          {buttons.map((n, i) => {
            const btnDelay = i * 3 + 90;
            const btnSpring = spring({
              frame: frame - btnDelay,
              fps,
              config: springConfig,
            });
            const btnOpacity = interpolate(
              frame,
              [btnDelay, btnDelay + 15],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );
            const btnScaleEntrance = 0.85 + btnSpring * 0.15;

            const isSelected = n === SELECTED_SCORE;
            const selectedScale = isSelected ? breathe : 1;
            const selectedBg =
              isSelected && selectedProgress > 0
                ? scoreColor(SELECTED_SCORE)
                : cardBg;
            const selectedColor =
              isSelected && selectedProgress > 0.5 ? "#000" : textLabel;
            const selectedBorder =
              isSelected && selectedProgress > 0
                ? scoreColor(SELECTED_SCORE)
                : border;

            const selectedPop = isSelected
              ? 1 + selectedProgress * 0.05
              : 1;

            return (
              <div
                key={n}
                style={{
                  height: 140,
                  borderRadius: 18,
                  border: `2px solid ${selectedBorder}`,
                  backgroundColor: selectedBg,
                  color: selectedColor,
                  fontSize: 56,
                  fontWeight: 900,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: btnOpacity,
                  transform: `scale(${btnScaleEntrance * selectedScale * selectedPop})`,
                }}
              >
                {n}
              </div>
            );
          })}

          {/* Cursor glyph */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 48,
              height: 48,
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.95)",
              boxShadow: "0 0 24px rgba(255,255,255,0.6)",
              opacity: cursorOpacity,
              transform: `translate(${interpolate(
                cursorProgress,
                [0, 1],
                [360, 180],
              )}px, ${interpolate(cursorProgress, [0, 1], [-200, 220])}px)`,
            }}
          />
        </div>

        {/* Nudge card — appears after "7" tap */}
        <div
          style={{
            opacity: nudgeOpacity,
            transform: `translateY(${nudgeTranslateY}px)`,
            backgroundColor: cardBg,
            border: `1px solid ${cardBorder}`,
            borderLeft: `3px solid ${accentViolet}`,
            borderRadius: 12,
            padding: "24px 28px",
          }}
        >
          <div
            style={{
              fontSize: 30,
              fontStyle: "italic",
              color: "#d4d4d8",
              lineHeight: 1.4,
            }}
          >
            {NUDGE_TEXT}
          </div>
        </div>

        {/* Zone label + teaching line */}
        <div
          style={{
            opacity: zoneOpacity,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 22, color: textMuted }}>Sweet Spot</div>
          <div style={{ fontSize: 22, color: textMuted }}>
            Doing well doesn't mean nothing to explore. Ask what's working.
          </div>
        </div>

        {/* Notes field — typewriter */}
        <div style={{ opacity: notesFieldOpacity }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: textLabel,
              textTransform: "uppercase",
              letterSpacing: 2,
              marginBottom: 12,
            }}
          >
            What do you want to remember from this conversation?
          </div>
          <div
            style={{
              padding: "22px 24px",
              backgroundColor: cardBg,
              border: `1px solid ${border}`,
              borderRadius: 18,
              minHeight: 140,
              fontSize: 28,
              color: textWhite,
              lineHeight: 1.45,
            }}
          >
            {typedText}
            <span
              style={{
                opacity: cursorVisible ? 1 : 0,
                color: accentViolet,
                marginLeft: 2,
              }}
            >
              |
            </span>
          </div>
        </div>
      </div>

      {/* Cross-fade to Scene 4 */}
      <AbsoluteFill
        style={{
          backgroundColor: bg,
          opacity: fadeOutOpacity,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
