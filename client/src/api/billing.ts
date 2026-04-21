import api from './client';

export type Plan = 'FREE' | 'SOLO' | 'TEAM' | 'COMPANY' | 'ENTERPRISE';
export type Tier = 'free' | 'solo' | 'team' | 'enterprise';

export interface PlanStatus {
  plan: Plan;
  tier: Tier;
  memberLimit: number | null;
}

export async function getPlanStatus(): Promise<PlanStatus> {
  const res = await api.get('/billing/plan');
  return res.data;
}

export async function createCheckoutSession(plan: 'SOLO' | 'TEAM'): Promise<{ url: string }> {
  const res = await api.post('/billing/checkout', { plan });
  return res.data;
}
