import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAllTeams,
  patchTeam,
  getCompanyStats,
  getCompanyManagers,
  Team,
  CompanyManager,
} from '../api/teams';
import { createInvite } from '../api/invites';
import api from '../api/client';
import Navbar from '../components/Navbar';
import { theme } from '../lib/theme';

function apiError(err: unknown): string {
  return (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Something went wrong.';
}

function StatCard({ label, value }: { label: string; value: number | undefined }) {
  return (
    <div
      className="flex-1 rounded-xl px-4 py-3 text-center"
      style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
    >
      <p className="text-xl font-black text-white">{value ?? '—'}</p>
      <p className="text-xs mt-0.5" style={{ color: theme.textMute }}>{label}</p>
    </div>
  );
}

function TeamCard({
  team,
  managers,
  allTeams,
}: {
  team: Team;
  managers: CompanyManager[];
  allTeams: Team[];
}) {
  const qc = useQueryClient();

  // Invite state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [inviteError, setInviteError] = useState('');

  // Team name editing state
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(team.name);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');

  // Manager reassignment state
  const [changingManager, setChangingManager] = useState(false);
  const [managerError, setManagerError] = useState('');

  const manager = team.manager;

  // Managers not assigned to any other team
  const assignedManagerIds = new Set(
    allTeams.filter(t => t.id !== team.id && t.manager).map(t => t.manager!.id)
  );
  const availableManagers = managers.filter(m => !assignedManagerIds.has(m.id));

  async function handleSaveName() {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === team.name) { setEditing(false); return; }
    setSavingName(true);
    setNameError('');
    try {
      await patchTeam(team.id, { name: trimmed });
      qc.invalidateQueries({ queryKey: ['company-teams'] });
      setEditing(false);
    } catch (err) {
      setNameError(apiError(err));
    } finally {
      setSavingName(false);
    }
  }

  async function handleManagerChange(managerId: string) {
    setManagerError('');
    try {
      await patchTeam(team.id, { managerId });
      qc.invalidateQueries({ queryKey: ['company-teams'] });
      setChangingManager(false);
    } catch (err) {
      setManagerError(apiError(err));
    }
  }

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteStatus('sending');
    setInviteError('');
    try {
      await createInvite(inviteEmail.trim(), team.id);
      setInviteStatus('sent');
      setInviteEmail('');
    } catch (err) {
      setInviteError(apiError(err));
      setInviteStatus('error');
    }
  }

  return (
    <div
      className="rounded-2xl p-5 space-y-3"
      style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
    >
      {/* Team name row */}
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <input
              autoFocus
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') { setEditing(false); setNameInput(team.name); } }}
              className="flex-1 px-2 py-1 rounded-lg text-white text-sm font-bold focus:outline-none"
              style={{ backgroundColor: theme.card, border: `1px solid ${theme.accent}` }}
            />
            <button
              onClick={handleSaveName}
              disabled={savingName}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg disabled:opacity-50"
              style={{ backgroundColor: theme.accent, color: '#fff' }}
            >
              {savingName ? '…' : 'Save'}
            </button>
            <button
              onClick={() => { setEditing(false); setNameInput(team.name); setNameError(''); }}
              className="text-xs px-2 py-1 rounded-lg"
              style={{ color: theme.textMute }}
            >
              ✕
            </button>
          </>
        ) : (
          <>
            <h3 className="text-sm font-bold text-white flex-1">{team.name}</h3>
            <button
              onClick={() => { setEditing(true); setNameInput(team.name); }}
              title="Edit team name"
              className="text-xs px-1.5 py-0.5 rounded opacity-50 hover:opacity-100 transition"
              style={{ color: theme.textMid }}
            >
              ✏
            </button>
          </>
        )}
      </div>
      {nameError && <p className="text-xs" style={{ color: '#EF4444' }}>{nameError}</p>}

      {/* Manager row */}
      <div className="flex items-center gap-2">
        <p className="text-xs flex-1" style={{ color: theme.textMute }}>
          {manager ? manager.name : 'No leader assigned'}
        </p>
        {!changingManager && (
          <button
            onClick={() => { setChangingManager(true); setManagerError(''); }}
            className="text-xs font-medium hover:underline"
            style={{ color: theme.accentLt }}
          >
            Change
          </button>
        )}
        {changingManager && (
          <div className="flex items-center gap-1.5 flex-1">
            <select
              autoFocus
              defaultValue=""
              onChange={e => e.target.value && handleManagerChange(e.target.value)}
              className="flex-1 px-2 py-1 rounded-lg text-white text-xs focus:outline-none"
              style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
            >
              <option value="" disabled>Select leader…</option>
              {availableManagers.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
              ))}
              {availableManagers.length === 0 && (
                <option disabled>No available leaders</option>
              )}
            </select>
            <button
              onClick={() => { setChangingManager(false); setManagerError(''); }}
              className="text-xs px-1.5 py-1 rounded"
              style={{ color: theme.textMute }}
            >
              ✕
            </button>
          </div>
        )}
      </div>
      {managerError && <p className="text-xs" style={{ color: '#EF4444' }}>{managerError}</p>}

      {/* Invite row */}
      {!showInvite && inviteStatus !== 'sent' && (
        <button
          onClick={() => setShowInvite(true)}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition"
          style={{ backgroundColor: `${theme.accent}20`, color: theme.accentLt, border: `1px solid ${theme.accent}40` }}
        >
          Invite Leader
        </button>
      )}

      {inviteStatus === 'sent' && (
        <p className="text-xs" style={{ color: '#22C55E' }}>Invite sent ✓</p>
      )}

      {showInvite && inviteStatus !== 'sent' && (
        <form onSubmit={handleSendInvite} className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            required
            placeholder="leader@company.com"
            className="flex-1 px-3 py-1.5 rounded-lg text-white text-xs focus:outline-none"
            style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
          />
          <button
            type="submit"
            disabled={inviteStatus === 'sending'}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
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

      {inviteError && <p className="text-xs" style={{ color: '#EF4444' }}>{inviteError}</p>}
    </div>
  );
}

