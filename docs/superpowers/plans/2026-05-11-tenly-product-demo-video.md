# Tenly 60s Product Demo Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 60-second vertical (1080×1920, 30fps) Remotion composition that demos Tenly across 5 scenes, matching the live app's design tokens.

**Architecture:** Single top-level composition `TenlyDemo` registered in `tenly-video/src/Root.tsx`. Each scene is its own component under `src/scenes/`, mounted via `<Sequence>` with absolute frame ranges. Shared design tokens live in `src/theme.ts`. The complex SVG trend chart in Scene 4 is split into its own subcomponent.

**Tech Stack:** Remotion 4.0.459 (already installed), React 19, TypeScript, Tailwind v4 (already configured via `@remotion/tailwind-v4`), `@remotion/google-fonts` (to be added) for Inter.

**Spec reference:** `docs/superpowers/specs/2026-05-11-tenly-product-demo-video-design.md`

---

## File Structure

```
tenly-video/
  public/
    tenlyiconapp.svg                  (NEW — copied from client/public/)
  src/
    theme.ts                          (NEW)
    TenlyDemo.tsx                     (NEW — top-level composition)
    scenes/
      IntroLogo.tsx                   (NEW)
      WrongQuestion.tsx               (NEW)
      LogScoreScene.tsx               (NEW)
      DashboardScene.tsx              (NEW)
      OutroScene.tsx                  (NEW)
      dashboard/
        TrendChart.tsx                (NEW — Scene 4 SVG chart)
    Root.tsx                          (MODIFY — register TenlyDemo)
  package.json                        (MODIFY — add @remotion/google-fonts)
```

`HelloWorld/` and the existing `HelloWorld` + `OnlyLogo` compositions stay untouched.

---

## Task 1: Project setup (deps + asset)

**Files:**
- Modify: `tenly-video/package.json`
- Create: `tenly-video/public/tenlyiconapp.svg` (copy)

- [ ] **Step 1: Install Google Fonts package**

From `tenly-video/`:

```bash
cd tenly-video
npm install @remotion/google-fonts@4.0.459
```

Expected: package added to `dependencies`, no peer warnings.

- [ ] **Step 2: Copy the Tenly logo asset**

From repo root:

```bash
cp client/public/tenlyiconapp.svg tenly-video/public/tenlyiconapp.svg
```

Expected: file exists at `tenly-video/public/tenlyiconapp.svg`. Verify with `ls tenly-video/public/`.

- [ ] **Step 3: Lint check**

```bash
cd tenly-video
npm run lint
```

Expected: PASS (no changes to TS yet — just dep install).

- [ ] **Step 4: Commit**

```bash
git add tenly-video/package.json tenly-video/package-lock.json tenly-video/public/tenlyiconapp.svg
git commit -m "chore(video): add Inter font dep and copy Tenly logo asset"
```

---

## Task 2: Design tokens (`theme.ts`)

**Files:**
- Create: `tenly-video/src/theme.ts`

- [ ] **Step 1: Write `theme.ts`**

Full contents of `tenly-video/src/theme.ts`:

```ts
// Design tokens extracted from client/src/pages/*.tsx and client/src/lib/scores.ts.
// Keep in sync with the live app — if scoreColor() changes there, mirror it here.

export const bg = "#13132A";
export const surface = "#13132A";
export const border = "rgba(124,111,247,0.15)";
export const borderStrong = "rgba(124,111,247,0.2)";

export const textWhite = "#FFFFFF";
export const textMuted = "rgba(180,180,255,0.35)";
export const textLabel = "rgba(180,180,255,0.5)";
export const textFaint = "rgba(180,180,255,0.25)";

export const accentViolet = "#818CF8";
export const accentYellow = "#FFF200";
export const accentOrange = "#F97316";
export const trendUp = "#A78BFA";

export const cardBg = "#1F1F23";
export const cardBorder = "#27272C";

export function scoreColor(n: number): string {
  if (n >= 7) return accentViolet;
  if (n >= 4) return accentYellow;
  return accentOrange;
}

export function scoreZoneLabel(n: number): string {
  if (n >= 9) return "Thriving";
  if (n >= 7) return "Sweet Spot";
  if (n >= 4) return "Holding";
  return "Needs Support";
}

// Use everywhere a spring() entrance is needed.
export const springConfig = { damping: 200, stiffness: 100, mass: 0.5 };

// Common font stacks.
// Narrative scenes (1, 2, 5) use Inter (loaded via @remotion/google-fonts/Inter).
// UI scenes (3, 4) use the app's default sans stack.
export const fontInter =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
export const fontUi =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
```

