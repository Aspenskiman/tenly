# Tenly 60s Product Demo Video — Design Spec

**Date:** 2026-05-11
**Author:** brainstormed with user
**Implementation path:** `tenly-video/` (existing scaffolded Remotion project)
**Frontend reference path:** `client/src/` (NOT `frontend/src` — that path does not exist)

## Purpose

A 60-second vertical (1080×1920, 30fps) social-format product demo for Tenly, an employee engagement app. The narrative pivots from a cliché — managers asking "how are you doing" and getting "fine" — to the product's reframe: log a numeric score, see real trends, surface who needs attention. The video must feel native to the actual app it markets, so all in-product scenes recreate the live UI with the live design tokens.

## Source-of-truth decisions

These were resolved during brainstorming because the brief contradicted the live code:

| Topic | Decision | Reason |
|---|---|---|
| Color palette | **Match live app**, not the stated brief | The brief named #4F46E5/#0F172A but the app uses #13132A bg and `#818CF8` / `rgba(124,111,247,*)` violet. Fidelity to the live product wins. |
| Font | **Inter for narrative scenes (1, 2, 5); app default sans for UI scenes (3, 4)** | Inter isn't loaded in the app, so UI screens use what users actually see. Narrative text gets Inter for crispness. |
| Trend line data | **Hand-tuned narrative arc** | Visual story beats matter more than real seed data for a 17s scene. |
| Demo screen layout | **Full-bleed UI, no phone-frame chrome** | Phone frames shrink the UI and feel dated. 1080×1920 already reads as mobile. |
| Scene 1 length | **6s (not 8s)** | The extra 2s goes to Scene 4 where the trend animation needs room to breathe. |

## Design tokens (extracted from `client/src/lib/scores.ts` and `client/src/pages/*.tsx`)

To live in `tenly-video/src/theme.ts`:

```ts
export const bg = '#13132A';
export const surface = '#13132A';
export const border = 'rgba(124,111,247,0.15)';
export const borderStrong = 'rgba(124,111,247,0.2)';
export const textMuted = 'rgba(180,180,255,0.35)';
export const textLabel = 'rgba(180,180,255,0.5)';
export const textFaint = 'rgba(180,180,255,0.25)';

export const accentViolet = '#818CF8';   // score >= 7 / trend up
export const accentYellow = '#FFF200';   // score 4..6
export const accentOrange = '#F97316';   // score < 4 / Lean In / trend down
export const trendUp = '#A78BFA';

export function scoreColor(n: number) {
  if (n >= 7) return accentViolet;
  if (n >= 4) return accentYellow;
  return accentOrange;
}

export const spring = { damping: 200, stiffness: 100, mass: 0.5 };
```

## Composition

- **ID:** `TenlyDemo`
- **Dimensions:** 1080 × 1920
- **fps:** 30
- **Total frames:** 1800 (60s)
- **Registered in:** `tenly-video/src/Root.tsx`. The existing `HelloWorld` composition stays registered so the scaffolded code still lints; it is not the target.

## Scene structure

Top-level `TenlyDemo` component composes five `<Sequence>` blocks. Each scene component lives at `tenly-video/src/scenes/<Name>.tsx`. Frame numbers are absolute (relative to the composition).

### Scene 1 — `IntroLogo.tsx` (0–180, 0–6s)

Black background (`#000`).

- **f 6–24:** Tenly icon SVG (the existing `client/public/tenlyiconapp.svg`, copied to `tenly-video/public/`) springs in: scale `0.6 → 1`, opacity `0 → 1`. Centered, ~280px square.
- **f 45–75:** Text appears below logo, Inter weight 400, white: *Every manager asks*.
- **f 90–115:** Quoted line below in Inter weight 600: *"How are you doing?"*.
- **f 130–160:** New line, Inter weight 700, slightly larger: *"Fine."*.
- **f 165–180:** Hold.

### Scene 2 — `WrongQuestion.tsx` (180–390, 6–13s)

Black background.

