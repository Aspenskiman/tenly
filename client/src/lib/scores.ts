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

export function getScoreColor(score: number): string {
  if (score >= 6) return '#22C55E';
  if (score >= 4) return '#F59E0B';
  return '#EF4444';
}

export function getScoreTextColor(score: number): string {
  if (score >= 6) return 'text-green-400';
  if (score >= 4) return 'text-amber-400';
  return 'text-red-400';
}

export function getScoreBorder(score: number): string {
  if (score >= 6) return 'border-green-500';
  if (score >= 4) return 'border-amber-500';
  return 'border-red-500';
}

export function getTrendArrow(trend: string): string {
  if (trend === 'up') return '↑';
  if (trend === 'down') return '↓';
  if (trend === 'stable') return '→';
  return '–';
}

export function getTrendColor(trend: string): string {
  if (trend === 'up') return 'text-green-400';
  if (trend === 'down') return 'text-red-400';
  return 'text-zinc-500';
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatDateLong(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