- [ ] **Step 2: Lint check**

```bash
cd tenly-video
npm run lint
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tenly-video/src/theme.ts
git commit -m "feat(video): add shared design tokens for Tenly demo"
```

---

## Task 3: Top-level `TenlyDemo` composition + register in Root

**Files:**
- Create: `tenly-video/src/TenlyDemo.tsx`
- Modify: `tenly-video/src/Root.tsx`

- [ ] **Step 1: Create placeholder `TenlyDemo.tsx`**

Full contents of `tenly-video/src/TenlyDemo.tsx` — placeholders for each scene to be filled by later tasks. Each placeholder fills its absolute fill in solid bg + a debug label so we can verify the sequencing/registration before the scenes are real:

```tsx
import { AbsoluteFill, Sequence } from "remotion";
import { bg } from "./theme";

const Placeholder: React.FC<{ readonly label: string; readonly color: string }> = ({
  label,
  color,
}) => (
  <AbsoluteFill
    style={{
      backgroundColor: color,
      color: "white",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 48,
      fontFamily: "sans-serif",
    }}
  >
    {label}
  </AbsoluteFill>
);

export const TenlyDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <Sequence from={0} durationInFrames={180} layout="none">
        <Placeholder label="Scene 1 — IntroLogo (0–6s)" color="#000" />
      </Sequence>
      <Sequence from={180} durationInFrames={210} layout="none">
        <Placeholder label="Scene 2 — WrongQuestion (6–13s)" color="#111" />
      </Sequence>
      <Sequence from={390} durationInFrames={600} layout="none">
        <Placeholder label="Scene 3 — LogScore (13–33s)" color={bg} />
      </Sequence>
      <Sequence from={990} durationInFrames={510} layout="none">
        <Placeholder label="Scene 4 — Dashboard (33–50s)" color={bg} />
      </Sequence>
      <Sequence from={1500} durationInFrames={300} layout="none">
        <Placeholder label="Scene 5 — Outro (50–60s)" color="#000" />
      </Sequence>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Register `TenlyDemo` in `Root.tsx`**

Replace the contents of `tenly-video/src/Root.tsx` with:

```tsx
import "./index.css";
import { Composition } from "remotion";
import { HelloWorld, myCompSchema } from "./HelloWorld";
import { Logo, myCompSchema2 } from "./HelloWorld/Logo";
import { TenlyDemo } from "./TenlyDemo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TenlyDemo"
        component={TenlyDemo}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
      />

      <Composition
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        schema={myCompSchema}
        defaultProps={{
          titleText: "Welcome to Remotion",
          titleColor: "#000000",
          logoColor1: "#91EAE4",
          logoColor2: "#86A8E7",
        }}
      />

      <Composition
        id="OnlyLogo"
        component={Logo}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        schema={myCompSchema2}
        defaultProps={{
          logoColor1: "#91dAE2" as const,
          logoColor2: "#86A8E7" as const,
        }}
      />
    </>
  );
};
```

- [ ] **Step 3: Lint check**

```bash
cd tenly-video
npm run lint
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add tenly-video/src/TenlyDemo.tsx tenly-video/src/Root.tsx
git commit -m "feat(video): scaffold TenlyDemo composition with scene placeholders"
```

---

## Task 4: Scene 1 — `IntroLogo.tsx` (0–6s)

**Files:**
- Create: `tenly-video/src/scenes/IntroLogo.tsx`
- Modify: `tenly-video/src/TenlyDemo.tsx`

- [ ] **Step 1: Create `IntroLogo.tsx`**

Full contents of `tenly-video/src/scenes/IntroLogo.tsx`:

```tsx
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
            “How are you doing?”
          </div>
          <div
            style={{ fontSize: 96, fontWeight: 700, opacity: fineOpacity }}
          >
            “Fine.”
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Wire `IntroLogo` into `TenlyDemo.tsx`**

