import Stripe from 'stripe';
import { PrismaClient, Plan } from '@prisma/client';

const prisma = new PrismaClient();

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
});

export const PRICE_IDS: Record<string, string> = {
  SOLO: process.env.STRIPE_SOLO_PRICE_ID!,
  TEAM: process.env.STRIPE_TEAM_PRICE_ID!,
};

export async function createCheckoutSession({
  companyId,
  plan,
  managerId,
  successUrl,
  cancelUrl,
}: {
  companyId: string;
  plan: 'SOLO' | 'TEAM';
  managerId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const priceId = PRICE_IDS[plan];
  if (!priceId) throw new Error(`No price ID for plan: ${plan}`);

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) throw new Error('Company not found');

  // Create or reuse Stripe customer
  let customerId = company.stripe_customer_id ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { companyId, managerId },
    });
    customerId = customer.id;
    await prisma.company.update({
      where: { id: companyId },
      data: { stripe_customer_id: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { companyId, plan },
    subscription_data: {
      metadata: { companyId, plan },
    },
  });

  return session;
}

export async function handleWebhook(payload: Buffer, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    throw new Error(`Webhook signature verification failed: ${err}`);
  }

  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'customer.subscription.updated'
  ) {
    const obj = event.data.object as Stripe.Checkout.Session | Stripe.Subscription;
    const metadata = obj.metadata ?? {};
    const companyId = metadata.companyId;
    const plan = metadata.plan as Plan | undefined;

    if (companyId && plan && Object.values(Plan).includes(plan)) {
      const subscriptionId =
        event.type === 'checkout.session.completed'
          ? (obj as Stripe.Checkout.Session).subscription as string
          : (obj as Stripe.Subscription).id;

      await prisma.company.update({
        where: { id: companyId },
        data: {
          plan,
          stripe_subscription_id: subscriptionId,
        },
      });
      console.log(`[Stripe] Company ${companyId} upgraded to ${plan}`);
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    const companyId = sub.metadata?.companyId;
    if (companyId) {
      await prisma.company.update({
        where: { id: companyId },
        data: { plan: Plan.FREE, stripe_subscription_id: null },
      });
      console.log(`[Stripe] Company ${companyId} downgraded to FREE (subscription cancelled)`);
    }
  }

  return { received: true };
}