export default function CreatorDashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: teams = [], isLoading } = useQuery({ queryKey: ['company-teams'], queryFn: getAllTeams });
  const { data: stats } = useQuery({ queryKey: ['company-stats'], queryFn: getCompanyStats });
  const { data: managers = [] } = useQuery({ queryKey: ['company-managers'], queryFn: getCompanyManagers });

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
      qc.invalidateQueries({ queryKey: ['company-stats'] });
    } catch (err: unknown) {
      setAddTeamError(apiError(err));
    } finally {
      setAddingTeam(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: theme.bg }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-3xl font-black text-white mb-0.5">
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

        {/* Stats strip */}
        <div className="flex gap-2 mb-8">
          <StatCard label="Teams" value={stats?.teamCount} />
          <StatCard label="Leaders" value={stats?.managerCount} />
          <StatCard label="Members" value={stats?.memberCount} />
          <StatCard label="Pending Invites" value={stats?.pendingInviteCount} />
        </div>

        {/* Add Team form */}
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

        {/* Teams list */}
        <div className="space-y-3">
          {isLoading && (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ backgroundColor: theme.surface }} />
              ))}
            </div>
          )}

          {!isLoading && teams.length === 0 && (
            <div
              className="rounded-2xl p-12 text-center"
              style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
            >
              <p className="text-sm font-semibold text-white mb-1">No teams yet</p>
              <p className="text-xs mb-4" style={{ color: theme.textMid }}>Add your first team to get started</p>
              <button
                onClick={() => setShowAddTeam(true)}
                className="text-sm font-semibold px-4 py-2 rounded-xl"
                style={{ backgroundColor: theme.accent, color: '#fff' }}
              >
                + Add Team
              </button>
            </div>
          )}

          {teams.map(team => (
            <TeamCard key={team.id} team={team} managers={managers} allTeams={teams} />
          ))}
        </div>
      </div>
    </div>
  );
}
