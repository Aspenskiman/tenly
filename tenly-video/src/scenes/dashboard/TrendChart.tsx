import { interpolate } from "remotion";
import { accentOrange, scoreColor } from "../../theme";

// Hand-tuned arc: gentle climb, mid dip, recovery, ending strong.
export const TREND_DATA = [6, 7, 6, 5, 4, 4, 5, 6, 7, 7, 8, 7, 8];
export const HARD_WEEK_INDEX = 4; // value 4 — annotation anchor

// Draw window expressed in frames local to the scene (Scene 4 is 990–1500).
// Caller passes localFrame (0..510). We draw between localFrame 150 and 390
// (i.e. absolute 1140..1380).
const DRAW_START = 150;
const DRAW_END = 390;

// Annotation visibility: fades in 270–300, lingers, fades out 380–410.
const ANNOTATION_IN_START = 270;
const ANNOTATION_IN_END = 300;
const ANNOTATION_OUT_START = 380;
const ANNOTATION_OUT_END = 410;

// Chart geometry.
const WIDTH = 880;
const HEIGHT = 320;
const PAD_LEFT = 64;
const PAD_RIGHT = 32;
const PAD_TOP = 24;
const PAD_BOTTOM = 40;
const PLOT_W = WIDTH - PAD_LEFT - PAD_RIGHT;
const PLOT_H = HEIGHT - PAD_TOP - PAD_BOTTOM;

const Y_MIN = 1;
const Y_MAX = 10;

function pointXY(i: number): { x: number; y: number } {
  const x = PAD_LEFT + (i / (TREND_DATA.length - 1)) * PLOT_W;
  const score = TREND_DATA[i];
  const y =
    PAD_TOP + PLOT_H * (1 - (score - Y_MIN) / (Y_MAX - Y_MIN));
  return { x, y };
}

function buildPath(): string {
  const parts: string[] = [];
  TREND_DATA.forEach((_, i) => {
    const { x, y } = pointXY(i);
    parts.push((i === 0 ? "M" : "L") + x + "," + y);
  });
  return parts.join(" ");
}

const PATH_D = buildPath();
// Approximate path length: sum of segment lengths. Used for dash offset.
const PATH_LENGTH = (() => {
  let total = 0;
  for (let i = 1; i < TREND_DATA.length; i++) {
    const a = pointXY(i - 1);
    const b = pointXY(i);
    total += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return total;
})();

// Final score determines line color (same logic the app uses on the dashboard).
const LINE_COLOR = scoreColor(TREND_DATA[TREND_DATA.length - 1]);

export const TrendChart: React.FC<{ readonly localFrame: number }> = ({
  localFrame,
}) => {
  // Stroke dash offset from full length down to 0 across DRAW_START..DRAW_END.
  const offset = interpolate(
    localFrame,
    [DRAW_START, DRAW_END],
    [PATH_LENGTH, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Dot visibility: dot i appears when its x-fraction has been drawn.
  function dotOpacity(i: number): number {
    const fractionToReach =
      i === 0 ? 0 : i / (TREND_DATA.length - 1);
    const dotFrame =
      DRAW_START + fractionToReach * (DRAW_END - DRAW_START);
    return interpolate(
      localFrame,
      [dotFrame - 4, dotFrame + 8],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
  }

  // Annotation opacity for "Hard week".
  const annotationOpacity = interpolate(
    localFrame,
    [
      ANNOTATION_IN_START,
      ANNOTATION_IN_END,
      ANNOTATION_OUT_START,
      ANNOTATION_OUT_END,
    ],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const hardWeekPt = pointXY(HARD_WEEK_INDEX);

  return (
    <svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      style={{ overflow: "visible" }}
    >
      {/* Y grid lines + labels at 1, 3, 5, 7, 9 */}
      {[1, 3, 5, 7, 9].map((v) => {
        const y = PAD_TOP + PLOT_H * (1 - (v - Y_MIN) / (Y_MAX - Y_MIN));
        return (
          <g key={v}>
            <line
              x1={PAD_LEFT}
              y1={y}
              x2={WIDTH - PAD_RIGHT}
              y2={y}
              stroke="#27272C"
              strokeWidth={1}
            />
            <text
              x={PAD_LEFT - 16}
              y={y + 6}
              fill="#71717a"
              fontSize={16}
              textAnchor="end"
            >
              {v}
            </text>
          </g>
        );
      })}

      {/* Trend line — drawn via strokeDashoffset */}
      <path
        d={PATH_D}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={PATH_LENGTH}
        strokeDashoffset={offset}
      />

      {/* Dots */}
      {TREND_DATA.map((score, i) => {
        const { x, y } = pointXY(i);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={7}
            fill={scoreColor(score)}
            stroke="#13132A"
            strokeWidth={2}
            opacity={dotOpacity(i)}
          />
        );
      })}

      {/* "Hard week" annotation */}
      <g opacity={annotationOpacity}>
        <line
          x1={hardWeekPt.x}
          y1={hardWeekPt.y + 14}
          x2={hardWeekPt.x}
          y2={hardWeekPt.y + 56}
          stroke={accentOrange}
          strokeWidth={1.5}
        />
        <rect
          x={hardWeekPt.x - 70}
          y={hardWeekPt.y + 56}
          width={140}
          height={36}
          rx={8}
          fill="#1F1F23"
          stroke={accentOrange}
          strokeWidth={1.5}
        />
        <text
          x={hardWeekPt.x}
          y={hardWeekPt.y + 79}
          fill="#FFFFFF"
          fontSize={18}
          fontWeight={600}
          textAnchor="middle"
        >
          Hard week
        </text>
      </g>
    </svg>
  );
};
