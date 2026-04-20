export function scoreColor(score: number): string {
  if (score >= 7) return '#818CF8';
  if (score >= 4) return '#FFF200';
  return '#F97316';
}

export function scoreColorBg(score: number): string {
  if (score >= 7) return 'rgba(129,140,248,0.15)';
  if (score >= 4) return 'rgba(255,242,0,0.12)';
  return 'rgba(249,115,22,0.15)';
}

export function scoreGlow(score: number): string {
  if (score >= 7) return 'rgba(129,140,248,0.35)';
  if (score >= 4) return 'rgba(255,242,0,0.3)';
  return 'rgba(249,115,22,0.35)';
}

export function scoreZoneLabel(score: number): string {
  if (score >= 9) return 'Thriving';
  if (score >= 7) return 'Sweet Spot';
  if (score >= 4) return 'Holding';
  return 'Needs Support';
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