In `tenly-video/src/TenlyDemo.tsx`, replace the Scene 1 placeholder. Change:

```tsx
      <Sequence from={0} durationInFrames={180} layout="none">
        <Placeholder label="Scene 1 — IntroLogo (0–6s)" color="#000" />
      </Sequence>
```

to:

```tsx
      <Sequence from={0} durationInFrames={180} layout="none">
        <IntroLogo />
      </Sequence>
```

And add at the top of the file (with the other imports):

```tsx
import { IntroLogo } from "./scenes/IntroLogo";
```

- [ ] **Step 3: Lint check**

```bash
cd tenly-video
npm run lint
```

Expected: PASS.

- [ ] **Step 4: Visual sanity check (optional)**

```bash
cd tenly-video
npx remotion still TenlyDemo --scale=0.25 --frame=150 out/intro.jpg
```

Expected: image file rendered at `tenly-video/out/intro.jpg` showing logo + all three text lines on black bg. Note: at frame 150 all three text lines should be visible. Skip if not needed.

- [ ] **Step 5: Commit**

```bash
git add tenly-video/src/scenes/IntroLogo.tsx tenly-video/src/TenlyDemo.tsx
git commit -m "feat(video): implement Scene 1 — IntroLogo with Inter narrative text"
```

---

## Task 5: Scene 2 — `WrongQuestion.tsx` (6–13s)

**Files:**
- Create: `tenly-video/src/scenes/WrongQuestion.tsx`
- Modify: `tenly-video/src/TenlyDemo.tsx`

Note: This scene's frame numbers are RELATIVE to its `<Sequence from={180}>`, so internally frames 0–210 here map to absolute 180–390. Inside the component, `useCurrentFrame()` returns 0–209.

- [ ] **Step 1: Create `WrongQuestion.tsx`**

Full contents of `tenly-video/src/scenes/WrongQuestion.tsx`:

```tsx
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
  // (Scene 1's final "Fine." is logically continuous; we redraw it here
  // since each Sequence renders its own subtree.)
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
  // strokeDashoffset interpolation on an SVG line.
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
          “Fine.”
        </div>

        <div
          style={{
            fontSize: 52,
            fontWeight: 500,
            opacity: answerOpacity,
          }}
        >
          It’s not the wrong answer.
        </div>

        <div
          style={{
            fontSize: 60,
            fontWeight: 700,
            opacity: questionOpacity,
            position: "relative",
          }}
        >
          It’s the wrong{" "}
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
```

- [ ] **Step 2: Wire `WrongQuestion` into `TenlyDemo.tsx`**

Replace the Scene 2 placeholder:

```tsx
      <Sequence from={180} durationInFrames={210} layout="none">
        <WrongQuestion />
      </Sequence>
```

And add the import:

```tsx
import { WrongQuestion } from "./scenes/WrongQuestion";
```

- [ ] **Step 3: Lint check**

```bash
cd tenly-video
npm run lint
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add tenly-video/src/scenes/WrongQuestion.tsx tenly-video/src/TenlyDemo.tsx
git commit -m "feat(video): implement Scene 2 — WrongQuestion with underline draw"
```

---

## Task 6: Scene 5 — `OutroScene.tsx` (50–60s)

Doing this before Scenes 3 and 4 because it's text-only and validates the same patterns one more time before the layout-heavy UI scenes.

