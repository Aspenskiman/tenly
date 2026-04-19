import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import Layout from '../components/Layout';
import { getMyTeams, getTeamSummary, MemberWithTrend } from '../api/teams';
import {
  getScoreColor, getScoreTextColor, getTrendArrow, getTrendColor,
  getZoneLabel, formatDate,
} from '../lib/scores';

const CHART_COLORS = ['#A78BFA','#34D399','#60A5FA','#F472B6','#FBBF24','#F87171','#38BDF8','#A3E635'];

type Range = '7d' | '30d' | '90d' | '12mo';
const RANGES: { label: string; value: Range; days: number }[] = [
  { label: '7d',   value: '7d',   days: 7   },
  { label: '30d',  value: '30d',  days: 30  },
  { label: '90d',  value: '90d',  days: 90  },
  { label: '12mo', value: '12mo', days: 365 },
];

function TeamTrendChart({ members, teamAvg }: { members: MemberWithTrend[]; teamAvg: number | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);
  const [hiddenIdx, setHiddenIdx] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;

    function build() {
      if (cancelled || !canvasRef.current || !members.length) return;

      const allDates = [
        ...new Set(members.flatMap(m => m.entries.map(e => e.interaction_date.slice(0, 10)))),
      ].sort();
      if (!allDates.length) return;

      const labels = allDates.map(d => {
        const [y, mo, da] = d.split('-').map(Number);
        return new Date(y, mo - 1, da).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });

      const avgData = allDates.map(date => {
        const scores = members.flatMap(m =>
          m.entries.filter(e => e.interaction_date.slice(0, 10) === date).map(e => e.score)
        );
        return scores.length ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : null;
      });

      const avgDataset = {
        label: `Team avg ${teamAvg !== null ? teamAvg.toFixed(1) : '—'}`,
        data: avgData,
        borderColor: '#FFFFFF',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        spanGaps: true,
        fill: true,
        order: 0,
      };

      const memberDatasets = members.map((m, i) => ({
        label: m.name.split(' ')[0],
        data: allDates.map(date => {
          const e = m.entries.find(en => en.interaction_date.slice(0, 10) === date);
          return e ? e.score : null;
        }),
        borderColor: CHART_COLORS[i % CHART_COLORS.length],
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 4,
        spanGaps: true,
        fill: false,
        order: i + 1,
      }));

      chartRef.current?.destroy();
      chartRef.current = null;

      const C = (window as any).Chart;
      if (!C) return;

      chartRef.current = new C(canvasRef.current, {
        type: 'line',
        data: { labels, datasets: [avgDataset, ...memberDatasets] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1A1A35',
              borderColor: 'rgba(124,111,247,0.15)',
              borderWidth: 1,
              titleColor: 'rgba(180,180,255,0.55)',
              bodyColor: '#fff',
              padding: 10,
            },
          },
          scales: {
            x: {
              border: { display: false },
              grid: { display: false },
              ticks: {
                color: 'rgba(180,180,255,0.55)',
                maxTicksLimit: 7,
                font: { size: 10 },
              },
            },
            y: {
              min: 1,
              max: 10,
              border: { display: false },
              grid: {
                color: (ctx: any) => {
                  const v = ctx.tick?.value;
                  return (v === 3 || v === 6 || v === 9) ? '#2A2A2F' : '#1F1F23';
                },
              },
              ticks: {
                stepSize: 1,
                color: 'rgba(180,180,255,0.55)',
                font: { size: 10 },
                callback: (v: any) => Number.isInteger(+v) ? v : '',
              },
            },
          },
        },
      });
    }

    if ((window as any).Chart) {
      build();
    } else if (!document.querySelector('script[data-chartjs]')) {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js';
      s.setAttribute('data-chartjs', '');
      s.onload = build;
      document.head.appendChild(s);
    } else {
      document.querySelector('script[data-chartjs]')!.addEventListener('load', build, { once: true });
    }

    return () => {
      cancelled = true;
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [members, teamAvg]);

  function toggleDataset(idx: number) {
    if (!chartRef.current) return;
    const meta = chartRef.current.getDatasetMeta(idx);
    meta.hidden = !meta.hidden;
    chartRef.current.update();
    setHiddenIdx(prev => {
      const next = new Set(prev);
      meta.hidden ? next.add(idx) : next.delete(idx);
      return next;
    });
  }

  const legendItems = [
    { label: `Team avg ${teamAvg !== null ? teamAvg.toFixed(1) : '—'}`, color: '#FFFFFF', isAvg: true },
    ...members.map((m, i) => ({
      label: m.name.split(' ')[0],
      color: CHART_COLORS[i % CHART_COLORS.length],
      isAvg: false,
    })),
  ];

  if (!members.length) return null;

  return (
    <div style={{ backgroundColor: '#111113', borderRadius: 12, border: `1px solid ${theme.border}` }}>
      <div style={{ height: 200, padding: '16px 12px 8px 4px' }}>
        <canvas ref={canvasRef} />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 px-4 pb-4">
        {legendItems.map((item, i) => (
          <button
            key={i}
            onClick={() => toggleDataset(i)}
            className="flex items-center gap-1.5 text-xs transition-opacity"
            style={{ opacity: hiddenIdx.has(i) ? 0.3 : 1, color: 'rgba(180,180,255,0.55)' }}
          >
            {item.isAvg ? (
              <span style={{ display: 'inline-block', width: 14, height: 2.5, backgroundColor: item.color, borderRadius: 2, flexShrink: 0 }} />
            ) : (
              <span style={{ display: 'inline-block', width: 7, height: 7, backgroundColor: item.color, borderRadius: '50%', flexShrink: 0 }} />
            )}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function MemberRow({ member }: { member: MemberWithTrend }) {
  const navigate = useNavigate();
  const lastScore = member.lastEntry?.score ?? null;
  const prevScore = member.entries.length >= 2
    ? member.entries[member.entries.length - 2].score
    : null;

  return (
    <div
      className="flex items-center gap-3 py-3 px-4 border-b border-[rgba(124,111,247,0.15)] last:border-0 cursor-pointer hover:bg-[#1A1A35]/40 transition"
      onClick={() => navigate(`/members/${member.id}`)}
    >
      <div className="w-8 h-8 rounded-full bg-[#1A1A35] flex items-center justify-center text-xs font-bold text-[rgba(180,180,255,0.5)] shrink-0">
        {member.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{member.name}</p>
        <p className="text-xs text-[rgba(180,180,255,0.25)]">
          {member.lastEntry ? formatDate(member.lastEntry.interaction_date) : 'No entries'}
        </p>
      </div>

      {/* Last 2 scores */}
      <div className="flex items-center gap-1.5 shrink-0">
        {prevScore !== null && (
          <span className={`text-sm font-bold opacity-45 ${getScoreTextColor(prevScore)}`}>{prevScore}</span>
        )}
        {lastScore !== null && (
          <span className={`text-base font-black ${getScoreTextColor(lastScore)}`}>{lastScore}</span>
        )}
        {!lastScore && <span className="text-[rgba(180,180,255,0.25)] text-sm">—</span>}
        <span className={`text-sm font-bold ml-1 ${getTrendColor(member.trend)}`}>
          {getTrendArrow(member.trend)}
        </span>
      </div>

      {/* Sparkline */}
      <div className="w-16 h-8 shrink-0">
        {member.entries.length >= 2 && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={member.entries.slice(-8).map(e => ({ s: e.score }))}>
              <Line
                type="monotone"
                dataKey="s"
                stroke={lastScore ? getScoreColor(lastScore) : '#52525b'}
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default function TeamDashboard() {
  const navigate = useNavigate();
  const [range, setRange] = useState<Range>('30d');
  const rangeObj = RANGES.find(r => r.value === range)!;

  const { data: teams, isLoading } = useQuery({ queryKey: ['teams'], queryFn: getMyTeams });
  const teamId = teams?.[0]?.id;

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['team-summary', teamId, rangeObj.days],
    queryFn: () => getTeamSummary(teamId!, rangeObj.days),
    enabled: !!teamId,
  });

  const members = summary?.members ?? [];

  const leanIn = members.filter(m => m.trend === 'down' || (m.recentAvg !== null && m.recentAvg < 5));
  const leanOut = members.filter(m => m.trend === 'up' || (m.recentAvg !== null && m.recentAvg >= 7));
  const stable = members.filter(m =>
    !leanIn.find(x => x.id === m.id) && !leanOut.find(x => x.id === m.id)
  );

  const teamAvg = members.length && members.some(m => m.recentAvg !== null)
    ? members.filter(m => m.recentAvg !== null).reduce((s, m) => s + m.recentAvg!, 0) /
      members.filter(m => m.recentAvg !== null).length
    : null;

  if (isLoading || summaryLoading) {
    return (
      <Layout>
        <div className="space-y-4 mt-4">
          <div className="h-32 bg-[#1A1A35]/50 rounded-2xl animate-pulse" />
          <div className="h-48 bg-[#1A1A35]/50 rounded-2xl animate-pulse" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto space-y-5 pb-20">
        {/* Team avg hero */}
        <div className="bg-[#13132A] border border-[rgba(124,111,247,0.15)] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[rgba(180,180,255,0.35)] uppercase tracking-wider">Team Average</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className="font-black leading-none"
                  style={{
                    fontSize: 64,
                    color: teamAvg ? getScoreColor(teamAvg) : '#52525b',
                    textShadow: teamAvg ? `0 0 40px ${getScoreColor(teamAvg)}50` : undefined,
                  }}
                >
                  {teamAvg !== null ? teamAvg.toFixed(1) : '—'}
                </span>
              </div>
              {teamAvg && (
                <p className="text-xs text-[rgba(180,180,255,0.35)] mt-0.5">{getZoneLabel(Math.round(teamAvg))}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-[rgba(180,180,255,0.25)]">{members.length} members</p>
              <button
                onClick={() => navigate('/roster')}
                className="mt-2 text-xs text-[rgba(180,180,255,0.35)] hover:text-white border border-[rgba(124,111,247,0.2)] px-2 py-1 rounded-lg transition"
              >
                Roster →
              </button>
            </div>
          </div>
        </div>

        {/* Trend chart */}
        {members.length > 0 && (
          <div className="space-y-2">
            {/* Range toggle */}
            <div
              className="flex gap-1 rounded-xl p-1"
              style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
            >
              {RANGES.map(r => (
                <button
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  className="flex-1 py-1.5 text-xs font-semibold rounded-lg transition"
                  style={
                    range === r.value
                      ? { backgroundColor: 'white', color: 'black' }
                      : { color: theme.textMid }
                  }
                >
                  {r.label}
                </button>
              ))}
            </div>
            <TeamTrendChart members={members} teamAvg={teamAvg} />
          </div>
        )}

        {/* Weekly digest sections */}
        {leanIn.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-400" />
              <p className="text-xs font-semibold text-[rgba(180,180,255,0.5)] uppercase tracking-wider">Lean In</p>
            </div>
            <div className="bg-[#13132A] border border-[rgba(124,111,247,0.15)] rounded-2xl overflow-hidden">
              {leanIn.map(m => <MemberRow key={m.id} member={m} />)}
            </div>
          </div>
        )}

        {stable.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-zinc-500" />
              <p className="text-xs font-semibold text-[rgba(180,180,255,0.5)] uppercase tracking-wider">Holding Steady</p>
            </div>
            <div className="bg-[#13132A] border border-[rgba(124,111,247,0.15)] rounded-2xl overflow-hidden">
              {stable.map(m => <MemberRow key={m.id} member={m} />)}
            </div>
          </div>
        )}

        {leanOut.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <p className="text-xs font-semibold text-[rgba(180,180,255,0.5)] uppercase tracking-wider">Doing Well</p>
            </div>
            <div className="bg-[#13132A] border border-[rgba(124,111,247,0.15)] rounded-2xl overflow-hidden">
              {leanOut.map(m => <MemberRow key={m.id} member={m} />)}
            </div>
          </div>
        )}

        {members.length === 0 && (
          <div className="text-center py-16 text-[rgba(180,180,255,0.35)] text-sm">
            <p>No team members yet.</p>
            <button
              onClick={() => navigate('/roster')}
              className="mt-3 text-white underline"
            >
              Go to Roster
            </button>
          </div>
        )}

        {/* FAB */}
        <button
          onClick={() => navigate('/log')}
          className="fixed bottom-6 right-6 w-14 h-14 bg-white text-black rounded-full flex items-center justify-center text-2xl font-bold shadow-lg hover:bg-zinc-200 transition z-40"
          title="Log a score"
        >
          +
        </button>
      </div>
    </Layout>
  );
}
