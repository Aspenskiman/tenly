import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { getMyTeams, getTeamSummary, MemberWithTrend } from '../api/teams';
import { getScoreTextColor, getTrendArrow, getTrendColor, getZoneLabel } from '../lib/scores';

function DigestMemberRow({ member }: { member: MemberWithTrend }) {
  const navigate = useNavigate();
  const score = member.recentAvg;

  return (
    <div
      className="flex items-center gap-3 py-3.5 px-4 border-b border-zinc-800 last:border-0 cursor-pointer hover:bg-zinc-800/40 transition"
      onClick={() => navigate(`/members/${member.id}`)}
    >
      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0">
        {member.name.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{member.name}</p>
        {score !== null && (
          <p className="text-xs text-zinc-500 mt-0.5">{getZoneLabel(Math.round(score))}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {score !== null && (
          <span className={`text-lg font-black ${getScoreTextColor(Math.round(score))}`}>
            {score.toFixed(1)}
          </span>
        )}
        <span className={`text-sm font-bold ${getTrendColor(member.trend)}`}>
          {getTrendArrow(member.trend)}
        </span>
      </div>
    </div>
  );
}

export default function WeeklyDigest() {
  const navigate = useNavigate();

  const { data: teams, isLoading } = useQuery({ queryKey: ['teams'], queryFn: getMyTeams });
  const teamId = teams?.[0]?.id;

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['team-summary', teamId],
    queryFn: () => getTeamSummary(teamId!),
    enabled: !!teamId,
  });

  const members = summary?.members ?? [];

  function hasThreeConsecutiveDrops(member: MemberWithTrend): boolean {
    const scores = member.entries.slice(-3).map(e => e.score);
    if (scores.length < 3) return false;
    return scores[1] < scores[0] && scores[2] < scores[1];
  }

  const needsAttention = members.filter(m =>
    (m.trend === 'down' && m.recentAvg !== null && m.recentAvg < 6) ||
    hasThreeConsecutiveDrops(m)
  );
  function hasThreeConsecutiveRises(member: MemberWithTrend): boolean {
    const scores = member.entries.slice(-3).map(e => e.score);
    if (scores.length < 3) return false;
    return scores[1] > scores[0] && scores[2] > scores[1];
  }

  const doingWell = members.filter(m => hasThreeConsecutiveRises(m));

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  if (isLoading || summaryLoading) {
    return (
      <Layout>
        <div className="space-y-4 mt-4">
          <div className="h-16 bg-zinc-800/50 rounded-2xl animate-pulse" />
          <div className="h-40 bg-zinc-800/50 rounded-2xl animate-pulse" />
          <div className="h-40 bg-zinc-800/50 rounded-2xl animate-pulse" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto space-y-5 pb-20">

        {/* Header */}
        <div className="pt-1">
          <h1 className="text-xl font-black text-white">Weekly Digest</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{today}</p>
        </div>

        {/* All good state */}
        {needsAttention.length === 0 && doingWell.length === 0 && members.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
            <p className="text-sm text-zinc-300 italic">Your team is in a good place this week.</p>
          </div>
        )}

        {/* Needs Attention */}
        {needsAttention.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Needs Attention</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              {needsAttention.map(m => <DigestMemberRow key={m.id} member={m} />)}
            </div>
          </div>
        )}

        {/* Doing Well */}
        {doingWell.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Doing Well</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              {doingWell.map(m => <DigestMemberRow key={m.id} member={m} />)}
            </div>
          </div>
        )}

        {members.length === 0 && (
          <div className="text-center py-16 text-zinc-500 text-sm">
            <p>No team members yet.</p>
            <button onClick={() => navigate('/roster')} className="mt-3 text-white underline">
              Go to Roster
            </button>
          </div>
        )}

        {/* Email note */}
        {members.length > 0 && (
          <p className="text-xs text-zinc-600 text-center">
            This digest is also sent to your email every Monday at 7am.
          </p>
        )}

      </div>
    </Layout>
  );
}
