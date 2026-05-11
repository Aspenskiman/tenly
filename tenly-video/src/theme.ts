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
