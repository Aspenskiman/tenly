import api from './client';

export type PreAuthTier = 'growth' | 'team';

export interface PreAuthSession {
  tier: string;
  companyName: string;
  teamName: string;
  customerEmail: string;
  paid: boolean;
}

export async function createPreAuthCheckoutSession(
  tier: PreAuthTier,
  companyName: string,
  teamName: string
): Promise<{ url: string }> {
  const res = await api.post('/stripe/create-checkout-session', {
    tier,
    companyName,
    teamName,
  });
  return res.data;
}

export async function fetchPreAuthSession(sessionId: string): Promise<PreAuthSession> {
  const res = await api.get(`/stripe/session/${sessionId}`);
  return res.data;
}
