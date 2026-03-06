import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import Layout from '../components/Layout';
import { getMyTeams, logEntry, getMemberEntries, Team, TeamMember, HappinessEntry } from '../api/teams';

function ScoreButton({ n, selected, onClick }: { n: number; selected: boolean; onClick: () => void }) {
  const color =
    n <= 3 ? 'red' : n <= 5 ? 'amber' : n <= 7 ? 'yellow' : 'green';
  const base = `w-9 h-9 rounded-full text-sm font-bold transition border-2`;
  const styles: Record<string, string> = {
    red: selected ? 'bg-red-500 text-white border-red-500' : 'border-red-300 text-red-500 hover:bg-red-50',
    amber: selected ? 'bg-amber-500 text-white border-amber-500' : 'border-amber-300 text-amber-500 hover:bg-amber-50',
    yellow: selected ? 'bg-yellow-400 text-white border-yellow-400' : 'border-yellow-300 text-yellow-600 hover:bg-yellow-50',
    green: selected ? 'bg-green-500 text-white border-green-500' : 'border-green-300 text-green-600 hover:bg-green-50',
  };
  return (
    <button className={`${base} ${styles[color]}`} onClick={onClick}>
      {n}
    </button>
  );
}

function MemberCard({ member, managerId: _managerId, onLogged }: {
  member: TeamMember; managerId: string; onLogged: () => void;
}) {
  const [score, setScore] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [entries, setEntries] = useState<HappinessEntry[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (expanded) {
      getMemberEntries(member.id, 30).then(setEntries);
    }
  }, [expanded, member.id]);

  const recentAvg =
    entries.length > 0
      ? (entries.reduce((s, e) => s + e.score, 0) / entries.length).toFixed(1)
      : null;

  const chartData = entries.map((e) => ({
    date: new Date(e.interaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: e.score,
  }));

  async function handleLog() {
    if (score === null) return;
    setSubmitting(true);
    try {
      await logEntry(member.id, {
        score,
        notes: notes.trim() || undefined,
        interaction_date: new Date().toISOString(),
      });
      setSuccess(true);
      setScore(null);
      setNotes('');
      onLogged();
      setTimeout(() => setSuccess(false), 3000);
      if (expanded) getMemberEntries(member.id, 30).then(setEntries);
    } catch {
      alert('Failed to log score. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900">{member.name}</p>
          {member.email && <p className="text-xs text-gray-400">{member.email}</p>}
        </div>
        <div className="flex items-center gap-2">
          {recentAvg && (
            <span className="text-sm font-bold text-tenly-600">{recentAvg}</span>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-gray-400 hover:text-gray-700"
          >
            {expanded ? 'Hide chart ▲' : 'View chart ▼'}
          </button>
        </div>
      </div>

      {/* Score picker */}
      <div>
        <p className="text-xs text-gray-500 mb-2">What's their Tenly score today?</p>
        <div className="flex gap-1.5 flex-wrap">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <ScoreButton key={n} n={n} selected={score === n} onClick={() => setScore(n)} />
          ))}
        </div>
      </div>

      {score !== null && (
        <div className="space-y-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional note (max 500 chars)"
            maxLength={500}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-tenly-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleLog}
              disabled={submitting}
              className="px-4 py-1.5 bg-tenly-600 hover:bg-tenly-700 text-white text-sm rounded-lg font-medium transition disabled:opacity-50"
            >
              {submitting ? 'Logging…' : `Log ${score}/10`}
            </button>
            {success && <span className="text-sm text-green-600 font-medium self-center">✓ Logged</span>}
          </div>
        </div>
      )}

      {expanded && chartData.length > 0 && (
        <div className="pt-2">
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
              <YAxis domain={[1, 10]} tick={{ fontSize: 10 }} tickLine={false} width={20} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#0284c7"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function ManagerDashboard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTeams = () => {
    getMyTeams()
      .then(setTeams)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTeams(); }, []);

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Team</h1>
          <p className="text-gray-500 text-sm mt-1">
            Log a score after every 1:1. One number. Real signal.
          </p>
        </div>

        {teams.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">No teams yet.</p>
            <p className="text-sm">Create your first team to get started.</p>
          </div>
        )}

        {teams.map((team) => (
          <div key={team.id}>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">{team.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {team.members.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  managerId={team.manager_id ?? ''}
                  onLogged={loadTeams}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
