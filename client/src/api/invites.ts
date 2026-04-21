import api from './client';
import { User } from './auth';

export interface InviteInfo {
  email: string;
  companyName: string;
  teamName: string | null;
  inviterName: string;
}

export interface AcceptResult {
  user: User;
  team: { id: string; name: string } | null;
}

export async function createInvite(email: string, teamId: string): Promise<{ success: boolean }> {
  const { data } = await api.post('/invites', { email, teamId });
  return data;
}

export async function getInvite(token: string): Promise<InviteInfo> {
  const { data } = await api.get(`/invites/${token}`);
  return data;
}

export async function acceptInvite(token: string, name: string, password: string): Promise<AcceptResult> {
  const { data } = await api.post(`/invites/${token}/accept`, { name, password });
  return data;
}
