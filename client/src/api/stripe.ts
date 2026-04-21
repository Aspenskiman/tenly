import api from './client';

export type PreAuthTier = 'growth' | 'team';

export interface PreAuthSession {
  tier: string;
  customerEmail: string;
  paid: boolean;
}

export async function createPreAuthCheckoutSession(
  tier: PreAuthTier
): Promise<{ url: string }> {
  const res = await api.post('/stripe/create-checkout-session', { tier });
  return res.data;
}

export async function fetchPreAuthSession(sessionId: string): Promise<PreAuthSession> {
  const res = await api.get(`/stripe/session/${sessionId}`);
  return res.data;
}