**Files:**
- Create: `tenly-video/src/scenes/OutroScene.tsx`
- Modify: `tenly-video/src/TenlyDemo.tsx`

- [ ] **Step 1: Create `OutroScene.tsx`**

Full contents of `tenly-video/src/scenes/OutroScene.tsx`:

```tsx
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
          Stop asking how they’re doing.
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
```

- [ ] **Step 2: Wire `OutroScene` into `TenlyDemo.tsx`**

Replace the Scene 5 placeholder:

```tsx
      <Sequence from={1500} durationInFrames={300} layout="none">
        <OutroScene />
      </Sequence>
```

And add the import:

```tsx
import { OutroScene } from "./scenes/OutroScene";
```

- [ ] **Step 3: Lint check**

```bash
cd tenly-video
npm run lint
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add tenly-video/src/scenes/OutroScene.tsx tenly-video/src/TenlyDemo.tsx
git commit -m "feat(video): implement Scene 5 — OutroScene with CTA"
```

---

## Task 7: Scene 3 — `LogScoreScene.tsx` (13–33s)

**Files:**
- Create: `tenly-video/src/scenes/LogScoreScene.tsx`
- Modify: `tenly-video/src/TenlyDemo.tsx`

This is the most layout-heavy scene. The component mirrors `client/src/pages/LogScore.tsx`. All frame numbers below are LOCAL to the scene (Sequence starts at absolute 390).

- [ ] **Step 1: Create `LogScoreScene.tsx`**

Full contents of `tenly-video/src/scenes/LogScoreScene.tsx`:

```tsx
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
const NUDGE_TEXT = "What’s been working well for you lately?";

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
  // Buttons 1..10. Indexes 0..9. Each button delay = i * 3.
  const buttons = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Cursor glide — local 210–260. Travels from screen center to "7" button.
  // 7 is index 6 → row 1 (0-indexed) col 1. We compute approximate target below.
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
          How is Maya’s whole life this week?
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

            // Pop animation when selected hits.
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
              // Start near container center (≈ 360, 0) → land on button "7"
              // (index 6: row 1, col 1 → x = colWidth + gap, y = rowHeight + gap + half-button).
              // Using approximate coordinates; tune in Studio.
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
            Doing well doesn’t mean nothing to explore. Ask what’s working.
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
```

- [ ] **Step 2: Wire `LogScoreScene` into `TenlyDemo.tsx`**

Replace the Scene 3 placeholder:

```tsx
      <Sequence from={390} durationInFrames={600} layout="none">
        <LogScoreScene />
      </Sequence>
```

And add the import:

```tsx
import { LogScoreScene } from "./scenes/LogScoreScene";
```

- [ ] **Step 3: Lint check**

```bash
cd tenly-video
npm run lint
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add tenly-video/src/scenes/LogScoreScene.tsx tenly-video/src/TenlyDemo.tsx
git commit -m "feat(video): implement Scene 3 — LogScore with tap-7 and nudge card"
```

---

## Task 8: `TrendChart.tsx` subcomponent for Scene 4

**Files:**
- Create: `tenly-video/src/scenes/dashboard/TrendChart.tsx`

Self-contained SVG chart. Takes a frame-relative-to-its-parent (so the parent passes `frame` instead of having the chart call `useCurrentFrame`) — keeps the chart's drawing window decoupled from where the scene starts.

- [ ] **Step 1: Create `TrendChart.tsx`**

Full contents of `tenly-video/src/scenes/dashboard/TrendChart.tsx`:

```tsx
import { interpolate } from "remotion";
import { accentOrange, accentViolet, scoreColor } from "../../theme";

// Hand-tuned arc: gentle climb, mid dip, recovery, ending strong.
export const TREND_DATA = [6, 7, 6, 5, 4, 4, 5, 6, 7, 7, 8, 7, 8];
export const HARD_WEEK_INDEX = 4; // value 4 — annotation anchor

// Draw window expressed in frames *local to the scene* (Scene 4 is 990–1500).
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
```

- [ ] **Step 2: Lint check**

