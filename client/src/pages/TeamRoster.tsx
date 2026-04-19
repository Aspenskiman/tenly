import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import {
  getMyTeams, getTeamSummary, addMember, archiveMember,
  Team, MemberWithTrend,
} from '../api/teams';
import {
  getScoreTextColor, getScoreBorder, getTrendArrow, getTrendColor,
  getZoneLabel, formatDate,
} from '../lib/scores';

function MemberRow({ member, onLog, onArchive }: {
  member: MemberWithTrend;
  onLog: (m: MemberWithTrend) => void;
  onArchive: (id: string) => void;
}) {
  const navigate = useNavigate();
  const lastScore = member.lastEntry?.score ?? null;
  const lastDate = member.lastEntry?.interaction_date ?? null;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-zinc-800 last:border-0">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-400 shrink-0">
        {member.name.charAt(0).toUpperCase()}
      </div>

      {/* Name + last check-in */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{member.name}</p>
        <p className="text-xs text-zinc-500">
          {lastDate ? `Last check-in ${formatDate(lastDate)}` : 'No check-ins yet'}
        </p>
      </div>

      {/* Score + trend */}
      <div className="flex items-center gap-2 shrink-0">
        {lastScore !== null ? (
          <div className={`flex items-center gap-1`}>
            <span className={`text-lg font-black ${getScoreTextColor(lastScore)}`}>{lastScore}</span>
            <span className={`text-xs font-bold ${getTrendColor(member.trend)}`}>
              {getTrendArrow(member.trend)}
            </span>
          </div>
        ) : (
          <span className="text-xs text-zinc-600">—</span>
        )}
        {member.recentAvg !== null && (
          <span className="text-xs text-zinc-500 hidden sm:block">
            avg {member.recentAvg.toFixed(1)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onLog(member)}
          className="px-2.5 py-1 text-xs bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition"
        >
          Log
        </button>
        <button
          onClick={() => navigate(`/members/${member.id}`)}
          className="px-2.5 py-1 text-xs border border-zinc-700 text-zinc-400 rounded-lg hover:border-zinc-500 hover:text-white transition"
        >
          View
        </button>
        <button
          onClick={() => {
            if (confirm(`Archive ${member.name}? Their history will be preserved.`)) {
              onArchive(member.id);
            }
          }}
          className="p-1 text-zinc-600 hover:text-orange-400 transition text-xs"
          title="Archive"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function AddMemberModal({ teamId, onClose, onAdded }: {
  teamId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => addMember(teamId, { name: name.trim(), email: email.trim() || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['teams'] }); onAdded(); onClose(); },
  });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 space-y-4">
        <h3 className="text-base font-bold text-white">Add team member</h3>
        <div className="space-y-3">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Name *"
            className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
            autoFocus
          />
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email (optional)"
            type="email"
            className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm border border-zinc-700 text-zinc-400 rounded-xl hover:border-zinc-500 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!name.trim() || mutation.isPending}
            className="flex-1 py-2.5 text-sm bg-white text-black font-semibold rounded-xl disabled:opacity-40 hover:bg-zinc-200 transition"
          >
            {mutation.isPending ? 'Adding…' : 'Add member'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeamRoster() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [addingToTeam, setAddingToTeam] = useState<string | null>(null);

  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: getMyTeams,
  });

  // Fetch summaries for all teams
  const teamId = teams?.[0]?.id;
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['team-summary', teamId],
    queryFn: () => getTeamSummary(teamId!),
    enabled: !!teamId,
  });

  const archiveMut = useMutation({
    mutationFn: archiveMember,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team-summary', teamId] }),
  });

  if (isLoading || summaryLoading) {
    return (
      <Layout>
        <div className="space-y-3 mt-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-zinc-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </Layout>
    );
  }

  if (!teams?.length) {
    return (
      <Layout>
        <div className="text-center py-20 text-zinc-500">
          <p className="text-lg font-semibold text-white">No teams yet</p>
          <p className="text-sm mt-1">Create your first team to get started.</p>
        </div>
      </Layout>
    );
  }

  const team = teams[0];
  const members = summary?.members ?? [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white">{team.name}</h1>
            <p className="text-xs text-zinc-500 mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setAddingToTeam(team.id)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-black text-sm font-bold rounded-xl hover:bg-zinc-200 transition"
          >
            <span className="text-base leading-none">+</span> Add
          </button>
        </div>

        {/* Members */}
        {members.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <p className="text-sm">No team members yet.</p>
            <button
              onClick={() => setAddingToTeam(team.id)}
              className="mt-3 text-sm text-white underline"
            >
              Add your first member
            </button>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4">
            {members.map(m => (
              <MemberRow
                key={m.id}
                member={m}
                onLog={(member) => navigate(`/log?memberId=${member.id}&memberName=${encodeURIComponent(member.name)}`)}
                onArchive={(id) => archiveMut.mutate(id)}
              />
            ))}
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

      {addingToTeam && (
        <AddMemberModal
          teamId={addingToTeam}
          onClose={() => setAddingToTeam(null)}
          onAdded={() => qc.invalidateQueries({ queryKey: ['team-summary', teamId] })}
        />
      )}
    </Layout>
  );
}
