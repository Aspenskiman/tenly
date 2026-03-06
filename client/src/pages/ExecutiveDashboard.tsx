import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import Layout from '../components/Layout';
import { getCompanyData } from '../api/teams';

interface MemberWithEntries {
  id: string;
  name: string;
  email?: string;
  entries: Array<{ score: number; interaction_date: string; notes: string | null }>;
}

interface TeamData {
  id: string;
  name: string;
  manager?: { name: string };
  members: MemberWithEntries[];
}

function avg(entries: MemberWithEntries['entries']): number | null {
  if (!entries.length) return null;
  return entries.reduce((s, e) => s + e.score, 0) / entries.length;
}

function trendLabel(entries: MemberWithEntries['entries']): { label: string; color: string } {
  if (entries.length < 4) return { label: 'N/A', color: 'text-gray-400' };
  const half = Math.floor(entries.length / 2);
  const sorted = [...entries].sort(
    (a, b) => new Date(a.interaction_date).getTime() - new Date(b.interaction_date).getTime()
  );
  const first = sorted.slice(0, half);
  const last = sorted.slice(half);
  const firstAvg = first.reduce((s, e) => s + e.score, 0) / first.length;
  const lastAvg = last.reduce((s, e) => s + e.score, 0) / last.length;
  const delta = lastAvg - firstAvg;
  if (delta <= -0.5) return { label: '↓ Falling', color: 'text-red-500' };
  if (delta >= 0.5) return { label: '↑ Rising', color: 'text-green-600' };
  return { label: '→ Stable', color: 'text-gray-500' };
}

export default function ExecutiveDashboard() {
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    getCompanyData(days)
      .then((data) => setTeams(data as unknown as TeamData[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  const allMembers = teams.flatMap((t) => t.members);
  const companyAvg =
    allMembers.length > 0
      ? (
          allMembers.flatMap((m) => m.entries.map((e) => e.score)).reduce((a, b) => a + b, 0) /
          allMembers.flatMap((m) => m.entries).length
        ).toFixed(1)
      : '--';

  const teamBarData = teams.map((t) => {
    const scores = t.members.flatMap((m) => m.entries.map((e) => e.score));
    return {
      name: t.name,
      avg: scores.length ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0,
    };
  });

  const atRisk = allMembers
    .map((m) => ({ ...m, avg: avg(m.entries), trend: trendLabel(m.entries) }))
    .filter((m) => m.trend.label === '↓ Falling' || (m.avg !== null && m.avg < 5))
    .sort((a, b) => (a.avg ?? 10) - (b.avg ?? 10));

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center pt-20">
          <div className="animate-spin h-8 w-8 border-4 border-tenly-500 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Company Overview</h1>
            <p className="text-gray-500 text-sm mt-1">Read-only executive view</p>
          </div>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-tenly-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Company avg score', value: companyAvg + ' / 10' },
            { label: 'Total team members', value: allMembers.length.toString() },
            { label: 'At-risk members', value: atRisk.length.toString() },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">{kpi.label}</p>
              <p className="text-3xl font-black text-gray-900 mt-1">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Team bar chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Average Score by Team</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={teamBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} width={25} />
              <Tooltip />
              <Bar dataKey="avg" fill="#0284c7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* At-risk table */}
        {atRisk.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Members Needing Attention</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Avg Score</th>
                    <th className="pb-2 font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {atRisk.map((m) => (
                    <tr key={m.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 font-medium text-gray-900">{m.name}</td>
                      <td className="py-2 text-gray-700">
                        {m.avg !== null ? m.avg.toFixed(1) : '--'}
                      </td>
                      <td className={`py-2 font-medium ${m.trend.color}`}>{m.trend.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Team breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {teams.map((team) => (
            <div key={team.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{team.name}</h3>
                {team.manager && (
                  <span className="text-xs text-gray-400">mgr: {team.manager.name}</span>
                )}
              </div>
              <div className="space-y-2">
                {team.members.map((m) => {
                  const a = avg(m.entries);
                  const t = trendLabel(m.entries);
                  return (
                    <div key={m.id} className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-700">{m.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-900">
                          {a !== null ? a.toFixed(1) : '--'}
                        </span>
                        <span className={`text-xs font-medium ${t.color}`}>{t.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
