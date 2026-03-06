interface Entry {
  score: number;
  interaction_date: Date;
}

export interface TrendResult {
  memberId: string;
  recentAvg: number | null;
  previousAvg: number | null;
  trend: 'up' | 'down' | 'stable' | 'insufficient_data';
  delta: number | null;
}

/**
 * Compares the last N days vs the prior N days to determine trend direction.
 */
export function calculateTrend(
  memberId: string,
  entries: Entry[],
  windowDays = 14
): TrendResult {
  const now = new Date();
  const cutRecent = new Date(now);
  cutRecent.setDate(cutRecent.getDate() - windowDays);
  const cutPrev = new Date(now);
  cutPrev.setDate(cutPrev.getDate() - windowDays * 2);

  const recent = entries.filter(
    (e) => new Date(e.interaction_date) >= cutRecent
  );
  const previous = entries.filter(
    (e) =>
      new Date(e.interaction_date) >= cutPrev &&
      new Date(e.interaction_date) < cutRecent
  );

  const avg = (arr: Entry[]) =>
    arr.length ? arr.reduce((s, e) => s + e.score, 0) / arr.length : null;

  const recentAvg = avg(recent);
  const previousAvg = avg(previous);

  if (recentAvg === null || previousAvg === null) {
    return { memberId, recentAvg, previousAvg, trend: 'insufficient_data', delta: null };
  }

  const delta = recentAvg - previousAvg;
  let trend: TrendResult['trend'];
  if (delta <= -0.5) trend = 'down';
  else if (delta >= 0.5) trend = 'up';
  else trend = 'stable';

  return { memberId, recentAvg, previousAvg, trend, delta };
}
