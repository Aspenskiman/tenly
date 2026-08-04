const SCORE_RAMP: Record<number, string> = {
  1: '#7058CE',
  2: '#7A64D2',
  3: '#8571D6',
  4: '#907DD9',
  5: '#9A89DD',
  6: '#A596E0',
  7: '#B0A2E4',
  8: '#BAAFE8',
  9: '#C5BBEB',
  10: '#D0C8EF',
};

function clampScore(score: number): number {
  return Math.min(10, Math.max(1, Math.round(score)));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function scoreColor(score: number): string {
  return SCORE_RAMP[clampScore(score)];
}

export function scoreTextColor(score: number): string {
  return clampScore(score) <= 5 ? '#FFFFFF' : '#0D0D1A';
}

export function scoreColorBg(score: number): string {
  const { r, g, b } = hexToRgb(scoreColor(score));
  return `rgba(${r},${g},${b},0.15)`;
}

export function scoreGlow(score: number): string {
  const { r, g, b } = hexToRgb(scoreColor(score));
  return `rgba(${r},${g},${b},0.35)`;
}

export function trendColor(trend: 'up' | 'down' | 'stable'): string {
  if (trend === 'up') return '#A78BFA';
  if (trend === 'down') return '#F97316';
  return 'rgba(180,180,255,0.55)';
}

export function trendArrow(trend: 'up' | 'down' | 'stable'): string {
  if (trend === 'up') return '↑';
  if (trend === 'down') return '↓';
  return '→';
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateLong(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