- **f 180–195:** Prior text fades to 30% opacity in place; "Fine." remains 100%.
- **f 210–240:** New line beneath fades in, Inter weight 500: *It's not the wrong answer.*
- **f 270–300:** Another line, Inter weight 700: *It's the wrong question.* The word **question** gets a violet underline that draws left-to-right between f 300–330 (strokeDashoffset interpolation on an underline SVG).
- **f 360–390:** Cross-fade entire scene to `#13132A` (Scene 3's bg). Implemented as a top-level absolute-fill overlay that interpolates `0 → 1` opacity.

### Scene 3 — `LogScoreScene.tsx` (390–990, 13–33s)

Background `#13132A`. Full-bleed phone-shaped layout. Mirrors `client/src/pages/LogScore.tsx` markup and classes.

- **f 390–420:** Header springs in: "Log a Score" (text-xl font-black white), sub "After every 1:1. One number. Real signal." (textFaint).
- **f 420–450:** Member selector pill appears, pre-populated with "Maya Chen".
- **f 450–480:** "How is Maya's whole life this week?" label fades in.
- **f 480–540:** Score grid (5 cols × 2 rows, 1–10). Buttons spring in row-by-row, **stagger 3 frames per button** (10 buttons × 3 = 30 frames). Each button has the actual app styling: `bg-[#13132A]`, `border-[rgba(124,111,247,0.15)]`, rounded-xl, text muted.
- **f 600–650:** A subtle cursor/finger glyph (small white circle, ~24px, slight outer glow) animates from screen-center to the "7" button along a Bézier path.
- **f 650–680:** "7" button springs to selected state: scale 1.05, `backgroundColor: #818CF8`, text black. Cursor fades.
- **f 700–760:** Nudge card slides up from below (`translateY: 24 → 0`, opacity `0 → 1`). Card uses real styling: `bg-#1F1F23`, `border #27272C`, `borderLeft 3px solid #818CF8` (suggestion accent for score 7), italic zinc-300 text: *"What's been working well for you lately?"*
- **f 780–820:** Zone label "Sweet Spot" and teaching line "Doing well doesn't mean nothing to explore. Ask what's working." fade in (textFaint).
- **f 820–990:** Hold; subtle scale breathing on the "7" button (1.05 ↔ 1.06, sine wave). At f 960–990: cross-fade to Scene 4.

### Scene 4 — `DashboardScene.tsx` (990–1500, 33–50s) — *gets the extra 2s*

Background `#13132A`. Mirrors `client/src/pages/MemberDashboard.tsx`.

- **f 990–1020:** Header "Maya Chen" with back arrow springs in.
- **f 1020–1080:** Hero card springs in: 80px circle with score "7" in violet with 32px blur glow, ↑ trend arrow in `#A78BFA`, "Avg 6.4", "Sweet Spot", "13 check-ins", "Log score" white pill on the right.
- **f 1080–1110:** Range toggle pills (4w/8w/**12w**/16w) — 12w highlighted with `bg-white text-black`.
- **f 1110–1140:** Empty chart card fades in (`bg-#13132A`, border, rounded-2xl, 180px tall).
- **f 1140–1380:** **Trend line draws progressively** across 13 weekly points: `[6, 7, 6, 5, 4, 4, 5, 6, 7, 7, 8, 7, 8]`. Implemented with an SVG `<path>` and `strokeDashoffset` interpolated from `pathLength → 0`. Dots appear at each x as the path reaches them (one dot pops in per ~18 frames). Y-axis labels (1, 3, 5, 7, 9) and grid lines in `#27272C` render statically from f 1110.
- **f 1260–1290:** Pause point. The dot at index 4 (value 4, orange) gets a thin annotation chip *"Hard week"* with a tiny line connecting to the dot. Annotation fades in over 30 frames.
- **f 1290–1380:** Line continues drawing through the recovery to the final 8. Annotation chip lingers, then fades at f 1380.
- **f 1380–1440:** "Story So Far" card slides in below chart: *"In the last 12 weeks, Maya has averaged 6.4 — currently in the Sweet Spot zone. 13 check-ins total. Lowest score was a 4 on Mar 23."* with violet left border (4px).
- **f 1440–1500:** Hold, then cross-fade to black.

### Scene 5 — `OutroScene.tsx` (1500–1800, 50–60s)

Black background.

- **f 1500–1530:** Tenly icon springs in centered (scale 0.6 → 1).
- **f 1560–1600:** *Stop asking how they're doing.* Inter weight 500, white.
- **f 1620–1660:** *Start knowing.* Inter weight 800, violet `#818CF8` — larger.
- **f 1690–1730:** `tenly.app` in `textMuted`, beneath, weight 400.
- **f 1730–1800:** Hold steady through end.

## Trend line data (Scene 4)

13 weekly points spanning ~91 days (12 weeks + buffer): `[6, 7, 6, 5, 4, 4, 5, 6, 7, 7, 8, 7, 8]`. Index 4 (value 4) is the "Hard week" annotation anchor. Dates are computed by walking backward from a fixed "today" of 2026-05-11 in weekly intervals (Monday-aligned to match the app's `isoWeekStartDays` logic).

## Files to create

```
tenly-video/
  src/
    theme.ts                          (NEW — design tokens)
    TenlyDemo.tsx                     (NEW — top-level composition)
    scenes/
      IntroLogo.tsx                   (NEW)
      WrongQuestion.tsx               (NEW)
      LogScoreScene.tsx               (NEW)
      DashboardScene.tsx              (NEW)
      OutroScene.tsx                  (NEW)
    Root.tsx                          (EDIT — register TenlyDemo)
  public/
    tenlyiconapp.svg                  (COPY from client/public/)
```

`HelloWorld/` and its registration stay untouched.

## Dependencies to add

- `@remotion/google-fonts` — for `loadFont` of Inter (weights 400, 500, 600, 700, 800).

No new runtime dependencies beyond that. The trend line uses native SVG, not Chart.js (the app uses Chart.js via CDN, but in Remotion we render an SVG path with `strokeDashoffset` for clean frame-accurate drawing).

## Implementation order (suggested)

1. Scaffold `theme.ts`, copy logo asset, register `TenlyDemo` in `Root.tsx`, set up Inter font loading.
2. Scene 1 + Scene 2 (text-only, simplest — validates Inter loading and spring config).
3. Scene 5 (also mostly text; closes the loop on the visual language).
4. Scene 3 (Log Score) — the most layout-heavy.
5. Scene 4 (Dashboard) — most animation-heavy; the SVG trend draw is the hardest single piece.
6. Open Studio (`npx remotion studio` from `tenly-video/`), iterate on timing/easing.

## Out of scope

- Audio / voiceover (not requested).
- Captions (not requested).
- Render to MP4 (the brief says "open Remotion Studio so I can preview" — render-to-file is a future step).
- Localization.
- A `MainDigest` / "Lean In" outro scene (the user's Scene 5 spec is the outro text card, not the digest screen — even though the brief mentioned "Lean In / Lean Out digest" earlier, the explicit Scene 5 description is the outro CTA).