```bash
cd tenly-video
npm run lint
```

Expected: PASS (no consumer yet — but the file must compile).

- [ ] **Step 3: Commit**

```bash
git add tenly-video/src/scenes/dashboard/TrendChart.tsx
git commit -m "feat(video): add SVG TrendChart with draw-on animation and dip annotation"
```

---

## Task 9: Scene 4 — `DashboardScene.tsx` (33–50s)

**Files:**
- Create: `tenly-video/src/scenes/DashboardScene.tsx`
- Modify: `tenly-video/src/TenlyDemo.tsx`

- [ ] **Step 1: Create `DashboardScene.tsx`**

Full contents of `tenly-video/src/scenes/DashboardScene.tsx`:

```tsx
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
```

- [ ] **Step 2: Wire `DashboardScene` into `TenlyDemo.tsx`**

Replace the Scene 4 placeholder:

```tsx
      <Sequence from={990} durationInFrames={510} layout="none">
        <DashboardScene />
      </Sequence>
```

And add the import:

```tsx
import { DashboardScene } from "./scenes/DashboardScene";
```

- [ ] **Step 3: Lint check**

```bash
cd tenly-video
npm run lint
```

Expected: PASS.

- [ ] **Step 4: Remove the `Placeholder` helper if unused**

After all five scenes are wired, the `Placeholder` component in `TenlyDemo.tsx` is dead code. Delete the `Placeholder` function definition and verify lint still passes (the `noUnusedLocals` flag in `tsconfig.json` will catch it).

```bash
cd tenly-video
npm run lint
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tenly-video/src/scenes/DashboardScene.tsx tenly-video/src/TenlyDemo.tsx
git commit -m "feat(video): implement Scene 4 — Dashboard with animated trend chart"
```

---

## Task 10: Final pass — open Studio for preview

**Files:**
- None modified

- [ ] **Step 1: Final lint + type check**

```bash
cd tenly-video
npm run lint
```

Expected: PASS. If `noUnusedLocals` flags anything, remove the unused symbol.

- [ ] **Step 2: Start Remotion Studio**

```bash
cd tenly-video
npx remotion studio
```

Expected: Studio opens in browser at `http://localhost:3000` showing three compositions in the sidebar: `TenlyDemo` (1080×1920, 60s, 30fps), `HelloWorld`, `OnlyLogo`. Selecting `TenlyDemo` shows the timeline with the five scenes.

Hand off to user for visual review. No commit for this step — Studio is a tool, not a code change.

---

## Self-Review notes

After writing this plan, I checked:

**Spec coverage:** Every scene in the spec has a corresponding task. Design tokens task (2) covers theme.ts. Logo asset and Inter font are handled in Task 1. The "no phone-frame chrome" decision is honored — Scenes 3 and 4 use `padding` not a device frame. The "Story So Far" wording uses "12 weeks" (consistent with the fixed spec).

**Placeholder scan:** No "TBD", "TODO", or vague-handwave steps. Every code block is complete and pasteable.

**Type consistency:** `scoreColor`, `scoreZoneLabel`, `springConfig`, `bg`, `border`, `accentViolet`, etc. all defined in Task 2's `theme.ts` and consumed verbatim in Tasks 4–9. `TrendChart`'s prop is `localFrame: number` — matches the consumer in Task 9 which passes `localFrame={frame}`.

**Known risk areas calling out:**
- The cursor glyph trajectory in Scene 3 uses approximate translate values (`360 → 180` x and `-200 → 220` y). These are educated guesses against the 5×2 grid layout — likely need a small tuning pass in Studio. Acceptable trade-off vs. computing exact button centers via DOM measurement.
- `loadFont` in `@remotion/google-fonts` is called at module scope in three scenes; the package dedupes internally, so this is fine. If a lint rule trips, hoist into a single shared module.
- The `Placeholder` cleanup in Task 9 Step 4 is deliberate — `noUnusedLocals` in `tsconfig.json` will fail the build otherwise.
