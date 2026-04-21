import api from './client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'executive' | 'creator';
  companyId: string;
  companyName?: string;
}

export interface RegisterCreatorPayload {
  name: string;
  email: string;
  password: string;
  companyName: string;
  teamName: string;
  sessionId: string;
}

export interface RegisterCreatorResult {
  user: User & { companyName: string };
  company: { id: string; name: string; tier: string; plan: string };
  team: { id: string; name: string };
}

export async function login(email: string, password: string): Promise<User> {
  const { data } = await api.post('/auth/login', { email, password });
  return data.user;
}

export async function register(payload: {
  name: string;
  email: string;
  password: string;
  companyName?: string;
}): Promise<User> {
  const { data } = await api.post('/auth/register', payload);
  return data.user;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export async function getMe(): Promise<User> {
  const { data } = await api.get('/auth/me');
  return data.user;
}

export async function registerCreator(payload: RegisterCreatorPayload): Promise<RegisterCreatorResult> {
  const { data } = await api.post('/auth/register-creator', payload);
  return data;
}
