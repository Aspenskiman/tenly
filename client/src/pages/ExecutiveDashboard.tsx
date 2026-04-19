import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, ResponsiveContainer, Area, AreaChart } from 'recharts';
import Layout from '../components/Layout';
import { getCompanyData } from '../api/teams';
import { getScoreColor, getScoreTextColor, getZoneLabel } from '../lib/scores';

interface Entry {
  score: number;
  interaction_date: string;
  notes: string | null;
}

interface Member {
  id: string;
  name: string;
  entries: Entry[];
}

interface Team {
  id: string;
  name: string;
  manager?: { id: string; name: string };
  members: Member[];
}

function teamAvg(team: Team): number | null {
  const scores = team.members.flatMap(m => m.entries.map(e => e.score));
  if (!scores.length) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function companyAvgCalc(teams: Team[]): number | null {
  const scores = teams.flatMap(t => t.members.flatMap(m => m.entries.map(e => e.score)));
  if (!scores.length) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function calcTrend(entries: Entry[]): 'up' | 'down' | 'stable' {
  if (entries.length < 4) return 'stable';
  const sorted = [...entries].sort((a, b) =>
    new Date(a.interaction_date).getTime() - new Date(b.interaction_date).getTime()
  );
  const half = Math.floor(sorted.length / 2);
  const first = sorted.slice(0, half).reduce((s, e) => s + e.score, 0) / half;
  const last = sorted.slice(half).reduce((s, e) => s + e.score, 0) / (sorted.length - half);
  const delta = last - first;
  if (delta <= -0.5) return 'down';
  if (delta >= 0.5) return 'up';
  return 'stable';
}

function getWeeklySparkline(entries: Entry[]) {
  const weeks: number[][] = Array.from({ length: 8 }, () => []);
  const now = Date.now();
  entries.forEach(e => {
    const daysAgo = Math.floor((now - new Date(e.interaction_date).getTime()) / 86400000);
    const weekIndex = Math.min(7, Math.floor(daysAgo / 7));
    weeks[7 - weekIndex].push(e.score);
  });
  return weeks
    .map(w => ({ s: w.length ? w.reduce((a, b) => a + b, 0) / w.length : null }))
    .filter(w => w.s !== null);
}

function ScoreBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct = (value / max) * 100;
  const color = getScoreColor(value);
  return (
    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.7 }}
      />
    </div>
  );
}

