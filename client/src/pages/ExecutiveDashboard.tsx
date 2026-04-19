import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import Layout from '../components/Layout';
import { getCompanyData } from '../api/teams';
import { getScoreColor, getZoneLabel } from '../lib/scores';

interface Entry { score: number; interaction_date: string; notes: string | null; }
interface Member { id: string; name: string; entries: Entry[]; }
interface Team { id: string; name: string; manager?: { id: string; name: string }; members: Member[]; }

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

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: '20px 22px',
      flex: 1,
      minWidth: 0,
    }}>
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>{label}</p>
      <p style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em', color: accent || 'rgba(255,255,255,0.92)', lineHeight: 1, fontFamily: "'DM Sans', sans-serif" }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>{sub}</p>}
    </div>
  );
}

function TeamCard({ team, rank }: { team: Team; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const avg = teamAvg(team);
  const allEntries = team.members.flatMap(m => m.entries);
  const trend = calcTrend(allEntries);
  const sparkline = getWeeklySparkline(allEntries, 8);
  const color = avg ? getScoreColor(avg) : '#3f3f46';
  const trendLabel = trend === 'up' ? '↑ Rising' : trend === 'down' ? '↓ Falling' : '→ Stable';
  const trendColor = trend === 'up' ? '#22C55E' : trend === 'down' ? '#F97316' : 'rgba(255,255,255,0.3)';

  const membersSorted = [...team.members]
    .map(m => {
      const scores = m.entries.map(e => e.score);
      return { ...m, avg: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null };
    })
    .sort((a, b) => (a.avg ?? 10) - (b.avg ?? 10));

  return (
    <div style={{
      background: 'linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 20,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.14)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'}
    >
      {/* Card header */}
      <div style={{ padding: '18px 20px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>#{rank}</span>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.01em', marginTop: 2 }}>{team.name}</p>
            {team.manager && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{team.manager.name}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 32, fontWeight: 900, color, letterSpacing: '-0.04em', lineHeight: 1, fontFamily: "'DM Sans', sans-serif" }}>
              {avg !== null ? avg.toFixed(1) : '—'}
            </p>
            <p style={{ fontSize: 10, color: trendColor, fontWeight: 600, marginTop: 3 }}>{trendLabel}</p>
          </div>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
          {team.members.length} member{team.members.length !== 1 ? 's' : ''} · {getZoneLabel(Math.round(avg ?? 5))}
        </p>
      </div>

      {/* Area chart fills bottom of card */}
      <div style={{ height: 80, marginTop: 'auto' }}>
        {sparkline.length >= 2 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkline} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`cg-${team.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <YAxis domain={[0, 10]} hide />
              <Area type="monotone" dataKey="s" stroke={color} strokeWidth={2} fill={`url(#cg-${team.id})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: '100%', background: `linear-gradient(to top, ${color}08, transparent)` }} />
        )}
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: 'none',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.3)',
          fontSize: 11,
          fontWeight: 600,
          padding: '9px 20px',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
          letterSpacing: '0.05em',
          display: 'flex',
          justifyContent: 'space-between',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'}
      >
        <span>VIEW MEMBERS</span>
        <span>{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Member list */}
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {membersSorted.map((m, i, arr) => (
            <div key={m.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 20px',
              borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: m.avg ? `${getScoreColor(m.avg)}22` : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${m.avg ? `${getScoreColor(m.avg)}44` : 'rgba(255,255,255,0.08)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  color: m.avg ? getScoreColor(m.avg) : 'rgba(255,255,255,0.3)',
                }}>
                  {m.name.charAt(0)}
                </div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{m.name}</span>
              </div>
              <span style={{
                fontSize: 14, fontWeight: 800,
                color: m.avg ? getScoreColor(m.avg) : 'rgba(255,255,255,0.2)',
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: '-0.02em',
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

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const { data: rawTeams, isLoading } = useQuery({
    queryKey: ['company-data', days],
    queryFn: () => getCompanyData(days),
  });

  const teams = (rawTeams ?? []) as unknown as Team[];
  const avg = companyAvgCalc(teams);
  const totalMembers = teams.flatMap(t => t.members).length;
  const allEntries = teams.flatMap(t => t.members.flatMap(m => m.entries));
  const companySparkline = getWeeklySparkline(allEntries, 12);
  const companyColor = avg ? getScoreColor(avg) : '#22C55E';

  const needsAttention = teams.filter(t => {
    const a = teamAvg(t);
    const trend = calcTrend(t.members.flatMap(m => m.entries));
    return (a !== null && a < 6) || trend === 'down';
  }).length;

  const sortedTeams = [...teams].sort((a, b) => (teamAvg(a) ?? 10) - (teamAvg(b) ?? 10));
  const periodLabel = days === 7 ? 'Last 7 days' : days === 30 ? 'Last 30 days' : 'Last 90 days';

  const fadeIn = (delay: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(12px)',
    transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
  });

  if (isLoading) {
    return (
      <Layout>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            {[1,2,3,4].map(i => <div key={i} style={{ height: 100, borderRadius: 16, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />)}
          </div>
          <div style={{ height: 200, borderRadius: 20, background: 'rgba(255,255,255,0.04)', marginBottom: 16 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 220, borderRadius: 20, background: 'rgba(255,255,255,0.04)' }} />)}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 60px', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

        {/* Google Fonts */}
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&display=swap');`}</style>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, ...fadeIn(0) }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em', margin: 0 }}>
              Company Overview
            </h1>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{periodLabel} · {totalMembers} members across {teams.length} teams</p>
          </div>

          <div style={{
            display: 'flex', gap: 2, padding: 3,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
          }}>
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)} style={{
                background: days === d ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: 'none', borderRadius: 7,
                color: days === d ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                fontSize: 12, fontWeight: 700,
                padding: '6px 14px', cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: 'inherit',
              }}>
                {d === 7 ? '7d' : d === 30 ? '30d' : '90d'}
              </button>
            ))}
          </div>
        </div>

        {/* Stat strip */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, ...fadeIn(80) }}>
          <StatCard label="Engagement Score" value={avg !== null ? avg.toFixed(1) : '—'} sub={avg !== null ? getZoneLabel(Math.round(avg)) : undefined} accent={companyColor} />
          <StatCard label="Total Members" value={String(totalMembers)} sub={`across ${teams.length} teams`} />
          <StatCard label="Teams Monitored" value={String(teams.length)} sub={`${periodLabel}`} />
          <StatCard label="Needs Attention" value={String(needsAttention)} sub={needsAttention === 0 ? 'All teams steady' : 'teams trending down'} accent={needsAttention > 0 ? '#F97316' : undefined} />
        </div>

        {/* Company trend chart */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: '20px 24px 0',
          marginBottom: 16,
          ...fadeIn(160),
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                Company Trend
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Weekly engagement average across all teams</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: companyColor, opacity: 0.8 }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>All Teams</span>
            </div>
          </div>

          <div style={{ height: 160 }}>
            {companySparkline.length >= 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={companySparkline} margin={{ top: 10, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="companyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={companyColor} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={companyColor} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <YAxis domain={[0, 10]} hide />
                  <Tooltip
                    contentStyle={{
                      background: '#18181B',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [v.toFixed(1), 'Avg Score']}
                    labelFormatter={l => `Week ${l?.toString().replace('W','')}`}
                  />
                  <Area type="monotone" dataKey="s" stroke={companyColor} strokeWidth={2.5} fill="url(#companyGrad)" dot={false} activeDot={{ r: 4, fill: companyColor, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Not enough data for this period</p>
              </div>
            )}
          </div>
        </div>

        {/* Team cards grid */}
        <div style={{ ...fadeIn(240) }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 12 }}>
            Teams — Lowest First
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 12,
          }}>
            {sortedTeams.map((team, i) => (
              <TeamCard key={team.id} team={team} rank={i + 1} />
            ))}
          </div>
        </div>

      </div>
    </Layout>
  );
}
