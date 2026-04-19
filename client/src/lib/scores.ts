export type Zone = 'thriving' | 'sweet' | 'watch' | 'drifting' | 'crisis';

export function getZone(score: number): Zone {
  if (score >= 9) return 'thriving';
  if (score >= 6) return 'sweet';
  if (score >= 4) return 'watch';
  if (score >= 2) return 'drifting';
  return 'crisis';
}

export function getZoneLabel(score: number): string {
  const zone = getZone(score);
  return { thriving: 'Thriving', sweet: 'Sweet Spot', watch: 'Watch', drifting: 'Drifting', crisis: 'Crisis' }[zone];
}

// Purple-indigo palette — thriving=violet, sweet=indigo, watch=amber, low=orange
export function getScoreColor(score: number): string {
  if (score >= 9) return '#A78BFA'; // violet-400 — thriving
  if (score >= 6) return '#818CF8'; // indigo-400 — sweet spot
  if (score >= 4) return '#C4B5FD'; // violet-300 — watch (lighter, softer)
  return '#F97316';                  // orange — drifting/crisis
}

export function getScoreTextColor(score: number): string {
  if (score >= 9) return 'text-violet-400';
  if (score >= 6) return 'text-indigo-400';
  if (score >= 4) return 'text-violet-300';
  return 'text-orange-400';
}

export function getScoreBorder(score: number): string {
  if (score >= 9) return 'border-violet-400';
  if (score >= 6) return 'border-indigo-400';
  if (score >= 4) return 'border-violet-300';
  return 'border-orange-500';
}

export function getTrendArrow(trend: string): string {
  if (trend === 'up') return '↑';
  if (trend === 'down') return '↓';
  if (trend === 'stable') return '→';
  return '–';
}

export function getTrendColor(trend: string): string {
  if (trend === 'up') return 'text-violet-400';
  if (trend === 'down') return 'text-orange-400';
  return 'text-zinc-500';
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateLong(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