function TeamRow({ team, rank }: { team: Team; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const avg = teamAvg(team);
  const allEntries = team.members.flatMap(m => m.entries);
  const trend = calcTrend(allEntries);
  const sparkline = getWeeklySparkline(allEntries);
  const color = avg ? getScoreColor(avg) : '#3f3f46';

  const trendSymbol = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '—';
  const trendColor = trend === 'up' ? '#22C55E' : trend === 'down' ? '#F97316' : '#52525b';

  return (
    <div
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      className="last:border-0"
    >
      <div
        className="flex items-center gap-5 px-6 py-4 cursor-pointer transition-all duration-150"
        style={{ background: expanded ? 'rgba(255,255,255,0.03)' : 'transparent' }}
        onMouseEnter={e => { if (!expanded) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
        onMouseLeave={e => { if (!expanded) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        onClick={() => setExpanded(v => !v)}
      >
        {/* Rank */}
        <span
          className="text-xs font-mono w-4 text-right shrink-0"
          style={{ color: 'rgba(255,255,255,0.15)' }}
        >
          {rank}
        </span>

        {/* Team name + manager */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white/90 truncate tracking-tight">{team.name}</p>
          {team.manager && (
            <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {team.manager.name}
            </p>
          )}
        </div>

        {/* Sparkline */}
        <div className="w-16 h-7 shrink-0 opacity-60">
          {sparkline.length >= 2 && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkline}>
                <defs>
                  <linearGradient id={`sg-${team.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="s"
                  stroke={color}
                  strokeWidth={1.5}
                  fill={`url(#sg-${team.id})`}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Score */}
        <div className="flex items-baseline gap-1.5 shrink-0 w-16 justify-end">
          <span
            className="text-xl font-black tabular-nums"
            style={{ color, letterSpacing: '-0.02em' }}
          >
            {avg !== null ? avg.toFixed(1) : '—'}
          </span>
          <span className="text-xs font-bold" style={{ color: trendColor }}>
            {trendSymbol}
          </span>
        </div>

        {/* Chevron */}
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {/* Score bar under row */}
      {avg !== null && (
        <div className="px-6 pb-1">
          <ScoreBar value={avg} />
        </div>
      )}

      {/* Expanded member list */}
      {expanded && (
        <div
          className="mx-6 mb-4 mt-2 rounded-xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {team.members
            .map(m => {
              const scores = m.entries.map(e => e.score);
              const a = scores.length ? scores.reduce((x, y) => x + y, 0) / scores.length : null;
              return { ...m, avg: a };
            })
            .sort((a, b) => (a.avg ?? 10) - (b.avg ?? 10))
            .map((m, i, arr) => (
              <div
                key={m.id}
                className="flex items-center justify-between px-4 py-2.5"
                style={{
                  borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
                  >
                    {m.name.charAt(0)}
                  </div>
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{m.name}</span>
                </div>
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{ color: m.avg !== null ? getScoreColor(m.avg) : '#52525b' }}
                >
                  {m.avg !== null ? m.avg.toFixed(1) : '—'}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default function ExecutiveDashboard() {
  const [days, setDays] = useState(30);

  const { data: rawTeams, isLoading } = useQuery({
    queryKey: ['company-data', days],
    queryFn: () => getCompanyData(days),
  });

  const teams = (rawTeams ?? []) as unknown as Team[];
  const avg = companyAvgCalc(teams);
  const totalMembers = teams.flatMap(t => t.members).length;

  const sortedTeams = [...teams].sort((a, b) => (teamAvg(a) ?? 10) - (teamAvg(b) ?? 10));

  const periodLabel = days === 7 ? 'Last 7 days' : days === 30 ? 'Last 30 days' : 'Last 90 days';

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-3 mt-6 max-w-lg mx-auto">
          {[80, 48, 48, 48].map((h, i) => (
            <div key={i} className="animate-pulse rounded-2xl" style={{ height: h, background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto pb-20 pt-2">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1
              className="text-base font-semibold tracking-tight"
              style={{ color: 'rgba(255,255,255,0.9)' }}
            >
              Company Overview
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {periodLabel} · {totalMembers} members · {teams.length} teams
            </p>
          </div>

          {/* Period toggle */}
          <div
            className="flex gap-0.5 p-0.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {[7, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className="text-xs font-medium px-3 py-1.5 rounded-md transition-all duration-150"
                style={{
                  background: days === d ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: days === d ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)',
                }}
              >
                {d === 7 ? '7d' : d === 30 ? '30d' : '90d'}
              </button>
            ))}
          </div>
        </div>

        {/* Company score hero */}
        <div
          className="rounded-2xl p-6 mb-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {/* Subtle glow behind score */}
          {avg && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse 60% 80% at 50% 60%, ${getScoreColor(avg)}12 0%, transparent 70%)`,
              }}
            />
          )}

          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em' }}
          >
            Employee Engagement Score
          </p>

          <div className="flex items-end justify-between">
            <div>
              <div
                className="font-black tabular-nums leading-none"
                style={{
                  fontSize: 80,
                  color: avg ? getScoreColor(avg) : 'rgba(255,255,255,0.15)',
                  letterSpacing: '-0.04em',
                  textShadow: avg ? `0 0 80px ${getScoreColor(avg)}30` : undefined,
                }}
              >
                {avg !== null ? avg.toFixed(1) : '—'}
              </div>
              <p
                className="text-sm font-medium mt-1"
                style={{ color: avg ? getScoreColor(avg) : 'rgba(255,255,255,0.2)', opacity: 0.8 }}
              >
                {avg !== null ? getZoneLabel(Math.round(avg)) : 'No data'}
              </p>
            </div>

            <div className="text-right pb-1">
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>out of</p>
              <p
                className="text-4xl font-black"
                style={{ color: 'rgba(255,255,255,0.12)', letterSpacing: '-0.04em' }}
              >
                10
              </p>
            </div>
          </div>
        </div>

        {/* Team table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* Table header */}
          <div
            className="flex items-center gap-5 px-6 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span className="w-4" />
            <span className="flex-1 text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>
              Team
            </span>
            <span className="w-16 text-xs font-semibold uppercase tracking-widest text-right" style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>
              8wk
            </span>
            <span className="w-16 text-xs font-semibold uppercase tracking-widest text-right" style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>
              Score
            </span>
            <span className="w-3" />
          </div>

          {sortedTeams.length === 0 && (
            <p className="text-center py-12 text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>
              No data for this period.
            </p>
          )}

          {sortedTeams.map((team, i) => (
            <TeamRow key={team.id} team={team} rank={i + 1} />
          ))}
        </div>

        <p
          className="text-center text-xs mt-4"
          style={{ color: 'rgba(255,255,255,0.15)' }}
        >
          Teams sorted lowest first — attention goes where it's needed
        </p>

      </div>
    </Layout>
  );
}
