# Stripe Pre-Auth Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Payment-first signup path — new company creators pay via Stripe Checkout before their account exists, then land on a pre-filled registration form.

**Architecture:** Three new no-auth backend endpoints under `/api/stripe/` extend the existing `stripeService.ts`. On the frontend, a new `/setup-company` screen drives the Stripe redirect; the existing `/register` route is replaced with a session-aware creator form. No existing routes, auth flow, or billing endpoints are modified.

**Tech Stack:** Express, Stripe SDK v22 (already installed), Prisma, React, TypeScript, Tailwind, `theme.ts` design tokens

---

### Task 1: Add env vars and extend stripeService.ts

**Files:**
- Modify: `server/.env`
- Modify: `server/src/services/stripeService.ts`

- [ ] **Step 1: Add placeholder env vars to server/.env**

Append to `server/.env`:
```
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

- [ ] **Step 2: Add `createPreAuthCheckoutSession` and `getPreAuthSession` to stripeService.ts**

The existing file top stays unchanged. Append these two exported functions after the existing `handleWebhook` export:

```typescript
export async function createPreAuthCheckoutSession({
  tier,
  companyName,
  teamName,
  origin,
}: {
  tier: 'team' | 'enterprise';
  companyName: string;
  teamName: string;
  origin: string;
}) {
  const unitAmount = tier === 'team' ? 4000 : 7500; // $40 / $75 in cents
  const productName = tier === 'team' ? 'Tenly Team' : 'Tenly Enterprise';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: productName },
          unit_amount: unitAmount,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/register?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/login`,
    metadata: { tier, companyName, teamName },
  });

  return session;
}

export async function getPreAuthSession(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['customer_details'],
  });

  const meta = session.metadata ?? {};
  const customerEmail =
    (session as any).customer_details?.email ??
    session.customer_email ??
    '';

  return {
    tier: meta.tier ?? '',
    companyName: meta.companyName ?? '',
    teamName: meta.teamName ?? '',
    customerEmail,
    paid: session.payment_status === 'paid',
  };
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd server && npx tsc --noEmit
```

Expected: no errors (or only pre-existing errors unrelated to stripeService.ts).

- [ ] **Step 4: Commit**

```bash
cd /c/Projects/Tenly
git add server/.env server/src/services/stripeService.ts
git commit -m "feat: add pre-auth stripe checkout and session retrieval functions"
```

---

### Task 2: Create stripeController.ts

**Files:**
- Create: `server/src/controllers/stripeController.ts`

- [ ] **Step 1: Create the controller**

```typescript
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

    res.json({ url: session.url });
  } catch (err) {
    console.error('[createPreAuthCheckout]', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}

export async function getSession(req: Request, res: Response): Promise<void> {
  try {
    const { sessionId } = req.params;
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
    }
  }

  res.json({ received: true });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd server && npx tsc --noEmit
```

Expected: no errors related to stripeController.ts.

- [ ] **Step 3: Commit**

```bash
cd /c/Projects/Tenly
git add server/src/controllers/stripeController.ts
git commit -m "feat: add pre-auth stripe controller (no auth required)"
```

---

### Task 3: Create routes/stripe.ts and wire into index.ts

**Files:**
- Create: `server/src/routes/stripe.ts`
- Modify: `server/src/index.ts`

- [ ] **Step 1: Create the route file**

```typescript
import { Router } from 'express';
import {
  createPreAuthCheckout,
  getSession,
  handlePreAuthWebhook,
} from '../controllers/stripeController.js';

const router = Router();

// No auth — pre-account flow
router.post('/create-checkout-session', createPreAuthCheckout);
router.get('/session/:sessionId', getSession);

// Webhook — raw body (registered before express.json() in index.ts)
router.post('/webhook', handlePreAuthWebhook);

export default router;
```

- [ ] **Step 2: Register raw body parser and route in index.ts**

In `server/src/index.ts`, add two lines. The raw body entry must be **before** `app.use(express.json())`:

```typescript
// After the existing '/api/billing/webhook' raw body line, add:
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
```

And import + register the router after the other route imports:

```typescript
import stripeRoutes from './routes/stripe.js';
// ...
app.use('/api/stripe', stripeRoutes);
```

The full updated `index.ts`:

```typescript
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import teamRoutes from './routes/teams.js';
import executiveRoutes from './routes/executive.js';
import billingRoutes from './routes/billing.js';
import stripeRoutes from './routes/stripe.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startScheduler } from './services/schedulerService.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(
  cors({
    origin: (origin, cb) => {
      if (
        !origin ||
        origin.includes('vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('render.com') ||
        (process.env.CLIENT_URL && origin.startsWith(process.env.CLIENT_URL))
      ) {
        cb(null, true);
      } else {
        cb(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  })
);

// Raw body required for Stripe webhook signature verification
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/company', executiveRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/stripe', stripeRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Tenly server running on port ${PORT}`);
  startScheduler();
});
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd server && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /c/Projects/Tenly
git add server/src/routes/stripe.ts server/src/index.ts
git commit -m "feat: register /api/stripe routes with raw body webhook support"
```

---

### Task 4: Create client/src/api/stripe.ts

**Files:**
- Create: `client/src/api/stripe.ts`

- [ ] **Step 1: Create the API client module**

```typescript
import api from './client';

export type PreAuthTier = 'team' | 'enterprise';

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
```

- [ ] **Step 2: Commit**

```bash
cd /c/Projects/Tenly
git add client/src/api/stripe.ts
git commit -m "feat: add pre-auth stripe API client functions"
```

---

### Task 5: Update Login.tsx — add "Setup New Company" entry point

**Files:**
- Modify: `client/src/pages/Login.tsx`

The only change is adding a divider and button **below** the existing card, between the card and the demo credentials paragraph.

- [ ] **Step 1: Add the divider and button**

Replace the block between the closing `</div>` of the card and the demo paragraph. The full updated return:

```tsx
return (
  <div className="min-h-screen flex items-center justify-center px-4" style={{ background: theme.bg }}>
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black tracking-tight mb-1" style={{ color: theme.accentLt }}>tenly</h1>
        <p className="text-sm" style={{ color: theme.textMid }}>Stop asking "How are you doing?" — start knowing.</p>
      </div>

      <div className="rounded-2xl p-8" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
        <h2 className="text-xl font-semibold text-white mb-6">Sign in</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.textMid }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-white text-sm focus:outline-none"
              style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.textMid }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-white text-sm focus:outline-none"
              style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm px-3 py-2 rounded-xl" style={{ color: '#EF4444', backgroundColor: theme.card, border: `1px solid rgba(239,68,68,0.2)` }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50"
            style={{ backgroundColor: theme.accent, color: '#FFFFFF' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm mt-4" style={{ color: theme.textMid }}>
          No account?{' '}
          <Link to="/register" className="font-medium hover:underline" style={{ color: theme.accentLt }}>
            Register your team
          </Link>
        </p>
      </div>

      {/* Setup new company entry point */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px" style={{ backgroundColor: theme.border }} />
        <span className="text-xs font-medium" style={{ color: theme.textMute }}>or</span>
        <div className="flex-1 h-px" style={{ backgroundColor: theme.border }} />
      </div>

      <button
        onClick={() => navigate('/setup-company')}
        className="w-full py-2.5 rounded-xl font-semibold text-sm transition"
        style={{
          backgroundColor: 'transparent',
          border: `1px solid ${theme.border}`,
          color: theme.textMid,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = theme.accent;
          (e.currentTarget as HTMLButtonElement).style.color = theme.accentLt;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = theme.border;
          (e.currentTarget as HTMLButtonElement).style.color = theme.textMid;
        }}
      >
        Setup New Company →
      </button>

      <p className="text-center text-xs mt-6" style={{ color: theme.textMute }}>
        Demo: manager1@acme.com / password · exec@acme.com / password
      </p>
    </div>
  </div>
);
```

- [ ] **Step 2: Commit**

```bash
cd /c/Projects/Tenly
git add client/src/pages/Login.tsx
git commit -m "feat: add Setup New Company button to Login"
```

---

### Task 6: Create SetupCompany.tsx

**Files:**
- Create: `client/src/pages/SetupCompany.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../lib/theme';
import { createPreAuthCheckoutSession, PreAuthTier } from '../api/stripe';

const TIERS: {
  id: PreAuthTier;
  name: string;
  price: string;
  priceNote: string;
  limit: string;
  features: string[];
}[] = [
  {
    id: 'team',
    name: 'Team',
    price: '$40',
    priceNote: '/month',
    limit: 'Up to 10 teams',
    features: ['Unlimited team members', 'Weekly digest email', 'Score history & trends'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$75',
    priceNote: '/month',
    limit: 'Up to 20 teams',
    features: ['Everything in Team', 'Executive dashboard', 'Company-wide analytics'],
  },
];

export default function SetupCompany() {
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState<PreAuthTier>('team');
  const [companyName, setCompanyName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleContinue() {
    if (!companyName.trim() || !teamName.trim()) {
      setError('Please fill in both Company Name and Team Name.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { url } = await createPreAuthCheckoutSession(selectedTier, companyName.trim(), teamName.trim());
      window.location.href = url;
    } catch {
      setError('Failed to start checkout. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: theme.bg }}>
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/login')}
            className="text-xs mb-4 inline-block"
            style={{ color: theme.textMute }}
          >
            ← Back to sign in
          </button>
          <h1 className="text-4xl font-black tracking-tight mb-1" style={{ color: theme.accentLt }}>tenly</h1>
          <p className="text-sm" style={{ color: theme.textMid }}>Choose a plan to get started.</p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {TIERS.map(tier => {
            const selected = selectedTier === tier.id;
            return (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className="text-left rounded-2xl p-5 transition-all"
                style={{
                  backgroundColor: theme.surface,
                  border: `2px solid ${selected ? theme.accent : theme.border}`,
                  boxShadow: selected ? `0 0 20px ${theme.accent}30` : 'none',
                }}
              >
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: selected ? theme.accentLt : theme.textMute }}>
                  {tier.name}
                </p>
                <div className="flex items-baseline gap-0.5 mb-1">
                  <span className="text-3xl font-black text-white">{tier.price}</span>
                  <span className="text-sm" style={{ color: theme.textMid }}>{tier.priceNote}</span>
                </div>
                <p className="text-xs mb-3" style={{ color: theme.textMute }}>{tier.limit}</p>
                <ul className="space-y-1">
                  {tier.features.map(f => (
                    <li key={f} className="text-xs flex items-start gap-1.5" style={{ color: theme.textMid }}>
                      <span style={{ color: theme.accent }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Inputs */}
        <div className="rounded-2xl p-6 space-y-4" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.textMid }}>Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Acme Corp"
              className="w-full px-3 py-2.5 rounded-xl text-white text-sm focus:outline-none"
              style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.textMid }}>Your Team Name</label>
            <input
              type="text"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder="Product Team"
              className="w-full px-3 py-2.5 rounded-xl text-white text-sm focus:outline-none"
              style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
            />
          </div>

          {error && (
            <p className="text-sm px-3 py-2 rounded-xl" style={{ color: '#EF4444', backgroundColor: theme.card, border: `1px solid rgba(239,68,68,0.2)` }}>
              {error}
            </p>
          )}

          <button
            onClick={handleContinue}
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50"
            style={{ backgroundColor: theme.accent, color: '#FFFFFF' }}
          >
            {loading ? 'Redirecting to payment…' : 'Continue to Payment →'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Projects/Tenly
git add client/src/pages/SetupCompany.tsx
git commit -m "feat: add SetupCompany tier selection and checkout page"
```

---

### Task 7: Replace Register.tsx with session-aware creator form

**Files:**
- Modify: `client/src/pages/Register.tsx`

The existing content is fully replaced. If no `session_id` in URL, the page redirects to `/setup-company`.

- [ ] **Step 1: Replace Register.tsx**

```tsx
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { theme } from '../lib/theme';
import { fetchPreAuthSession, PreAuthSession } from '../api/stripe';

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  const [session, setSession] = useState<PreAuthSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!sessionId) {
      navigate('/setup-company', { replace: true });
      return;
    }

    fetchPreAuthSession(sessionId)
      .then(data => {
        if (!data.paid) {
          setSessionError('Payment not confirmed. Please complete checkout first.');
        } else {
          setSession(data);
          if (data.customerEmail) setEmail(data.customerEmail);
        }
      })
      .catch(() => setSessionError('Could not load your session. Try again or contact support.'))
      .finally(() => setSessionLoading(false));
  }, [sessionId, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSubmitError('');
    setSubmitting(true);

    const payload = {
      name: name.trim(),
      email: email.trim(),
      password,
      companyName: session.companyName,
      teamName: session.teamName,
      tier: session.tier,
      sessionId,
    };

    // Phase 3 will implement POST /api/auth/register-creator
    console.log('[register-creator payload]', payload);

    // Simulate success for now
    await new Promise(r => setTimeout(r, 400));
    setSuccess(true);
    setSubmitting(false);
  }

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.bg }}>
        <p className="text-sm animate-pulse" style={{ color: theme.textMid }}>Loading your session…</p>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: theme.bg }}>
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-black text-white">Payment not confirmed</h1>
          <p className="text-sm" style={{ color: theme.textMid }}>{sessionError}</p>
          <button
            onClick={() => navigate('/setup-company')}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: theme.accent, color: '#fff' }}
          >
            Back to Plans
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: theme.bg }}>
        <div className="w-full max-w-md text-center space-y-3">
          <div className="text-4xl">✓</div>
          <h1 className="text-2xl font-black text-white">Account created!</h1>
          <p className="text-sm" style={{ color: theme.textMid }}>
            Welcome to Tenly, {name}. Your workspace for <strong style={{ color: 'white' }}>{session?.companyName}</strong> is ready.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm mt-2"
            style={{ backgroundColor: theme.accent, color: '#fff' }}
          >
            Sign in →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: theme.bg }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tight mb-1" style={{ color: theme.accentLt }}>tenly</h1>
          <p className="text-sm" style={{ color: theme.textMid }}>Payment confirmed. Create your account.</p>
        </div>

        {/* Session summary (read-only) */}
        <div
          className="rounded-xl px-4 py-3 mb-5 flex items-center justify-between"
          style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
        >
          <div>
            <p className="text-xs font-semibold text-white">{session?.companyName}</p>
            <p className="text-xs" style={{ color: theme.textMute }}>Team: {session?.teamName}</p>
          </div>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
            style={{ backgroundColor: `${theme.accent}20`, color: theme.accentLt, border: `1px solid ${theme.accent}40` }}
          >
            {session?.tier}
          </span>
        </div>

        <div className="rounded-2xl p-8" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
          <h2 className="text-xl font-semibold text-white mb-6">Create your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: theme.textMid }}>Your Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm focus:outline-none"
                style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: theme.textMid }}>Work Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm focus:outline-none"
                style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: theme.textMid }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm focus:outline-none"
                style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
              />
              <p className="text-xs mt-1" style={{ color: theme.textMute }}>Minimum 8 characters</p>
            </div>

            {submitError && (
              <p className="text-sm px-3 py-2 rounded-xl" style={{ color: '#EF4444', backgroundColor: theme.card, border: `1px solid rgba(239,68,68,0.2)` }}>
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50"
              style={{ backgroundColor: theme.accent, color: '#FFFFFF' }}
            >
              {submitting ? 'Creating account…' : 'Create account →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Projects/Tenly
git add client/src/pages/Register.tsx
git commit -m "feat: replace Register with session-aware creator registration form"
```

---

### Task 8: Update App.tsx — add /setup-company route

**Files:**
- Modify: `client/src/App.tsx`

- [ ] **Step 1: Import SetupCompany and add route**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import SetupCompany from './pages/SetupCompany';
import TeamDashboard from './pages/TeamDashboard';
import TeamRoster from './pages/TeamRoster';
import LogScore from './pages/LogScore';
import MemberDashboard from './pages/MemberDashboard';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import WeeklyDigest from './pages/WeeklyDigest';
import BillingSuccess from './pages/BillingSuccess';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'executive' ? '/executive' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/setup-company" element={<SetupCompany />} />

          {/* Manager routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role="manager">
                <TeamDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roster"
            element={
              <ProtectedRoute role="manager">
                <TeamRoster />
              </ProtectedRoute>
            }
          />
          <Route
            path="/log"
            element={
              <ProtectedRoute role="manager">
                <LogScore />
              </ProtectedRoute>
            }
          />
          <Route
            path="/members/:memberId"
            element={
              <ProtectedRoute role="manager">
                <MemberDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/digest"
            element={
              <ProtectedRoute role="manager">
                <WeeklyDigest />
              </ProtectedRoute>
            }
          />

          {/* Executive */}
          <Route
            path="/executive"
            element={
              <ProtectedRoute>
                <ExecutiveDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/billing/success" element={<BillingSuccess />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Projects/Tenly
git add client/src/App.tsx
git commit -m "feat: add /setup-company public route to App"
```

---

### Task 9: Final verification and push

- [ ] **Step 1: TypeScript check on client**

```bash
cd /c/Projects/Tenly/client && npx tsc --noEmit
```

Expected: no errors (existing errors, if any, are pre-existing).

- [ ] **Step 2: TypeScript check on server**

```bash
cd /c/Projects/Tenly/server && npx tsc --noEmit
```

Expected: no errors related to any files touched in this plan.

- [ ] **Step 3: Push to both branches**

```bash
cd /c/Projects/Tenly
git push origin HEAD:main && git push origin HEAD:master
```

Expected: both pushes succeed.
