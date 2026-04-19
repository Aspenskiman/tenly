import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
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

function TeamRow({ team }: { team: Team }) {
  const [expanded, setExpanded] = useState(false);
  const avg = teamAvg(team);
  const allEntries = team.members.flatMap(m => m.entries);
  const trend = calcTrend(allEntries);

  const trendArrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-orange-400' : 'text-zinc-500';

  const weeklyData = (() => {
    const weeks: number[][] = Array.from({ length: 8 }, () => []);
    const now = Date.now();
    allEntries.forEach(e => {
      const daysAgo = Math.floor((now - new Date(e.interaction_date).getTime()) / 86400000);
      const weekIndex = Math.min(7, Math.floor(daysAgo / 7));
      weeks[7 - weekIndex].push(e.score);
    });
    return weeks
      .map(w => ({ s: w.length ? w.reduce((a, b) => a + b, 0) / w.length : null }))
      .filter(w => w.s !== null);
  })();

  return (
    <div className="border-b border-zinc-800 last:border-0">
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-zinc-800/30 transition"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{team.name}</p>
          {team.manager && (
            <p className="text-xs text-zinc-600 mt-0.5">{team.manager.name}</p>
          )}
        </div>

        <div className="w-20 h-8 shrink-0">
          {weeklyData.length >= 2 && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <Line
                  type="monotone"
                  dataKey="s"
                  stroke={avg ? getScoreColor(avg) : '#52525b'}
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-2xl font-black"
            style={{ color: avg ? getScoreColor(avg) : '#52525b' }}
          >
            {avg !== null ? avg.toFixed(1) : '—'}
          </span>
          <span className={`text-sm font-bold ${trendColor}`}>{trendArrow}</span>
        </div>

        <span className="text-zinc-600 text-xs">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="px-5 pb-3">
          {team.members
            .map(m => {
              const scores = m.entries.map(e => e.score);
              const a = scores.length ? scores.reduce((x, y) => x + y, 0) / scores.length : null;
              return { ...m, avg: a };
            })
            .sort((a, b) => (a.avg ?? 10) - (b.avg ?? 10))
            .map(m => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-zinc-800/60 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500">
                    {m.name.charAt(0)}
                  </div>
                  <span className="text-sm text-zinc-300">{m.name}</span>
                </div>
                <span className={`text-sm font-bold ${m.avg !== null ? getScoreTextColor(Math.round(m.avg)) : 'text-zinc-600'}`}>
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

  const sortedTeams = [...teams].sort((a, b) => {
    const aAvg = teamAvg(a) ?? 10;
    const bAvg = teamAvg(b) ?? 10;
    return aAvg - bAvg;
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-4 mt-4">
          <div className="h-48 bg-zinc-800/50 rounded-2xl animate-pulse" />
          <div className="h-32 bg-zinc-800/50 rounded-2xl animate-pulse" />
          <div className="h-32 bg-zinc-800/50 rounded-2xl animate-pulse" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto space-y-5 pb-20">

        {/* Company score hero */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Company Score</p>
          <div
            className="font-black leading-none"
            style={{
              fontSize: 96,
              color: avg ? getScoreColor(avg) : '#52525b',
              textShadow: avg ? `0 0 60px ${getScoreColor(avg)}40` : undefined,
            }}
          >
            {avg !== null ? avg.toFixed(1) : '—'}
          </div>
          {avg !== null && (
            <p className="text-sm text-zinc-500 mt-2">{getZoneLabel(Math.round(avg))}</p>
          )}
          <p className="text-xs text-zinc-600 mt-1">
            {teams.flatMap(t => t.members).length} members · {teams.length} teams
          </p>
        </div>

        {/* Range toggle */}
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition ${
                days === d ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {d === 7 ? '7d' : d === 30 ? '30d' : '90d'}
            </button>
          ))}
        </div>

        {/* Team rows — sorted lowest first */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Teams — Lowest First</p>
          </div>
          {sortedTeams.length === 0 && (
            <p className="text-center text-zinc-600 text-sm py-8">No team data yet.</p>
          )}
          {sortedTeams.map(team => (
            <TeamRow key={team.id} team={team} />
          ))}
        </div>

      </div>
    </Layout>
  );
}
