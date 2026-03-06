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

export async function getMyTeams(): Promise<Team[]> {
  const { data } = await api.get('/teams/my');
  return data.teams;
}

export async function getAllTeams(): Promise<Team[]> {
  const { data } = await api.get('/company/teams');
  return data.teams;
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

export async function logEntry(
  memberId: string,
  payload: { score: number; notes?: string; interaction_date: string }
): Promise<HappinessEntry> {
  const { data } = await api.post(`/teams/members/${memberId}/entries`, payload);
  return data.entry;
}

export async function getMemberEntries(
  memberId: string,
  days = 30
): Promise<HappinessEntry[]> {
  const { data } = await api.get(`/teams/members/${memberId}/entries?days=${days}`);
  return data.entries;
}

export async function getCompanyData(days = 30) {
  const { data } = await api.get(`/company/entries?days=${days}`);
  return data.teams as Array<Team & { members: Array<TeamMember & { entries: HappinessEntry[] }> }>;
}
