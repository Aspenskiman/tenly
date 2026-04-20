import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import Layout from '../components/Layout';
import { getCompanyData } from '../api/teams';
import { scoreColor, scoreZoneLabel } from '../lib/scores';

interface Entry { score: number; interaction_date: string; notes: string | null; }
interface Member { id: string; name: string; entries: Entry[]; }
interface Team { id: string; name: string; manager?: { id: string; name: string }; members: Member[]; }

const P = {
  bg:       '#0D0D1A',
  surface:  '#13132A',
  card:     '#1A1A35',
  cardHov:  '#1F1F3E',
  accent:   '#7C6FF7',
  accentLt: '#A78BFA',
  border:   'rgba(124,111,247,0.15)',
  borderHov:'rgba(124,111,247,0.3)',
  text:     'rgba(255,255,255,0.92)',
  textMid:  'rgba(180,180,255,0.55)',
  textMute: 'rgba(180,180,255,0.3)',
  orange:   '#F97316',
};

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
  const sorted = [...entries].sort((a, b) => new Date(a.interaction_date).getTime() - new Date(b.interaction_date).getTime());
  const half = Math.floor(sorted.length / 2);
  const first = sorted.slice(0, half).reduce((s, e) => s + e.score, 0) / half;
  const last = sorted.slice(half).reduce((s, e) => s + e.score, 0) / (sorted.length - half);
  const delta = last - first;
  if (delta <= -0.5) return 'down';
  if (delta >= 0.5) return 'up';
  return 'stable';
}
function getWeeklySparkline(entries: Entry[], numWeeks = 10) {
  const weeks: number[][] = Array.from({ length: numWeeks }, () => []);
  const now = Date.now();
  entries.forEach(e => {
    const daysAgo = Math.floor((now - new Date(e.interaction_date).getTime()) / 86400000);
    const weekIndex = Math.min(numWeeks - 1, Math.floor(daysAgo / 7));
    weeks[numWeeks - 1 - weekIndex].push(e.score);
  });
  return weeks.map((w, i) => ({
    week: `W${i + 1}`,
    s: w.length ? +(w.reduce((a, b) => a + b, 0) / w.length).toFixed(2) : null
  })).filter(w => w.s !== null);
}

