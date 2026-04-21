import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  stripe,
  createPreAuthCheckoutSession,
  getPreAuthSession,
} from '../services/stripeService.js';

const prisma = new PrismaClient();

export async function createPreAuthCheckout(req: Request, res: Response): Promise<void> {
  try {
    const { tier, companyName, teamName } = req.body as {
      tier: string;
      companyName: string;
      teamName: string;
    };

    if (tier !== 'team' && tier !== 'enterprise') {
      res.status(400).json({ error: 'tier must be "team" or "enterprise"' });
      return;
    }
    if (!companyName?.trim()) {
      res.status(400).json({ error: 'companyName is required' });
      return;
    }
    if (!teamName?.trim()) {
      res.status(400).json({ error: 'teamName is required' });
      return;
    }

    const origin =
      req.headers.origin ??
      process.env.CLIENT_URL ??
      'https://tenly-five.vercel.app';

    const session = await createPreAuthCheckoutSession({
      tier: tier as 'team' | 'enterprise',
      companyName: companyName.trim(),
      teamName: teamName.trim(),
      origin,
    });

    if (!session.url) {
      res.status(500).json({ error: 'Stripe did not return a redirect URL' });
      return;
    }
    res.json({ url: session.url });
  } catch (err) {
    console.error('[createPreAuthCheckout]', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}

export async function getSession(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId } = req.params;
    if (!/^cs_[a-zA-Z0-9_]+$/.test(sessionId)) {
      res.status(400).json({ error: 'Invalid session ID format' });
      return;
    }
    const data = await getPreAuthSession(sessionId);
    res.json(data);
  } catch (err) {
    console.error('[getSession]', err);
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
}

export async function handlePreAuthWebhook(req: Request, res: Response): Promise<void> {
  const sig = req.headers['stripe-signature'] as string;
  if (!sig) {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('[Stripe pre-auth webhook] Signature verification failed:', err.message);
    res.status(400).json({ error: 'Webhook signature verification failed' });
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const sess = event.data.object as any;
    const email: string | undefined =
      sess.customer_details?.email ?? sess.customer_email;

    if (email) {
      try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              stripe_customer_id: String(sess.customer),
              stripe_subscription_id: String(sess.subscription),
            },
          });
          console.log(`[Stripe pre-auth webhook] Updated stripe fields for ${email}`);
        } else {
          console.log(
            `[Stripe pre-auth webhook] No user found for ${email} — will hydrate at registration`
          );
        }
      } catch (dbErr) {
        console.error('[Stripe pre-auth webhook] DB error during user hydration:', dbErr);
      }
    }
  }

  res.json({ received: true });
}
