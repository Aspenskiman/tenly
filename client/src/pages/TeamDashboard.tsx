import { useState } from 'react';
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

  const { data: teams, isLoading } = useQuery({ queryKey: ['teams'], queryFn: getMyTeams });
  const teamId = teams?.[0]?.id;

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['team-summary', teamId],
    queryFn: () => getTeamSummary(teamId!),
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