function StatCard({ label, value, sub, valueColor }: { label: string; value: string; sub?: string; valueColor?: string }) {
  return (
    <div style={{
      background: P.card,
      border: `1px solid ${P.border}`,
      borderRadius: 16,
      padding: '20px 22px',
      flex: 1,
      minWidth: 0,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${P.accent}80, transparent)` }} />
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.textMute, marginBottom: 10 }}>{label}</p>
      <p style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.04em', color: valueColor || P.text, lineHeight: 1, fontFamily: "'DM Sans', sans-serif" }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: P.textMute, marginTop: 6 }}>{sub}</p>}
    </div>
  );
}

function TeamCard({ team, rank }: { team: Team; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const avg = teamAvg(team);
  const allEntries = team.members.flatMap(m => m.entries);
  const trend = calcTrend(allEntries);
  const sparkline = getWeeklySparkline(allEntries, 8);
  const teamColor = avg ? scoreColor(avg) : P.accent;

  const trendLabel = trend === 'up' ? '↑ Rising' : trend === 'down' ? '↓ Falling' : '→ Stable';
  const trendColor = trend === 'up' ? P.accentLt : trend === 'down' ? P.orange : P.textMute;

  const membersSorted = [...team.members]
    .map(m => {
      const scores = m.entries.map(e => e.score);
      return { ...m, avg: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null };
    })
    .sort((a, b) => (a.avg ?? 10) - (b.avg ?? 10));

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? P.cardHov : P.card,
        border: `1px solid ${hovered ? P.borderHov : P.border}`,
        borderRadius: 20,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease',
        boxShadow: hovered ? `0 8px 32px rgba(124,111,247,0.1)` : 'none',
      }}
    >
      {/* Top score accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${teamColor}, ${teamColor}40)` }} />

      {/* Card header */}
      <div style={{ padding: '16px 18px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                color: P.accent, background: `${P.accent}18`,
                border: `1px solid ${P.accent}30`,
                padding: '2px 7px', borderRadius: 4,
              }}>#{rank}</span>
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: P.text, letterSpacing: '-0.01em' }}>{team.name}</p>
            {team.manager && <p style={{ fontSize: 11, color: P.textMute, marginTop: 2 }}>{team.manager.name}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{
              fontSize: 36, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1,
              color: teamColor,
              fontFamily: "'DM Sans', sans-serif",
              textShadow: `0 0 30px ${teamColor}50`,
            }}>
              {avg !== null ? avg.toFixed(1) : '—'}
            </p>
            <p style={{ fontSize: 10, color: trendColor, fontWeight: 600, marginTop: 4 }}>{trendLabel}</p>
          </div>
        </div>
        <p style={{ fontSize: 11, color: P.textMute, marginTop: 8 }}>
          {team.members.length} member{team.members.length !== 1 ? 's' : ''} · {scoreZoneLabel(Math.round(avg ?? 5))}
        </p>
      </div>

      {/* Sparkline fills bottom */}
      <div style={{ height: 90, marginTop: 'auto' }}>
        {sparkline.length >= 2 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkline} margin={{ top: 5, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`cg-${team.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={teamColor} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={teamColor} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <YAxis domain={[0, 10]} hide />
              <Area type="monotone" dataKey="s" stroke={teamColor} strokeWidth={2} fill={`url(#cg-${team.id})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: '100%', background: `linear-gradient(to top, ${teamColor}08, transparent)` }} />
        )}
      </div>

      {/* Expand */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          background: 'rgba(124,111,247,0.06)',
          border: 'none',
          borderTop: `1px solid ${P.border}`,
          color: P.textMute,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '9px 18px',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'inherit',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = P.accentLt)}
        onMouseLeave={e => (e.currentTarget.style.color = P.textMute)}
      >
        <span>View Members</span>
        <span>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div style={{ borderTop: `1px solid ${P.border}` }}>
          {membersSorted.map((m, i, arr) => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 18px',
              borderBottom: i < arr.length - 1 ? `1px solid rgba(124,111,247,0.08)` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: m.avg ? `${scoreColor(m.avg)}18` : 'rgba(124,111,247,0.08)',
                  border: `1px solid ${m.avg ? `${scoreColor(m.avg)}35` : P.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  color: m.avg ? scoreColor(m.avg) : P.textMute,
                }}>
                  {m.name.charAt(0)}
                </div>
                <span style={{ fontSize: 13, color: P.textMid }}>{m.name}</span>
              </div>
              <span style={{
                fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em',
                color: m.avg ? scoreColor(m.avg) : P.textMute,
                fontFamily: "'DM Sans', sans-serif",
              }}>
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const { data: rawTeams, isLoading } = useQuery({
    queryKey: ['company-data', days],
    queryFn: () => getCompanyData(days),
  });

  const teams = (rawTeams ?? []) as unknown as Team[];
  const avg = companyAvgCalc(teams);
  const totalMembers = teams.flatMap(t => t.members).length;
  const allEntries = teams.flatMap(t => t.members.flatMap(m => m.entries));
  const companySparkline = getWeeklySparkline(allEntries, 12);
  const companyColor = avg ? scoreColor(avg) : P.accent;
  const needsAttention = teams.filter(t => {
    const a = teamAvg(t);
    return (a !== null && a < 6) || calcTrend(t.members.flatMap(m => m.entries)) === 'down';
  }).length;

  const sortedTeams = [...teams].sort((a, b) => (teamAvg(a) ?? 10) - (teamAvg(b) ?? 10));
  const periodLabel = days === 7 ? 'Last 7 days' : days === 30 ? 'Last 30 days' : 'Last 90 days';

  const fadeIn = (delay: number): React.CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(14px)',
    transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
  });

  if (isLoading) {
    return (
      <Layout>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 14 }}>
            {[1,2,3,4].map(i => <div key={i} style={{ height: 100, borderRadius: 16, background: P.card }} />)}
          </div>
          <div style={{ height: 200, borderRadius: 20, background: P.card, marginBottom: 14 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 240, borderRadius: 20, background: P.card }} />)}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,900&display=swap');`}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 0 60px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, ...fadeIn(0) }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: P.text, letterSpacing: '-0.02em', margin: 0 }}>Company Overview</h1>
            <p style={{ fontSize: 12, color: P.textMute, marginTop: 4 }}>{periodLabel} · {totalMembers} members · {teams.length} teams</p>
          </div>
          <div style={{
            display: 'flex', gap: 2, padding: 3,
            background: P.card, border: `1px solid ${P.border}`, borderRadius: 10,
          }}>
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)} style={{
                background: days === d ? `${P.accent}25` : 'transparent',
                border: days === d ? `1px solid ${P.accent}40` : '1px solid transparent',
                borderRadius: 7,
                color: days === d ? P.accentLt : P.textMute,
                fontSize: 12, fontWeight: 700,
                padding: '5px 14px', cursor: 'pointer',
                transition: 'all 0.15s', fontFamily: 'inherit',
              }}>
                {d === 7 ? '7d' : d === 30 ? '30d' : '90d'}
              </button>
            ))}
          </div>
        </div>

        {/* Stat strip */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 14, ...fadeIn(80) }}>
          <StatCard label="Engagement Score" value={avg !== null ? avg.toFixed(1) : '—'} sub={avg !== null ? scoreZoneLabel(Math.round(avg)) : undefined} valueColor={companyColor} />
          <StatCard label="Total Members" value={String(totalMembers)} sub={`${teams.length} teams`} />
          <StatCard label="Period" value={days === 7 ? '7d' : days === 30 ? '30d' : '90d'} sub={periodLabel} />
          <StatCard label="Needs Attention" value={String(needsAttention)} sub={needsAttention === 0 ? 'All teams stable' : 'teams trending down'} valueColor={needsAttention > 0 ? P.orange : undefined} />
        </div>

        {/* Company trend chart */}
        <div style={{
          background: P.card, border: `1px solid ${P.border}`,
          borderRadius: 20, padding: '20px 24px 0', marginBottom: 14,
          position: 'relative', overflow: 'hidden',
          ...fadeIn(160),
        }}>
          {/* Subtle mesh gradient */}
          <div style={{
            position: 'absolute', top: 0, right: 0, width: 300, height: 300, pointerEvents: 'none',
            background: `radial-gradient(ellipse at 100% 0%, ${P.accent}12 0%, transparent 70%)`,
          }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, position: 'relative' }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.textMute, margin: 0 }}>Company Trend</p>
              <p style={{ fontSize: 13, color: P.textMid, marginTop: 5 }}>Weekly engagement average across all teams</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: companyColor }} />
              <span style={{ fontSize: 11, color: P.textMute, fontWeight: 600 }}>All Teams</span>
            </div>
          </div>
          <div style={{ height: 160 }}>
            {companySparkline.length >= 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={companySparkline} margin={{ top: 10, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="companyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={companyColor} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={companyColor} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <YAxis domain={[0, 10]} hide />
                  <Tooltip
                    contentStyle={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 8, color: P.text, fontSize: 12 }}
                    formatter={(v: number) => [v.toFixed(1), 'Avg Score']}
                    labelFormatter={l => `Week ${l?.toString().replace('W', '')}`}
                  />
                  <Area type="monotone" dataKey="s" stroke={companyColor} strokeWidth={2.5} fill="url(#companyGrad)" dot={false} activeDot={{ r: 4, fill: companyColor, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <p style={{ color: P.textMute, fontSize: 13 }}>Not enough data for this period</p>
              </div>
            )}
          </div>
        </div>

        {/* Team card grid */}
        <div style={{ ...fadeIn(240) }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: P.textMute, marginBottom: 12 }}>
            Teams — Lowest First
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {sortedTeams.map((team, i) => <TeamCard key={team.id} team={team} rank={i + 1} />)}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: P.textMute, marginTop: 32 }}>
          Attention directed to lowest-performing teams first
        </p>
      </div>
    </Layout>
  );
}
