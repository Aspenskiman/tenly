import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAllTeams, Team } from '../api/teams';
import { createInvite } from '../api/invites';
import api from '../api/client';
import Navbar from '../components/Navbar';
import { theme } from '../lib/theme';

function TeamCard({ team }: { team: Team }) {
  const qc = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [inviteError, setInviteError] = useState('');

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteStatus('sending');
    setInviteError('');
    try {
      await createInvite(inviteEmail.trim(), team.id);
      setInviteStatus('sent');
      setInviteEmail('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setInviteError(msg ?? 'Failed to send invite. Try again.');
      setInviteStatus('error');
    }
  }

  const manager = team.manager;

  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-white">{team.name}</h3>
          <p className="text-xs mt-0.5" style={{ color: theme.textMute }}>
            {manager ? manager.name : 'No manager yet'}
          </p>
        </div>
        {!showInvite && inviteStatus !== 'sent' && (
          <button
            onClick={() => setShowInvite(true)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition"
            style={{ backgroundColor: `${theme.accent}20`, color: theme.accentLt, border: `1px solid ${theme.accent}40` }}
          >
            Invite Manager
          </button>
        )}
      </div>

      {inviteStatus === 'sent' && (
        <p className="text-xs" style={{ color: '#22C55E' }}>
          Invite sent to {inviteEmail || 'manager'} ✓
        </p>
      )}

      {showInvite && inviteStatus !== 'sent' && (
        <form onSubmit={handleSendInvite} className="flex gap-2 mt-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            required
            placeholder="manager@company.com"
            className="flex-1 px-3 py-1.5 rounded-lg text-white text-xs focus:outline-none"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
          />
          <button
            type="submit"
            disabled={inviteStatus === 'sending'}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 transition"
            style={{ backgroundColor: theme.accent, color: '#fff' }}
          >
            {inviteStatus === 'sending' ? '…' : 'Send'}
          </button>
          <button
            type="button"
            onClick={() => { setShowInvite(false); setInviteError(''); setInviteStatus('idle'); }}
            className="text-xs px-2 py-1.5 rounded-lg"
            style={{ color: theme.textMute }}
          >
            ✕
          </button>
        </form>
      )}

      {inviteError && (
        <p className="text-xs mt-1.5" style={{ color: '#EF4444' }}>{inviteError}</p>
      )}
    </div>
  );
}

export default function CreatorDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: teams = [], isLoading } = useQuery({ queryKey: ['company-teams'], queryFn: getAllTeams });

  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [addingTeam, setAddingTeam] = useState(false);
  const [addTeamError, setAddTeamError] = useState('');

  async function handleAddTeam(e: React.FormEvent) {
    e.preventDefault();
    setAddingTeam(true);
    setAddTeamError('');
    try {
      await api.post('/teams', { name: newTeamName.trim() });
      setNewTeamName('');
      setShowAddTeam(false);
      qc.invalidateQueries({ queryKey: ['company-teams'] });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setAddTeamError(msg ?? 'Failed to create team. Try again.');
    } finally {
      setAddingTeam(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: theme.bg }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white mb-1">
              {user?.companyName ?? 'Your Company'}
            </h1>
            <p className="text-sm" style={{ color: theme.textMid }}>Creator Dashboard</p>
          </div>
          <button
            onClick={() => setShowAddTeam(v => !v)}
            className="text-sm font-semibold px-4 py-2 rounded-xl transition"
            style={{ backgroundColor: theme.accent, color: '#fff' }}
          >
            + Add Team
          </button>
        </div>

        {showAddTeam && (
          <form
            onSubmit={handleAddTeam}
            className="rounded-2xl p-5 mb-4"
            style={{ backgroundColor: theme.surface, border: `1px solid ${theme.accent}40` }}
          >
            <p className="text-sm font-semibold text-white mb-3">New Team</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                required
                placeholder="Team name"
                autoFocus
                className="flex-1 px-3 py-2 rounded-xl text-white text-sm focus:outline-none"
                style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
              />
              <button
                type="submit"
                disabled={addingTeam}
                className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ backgroundColor: theme.accent, color: '#fff' }}
              >
                {addingTeam ? '…' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddTeam(false); setAddTeamError(''); }}
                className="px-3 py-2 rounded-xl text-sm"
                style={{ color: theme.textMute }}
              >
                ✕
              </button>
            </div>
            {addTeamError && (
              <p className="text-xs mt-2" style={{ color: '#EF4444' }}>{addTeamError}</p>
            )}
          </form>
        )}

        <div className="space-y-3">
          {isLoading && (
            <p className="text-sm animate-pulse text-center py-8" style={{ color: theme.textMute }}>
              Loading teams…
            </p>
          )}
          {!isLoading && teams.length === 0 && (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
            >
              <p className="text-sm" style={{ color: theme.textMid }}>No teams yet. Add one above.</p>
            </div>
          )}
          {teams.map(team => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      </div>
    </div>
  );
}
