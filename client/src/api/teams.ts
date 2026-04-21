import api from './client';

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
  created_at: string;
  archived_at?: string | null;
}

export interface Team {
  id: string;
  name: string;
  manager_id?: string;
  manager?: { id: string; name: string };
  members: TeamMember[];
}

export interface HappinessEntry {
  id: string;
  score: number;
  notes: string | null;
  interaction_date: string;
  created_at: string;
}

export interface MemberWithTrend extends TeamMember {
  entries: HappinessEntry[];
  trend: 'up' | 'down' | 'stable' | 'insufficient_data';
  recentAvg: number | null;
  delta: number | null;
  lastEntry: HappinessEntry | null;
}

export interface TeamSummary {
  id: string;
  name: string;
  manager_id: string;
  members: MemberWithTrend[];
}

export async function getMyTeams(): Promise<Team[]> {
  const { data } = await api.get('/teams/my');
  return data.teams;
}

export async function getAllTeams(): Promise<Team[]> {
  const { data } = await api.get('/company/teams');
  return data.teams;
}

export async function patchTeam(
  teamId: string,
  updates: { name?: string; managerId?: string }
): Promise<Team> {
  const { data } = await api.patch(`/teams/${teamId}`, updates);
  return data.team;
}

export interface CompanyStats {
  teamCount: number;
  managerCount: number;
  memberCount: number;
  pendingInviteCount: number;
}

export interface CompanyManager {
  id: string;
  name: string;
  email: string;
}

export async function getCompanyStats(): Promise<CompanyStats> {
  const { data } = await api.get('/company/stats');
  return data;
}

export async function getCompanyManagers(): Promise<CompanyManager[]> {
  const { data } = await api.get('/company/managers');
  return data.managers;
}

export async function getTeamSummary(teamId: string, days = 90): Promise<TeamSummary> {
  const { data } = await api.get(`/teams/${teamId}/summary?days=${days}`);
  return data.team;
}

export async function createTeam(name: string): Promise<Team> {
  const { data } = await api.post('/teams', { name });
  return data.team;
}

export async function addMember(
  teamId: string,
  payload: { name: string; email?: string }
): Promise<TeamMember> {
  const { data } = await api.post(`/teams/${teamId}/members`, payload);
  return data.member;
}

export async function archiveMember(memberId: string): Promise<void> {
  await api.delete(`/teams/members/${memberId}`);
}

export async function logEntry(
  memberId: string,
  payload: { score: number; notes?: string; interaction_date: string }
): Promise<HappinessEntry> {
  const { data } = await api.post(`/teams/members/${memberId}/entries`, payload);
  return data.entry;
}

export async function getMemberEntries(
  memberId: string,
  days = 90
): Promise<HappinessEntry[]> {
  const { data } = await api.get(`/teams/members/${memberId}/entries?days=${days}`);
  return data.entries;
}

export async function getCompanyData(days = 30) {
  const { data } = await api.get(`/company/entries?days=${days}`);
  return data.teams as Array<Team & { members: Array<TeamMember & { entries: HappinessEntry[] }> }>;
}
