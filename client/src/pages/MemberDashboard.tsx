import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid,
} from 'recharts';
import Layout from '../components/Layout';
import { getMemberEntries, getMyTeams, getTeamSummary } from '../api/teams';
import {
  getScoreColor, getScoreTextColor, getTrendArrow, getTrendColor,
  getZoneLabel, formatDate, formatDateLong,
} from '../lib/scores';

type Range = '7d' | '30d' | '90d' | '12mo';

const RANGES: { label: string; value: Range; days: number }[] = [
  { label: '7d', value: '7d', days: 7 },
  { label: '30d', value: '30d', days: 30 },
  { label: '90d', value: '90d', days: 90 },
  { label: '12mo', value: '12mo', days: 365 },
];

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#13132A] border border-[rgba(124,111,247,0.2)] rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-[rgba(180,180,255,0.5)]">{d.fullDate}</p>
      <p className="text-white font-black text-base">{d.score}/10</p>
      {d.notes && <p className="text-[rgba(180,180,255,0.35)] max-w-[160px] truncate mt-0.5">{d.notes}</p>}
    </div>
  );
}

export default function MemberDashboard() {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const [range, setRange] = useState<Range>('30d');

  const rangeObj = RANGES.find(r => r.value === range)!;

  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['entries', memberId, rangeObj.days],
    queryFn: () => getMemberEntries(memberId!, rangeObj.days),
    enabled: !!memberId,
  });

  // Get member info from teams
  const { data: teams } = useQuery({ queryKey: ['teams'], queryFn: getMyTeams });
  const teamId = teams?.[0]?.id;
  const { data: summary } = useQuery({
    queryKey: ['team-summary', teamId],
    queryFn: () => getTeamSummary(teamId!),
    enabled: !!teamId,
  });
  const member = summary?.members.find(m => m.id === memberId);

  const chartData = entries.map(e => ({
    date: formatDate(e.interaction_date),
    fullDate: formatDateLong(e.interaction_date),
    score: e.score,
    notes: e.notes,
  }));

  const avg = entries.length
    ? (entries.reduce((s, e) => s + e.score, 0) / entries.length)
    : null;

  const latestScore = entries[entries.length - 1]?.score ?? null;
  const trend = member?.trend ?? 'insufficient_data';

  // Story So Far — appears after 4+ entries
  const storySoFar = entries.length >= 4 && avg !== null ? (() => {
    const low = Math.min(...entries.map(e => e.score));
    const lowEntry = entries.find(e => e.score === low);
    const zone = getZoneLabel(avg);
    return `In the last ${rangeObj.days} days, ${member?.name ?? 'this member'} has averaged ${avg.toFixed(1)} — currently in the ${zone} zone. ${entries.length} check-ins total. Lowest score was a ${low}${lowEntry ? ` on ${formatDate(lowEntry.interaction_date)}` : ''}.`;
  })() : null;

  if (entriesLoading) {
    return (
      <Layout>
        <div className="space-y-4 mt-4">
          <div className="h-8 w-40 bg-[#1A1A35]/50 rounded-lg animate-pulse" />
          <div className="h-48 bg-[#1A1A35]/50 rounded-2xl animate-pulse" />
          <div className="h-32 bg-[#1A1A35]/50 rounded-2xl animate-pulse" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto space-y-5 pb-8">
        {/* Back + name */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-[rgba(180,180,255,0.35)] hover:text-white transition text-sm"
          >
            ← Back
          </button>
          <h1 className="text-xl font-black text-white">{member?.name ?? 'Member'}</h1>
        </div>

        {/* Hero score */}
        <div className="bg-[#13132A] border border-[rgba(124,111,247,0.15)] rounded-2xl p-5 flex items-center gap-5">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                boxShadow: latestScore ? `0 0 32px ${getScoreColor(latestScore)}40` : undefined,
                border: `2px solid ${latestScore ? getScoreColor(latestScore) : '#3f3f46'}`,
              }}
            >
              <span
                className="text-4xl font-black"
                style={{ color: latestScore ? getScoreColor(latestScore) : '#71717a' }}
              >
                {latestScore ?? '—'}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-black ${getTrendColor(trend)}`}>
                {getTrendArrow(trend)}
              </span>
              {avg !== null && (
                <span className="text-sm text-[rgba(180,180,255,0.5)]">
                  Avg <span className="text-white font-bold">{avg.toFixed(1)}</span>
                </span>
              )}
            </div>
            {latestScore && (
              <p className="text-sm text-[rgba(180,180,255,0.35)] mt-0.5">{getZoneLabel(latestScore)}</p>
            )}
            <p className="text-xs text-[rgba(180,180,255,0.25)] mt-1">{entries.length} check-ins</p>
          </div>
          <button
            onClick={() => navigate(`/log?memberId=${memberId}&memberName=${encodeURIComponent(member?.name ?? '')}`)}
            className="px-3 py-2 bg-white text-black text-xs font-bold rounded-xl hover:bg-zinc-200 transition"
          >
            Log score
          </button>
        </div>

        {/* Range toggle */}
        <div className="flex gap-1 bg-[#13132A] border border-[rgba(124,111,247,0.15)] rounded-xl p-1">
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                range === r.value
                  ? 'bg-white text-black'
                  : 'text-[rgba(180,180,255,0.35)] hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Chart */}
        {chartData.length > 1 ? (
          <div className="bg-[#13132A] border border-[rgba(124,111,247,0.15)] rounded-2xl p-4">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={latestScore ? getScoreColor(latestScore) : '#22C55E'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={latestScore ? getScoreColor(latestScore) : '#22C55E'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272C" />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis domain={[1, 10]} tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} ticks={[1,3,5,7,9]} />
                {avg !== null && (
                  <ReferenceLine y={avg} stroke="#52525b" strokeDasharray="4 4" />
                )}
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke={latestScore ? getScoreColor(latestScore) : '#22C55E'}
                  strokeWidth={2}
                  fill="url(#scoreGrad)"
                  dot={{ fill: latestScore ? getScoreColor(latestScore) : '#22C55E', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : chartData.length === 1 ? (
          <div className="bg-[#13132A] border border-[rgba(124,111,247,0.15)] rounded-2xl p-5 text-center text-[rgba(180,180,255,0.35)] text-sm">
            Only 1 entry — log more to see trends.
          </div>
        ) : (
          <div className="bg-[#13132A] border border-[rgba(124,111,247,0.15)] rounded-2xl p-5 text-center text-[rgba(180,180,255,0.35)] text-sm">
            No check-ins in this period.
          </div>
        )}

        {/* Story So Far */}
        {storySoFar && (
          <div
            className="rounded-2xl p-4 border-l-4 text-sm text-[rgba(180,180,255,0.5)] italic bg-[#13132A] border-[rgba(124,111,247,0.15)]"
            style={{ borderLeftColor: latestScore ? getScoreColor(latestScore) : '#3f3f46' }}
          >
            {storySoFar}
          </div>
        )}

        {/* Check-in log */}
        {entries.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[rgba(180,180,255,0.5)] uppercase tracking-wider">Check-in history</p>
            <div className="bg-[#13132A] border border-[rgba(124,111,247,0.15)] rounded-2xl divide-y divide-zinc-800">
              {[...entries].reverse().map(e => (
                <div key={e.id} className="flex items-start gap-3 px-4 py-3">
                  <span
                    className="text-lg font-black shrink-0 w-8 text-center"
                    style={{ color: getScoreColor(e.score) }}
                  >
                    {e.score}
                  </span>
                  <div className="flex-1 min-w-0">
                    {e.notes && <p className="text-sm text-zinc-300 truncate">{e.notes}</p>}
                    <p className="text-xs text-[rgba(180,180,255,0.25)]">{formatDateLong(e.interaction_date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
