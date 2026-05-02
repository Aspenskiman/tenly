import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { getMyTeams, getTeamSummary, logEntry, getMemberEntries, MemberWithTrend } from '../api/teams';
import { scoreColor, formatDate } from '../lib/scores';

function suggestionAccent(s: number): string {
  if (s >= 8) return '#22C55E';
  if (s >= 5) return '#FFF200';
  return '#F97316';
}

const SUGGESTIONS: Record<number, string> = {
  1: "You're already showing up for them. Is there anything they need right now?",
  2: "What's been the hardest part of this week?",
  3: "What would make next week even slightly better?",
  4: "What's one thing that would help you feel more supported right now?",
  5: "What would have made this week a 5 instead of a 4?",
  6: "What kept you from a 7 this week?",
  7: "What's been working well for you lately?",
  8: "What's been energizing you this week?",
  9: "What made this week so strong?",
  10: "What made this a perfect week — what do we protect?",
};

export default function LogScore() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();

  const preselectedId = searchParams.get('memberId');
  const preselectedName = searchParams.get('memberName');

  const [selectedMemberId, setSelectedMemberId] = useState(preselectedId ?? '');
  const [score, setScore] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  const { data: teams } = useQuery({ queryKey: ['teams'], queryFn: getMyTeams });
  const teamId = teams?.[0]?.id;

  const { data: summary } = useQuery({
    queryKey: ['team-summary', teamId],
    queryFn: () => getTeamSummary(teamId!),
    enabled: !!teamId,
  });

  const members = summary?.members ?? [];
  const selectedMember = members.find(m => m.id === selectedMemberId);

  // Recent entries for the selected member (last 3)
  const { data: recentEntries } = useQuery({
    queryKey: ['entries', selectedMemberId],
    queryFn: () => getMemberEntries(selectedMemberId, 30),
    enabled: !!selectedMemberId,
  });

  const last3 = (recentEntries ?? []).slice(-3).reverse();

  const logMutation = useMutation({
    mutationFn: () => logEntry(selectedMemberId, {
      score: score!,
      notes: notes.trim() || undefined,
      interaction_date: new Date().toISOString(),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team-summary'] });
      qc.invalidateQueries({ queryKey: ['entries', selectedMemberId] });
      setSaved(true);
      setScore(null);
      setNotes('');
      setTimeout(() => {
        setSaved(false);
        navigate('/roster');
      }, 1200);
    },
  });

  const activeColor = score ? scoreColor(score) : '#71717a';

  return (
    <Layout>
      <div className="max-w-sm mx-auto space-y-6 pb-20">
        {/* Header */}
        <div>
          <h1 className="text-xl font-black text-white">Log a Score</h1>
          <p className="text-xs text-[rgba(180,180,255,0.35)] mt-0.5">After every 1:1. One number. Real signal.</p>
        </div>

        {/* Member selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[rgba(180,180,255,0.5)] uppercase tracking-wider">Team member</label>
          <select
            value={selectedMemberId}
            onChange={e => { setSelectedMemberId(e.target.value); setScore(null); setNotes(''); }}
            className="w-full px-3 py-3 bg-[#13132A] border border-[rgba(124,111,247,0.15)] rounded-xl text-white text-sm focus:outline-none focus:border-zinc-600 appearance-none"
          >
            <option value="">Select a member…</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Recent scores (last 3) */}
        {selectedMemberId && last3.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[rgba(180,180,255,0.5)] uppercase tracking-wider mb-2">Recent</p>
            <div className="flex gap-2">
              {last3.map((e, i) => (
                <div
                  key={e.id}
                  className={`flex-1 bg-[#13132A] border rounded-xl p-3 text-center ${i === 0 ? 'border-[rgba(124,111,247,0.2)]' : 'border-[rgba(124,111,247,0.15)] opacity-50'}`}
                >
                  <span className="text-2xl font-black" style={{ color: scoreColor(e.score) }}>{e.score}</span>
                  <p className="text-xs text-[rgba(180,180,255,0.25)] mt-0.5">{formatDate(e.interaction_date)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Score grid */}
        {selectedMemberId && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[rgba(180,180,255,0.5)] uppercase tracking-wider">
              {`How is ${selectedMember?.name.split(' ')[0] ?? 'your team member'}'s whole life this week?`}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[1,2,3,4,5,6,7,8,9,10].map(n => {
                const color = scoreColor(n);
                const isSelected = score === n;
                return (
                  <button
                    key={n}
                    onClick={() => setScore(n)}
                    className={`h-14 rounded-xl text-lg font-black transition-all border-2 ${
                      isSelected
                        ? 'border-transparent text-black scale-105'
                        : 'border-[rgba(124,111,247,0.15)] text-[rgba(180,180,255,0.5)] hover:border-zinc-600 hover:text-white bg-[#13132A]'
                    }`}
                    style={isSelected ? { backgroundColor: color, borderColor: color } : {}}
                  >
                    {n}
                  </button>
                );
              })}
            </div>

            {/* Conversation suggestion card */}
            {score && (
              <div
                key={score}
                className="rounded-lg px-4 py-3"
                style={{
                  backgroundColor: '#1F1F23',
                  border: '1px solid #27272C',
                  borderLeftWidth: '3px',
                  borderLeftColor: suggestionAccent(score),
                  animation: 'fadeIn 0.15s ease',
                }}
              >
                <p className="text-sm italic text-zinc-300">{SUGGESTIONS[score]}</p>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        {score !== null && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[rgba(180,180,255,0.5)] uppercase tracking-wider">Note (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="What came up in the conversation?"
              className="w-full px-3 py-2.5 bg-[#13132A] border border-[rgba(124,111,247,0.15)] rounded-xl text-sm text-white placeholder:text-[rgba(180,180,255,0.25)] focus:outline-none focus:border-zinc-600 resize-none"
            />
            <p className="text-xs text-[rgba(180,180,255,0.25)] text-right">{notes.length}/500</p>
          </div>
        )}

        {/* Save button */}
        <button
          onClick={() => logMutation.mutate()}
          disabled={!selectedMemberId || score === null || logMutation.isPending || saved}
          className="w-full py-4 rounded-xl font-black text-base transition-all disabled:opacity-30"
          style={
            score !== null && selectedMemberId
              ? { backgroundColor: activeColor, color: '#000' }
              : { backgroundColor: '#27272C', color: '#71717a' }
          }
        >
          {saved ? '✓ Logged' : logMutation.isPending ? 'Logging…' : score !== null ? `Log ${score}/10` : 'Select a score'}
        </button>

        {/* Cancel */}
        <button
          onClick={() => navigate('/roster')}
          className="w-full py-2 text-sm text-[rgba(180,180,255,0.35)] hover:text-white transition"
        >
          Cancel
        </button>
      </div>
    </Layout>
  );
}
