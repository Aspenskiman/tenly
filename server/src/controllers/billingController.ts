import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types/index.js';
import { createCheckoutSession } from '../services/stripeService.js';

const prisma = new PrismaClient();

const FREE_MEMBER_LIMIT = 4;

export async function getPlanStatus(req: AuthRequest, res: Response): Promise<void> {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user!.companyId },
      select: { plan: true, tier: true },
    });
    if (!company) {
      res.status(404).json({ error: 'Company not found' });
      return;
    }
    res.json({
      plan: company.plan,
      tier: company.tier,
      memberLimit: company.plan === 'FREE' ? FREE_MEMBER_LIMIT : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get plan status' });
  }
}

export async function createCheckout(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { plan } = req.body as { plan: 'SOLO' | 'TEAM' };
    if (!['SOLO', 'TEAM'].includes(plan)) {
      res.status(400).json({ error: 'Invalid plan' });
      return;
    }

    const origin = req.headers.origin ?? process.env.CLIENT_URL ?? 'https://tenly-five.vercel.app';

    const session = await createCheckoutSession({
      companyId: req.user!.companyId,
      plan,
      managerId: req.user!.userId,
      successUrl: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/roster`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
