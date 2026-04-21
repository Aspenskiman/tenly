# Stripe Pre-Auth Flow — Design Spec
_2026-04-20_

## Overview

Payment-first signup for new company creators. No account exists when the user hits Stripe — account creation happens after payment confirmation. This is a parallel flow to the existing authenticated billing path (`/api/billing/`).

## Architecture

### Backend — new `/api/stripe/` route group (no auth required)

Three endpoints added alongside existing `/api/billing/` routes. Webhook needs its own raw-body parser entry in `index.ts`.

**Files changed/added:**
- `server/src/services/stripeService.ts` — add `createPreAuthCheckoutSession` and `getPreAuthSession`
- `server/src/controllers/stripeController.ts` — new file, three handlers (no auth middleware)
- `server/src/routes/stripe.ts` — new file, mounts endpoints
- `server/src/index.ts` — add raw body parser for `/api/stripe/webhook`, register `/api/stripe` route
- `server/.env` — add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` placeholders (already partially present from existing billing setup)

**Endpoints:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/stripe/create-checkout-session` | none | Creates Stripe Checkout, returns `{ url }` |
| GET | `/api/stripe/session/:sessionId` | none | Retrieves session metadata for pre-fill |
| POST | `/api/stripe/webhook` | none (raw body) | Handles `checkout.session.completed` |

**Pricing:**
- `team`: $40/mo (hardcoded amount, no price ID — uses `price_data`)
- `enterprise`: $75/mo

**Checkout session:**
- `mode: 'subscription'`
- `success_url`: `{origin}/register?session_id={CHECKOUT_SESSION_ID}`
- `cancel_url`: `{origin}/login`
- `metadata`: `{ tier, companyName, teamName }`
- `customer_email` populated from request if provided (optional)

**Session retrieval** (`getPreAuthSession`):
- Calls `stripe.checkout.sessions.retrieve(sessionId)`
- Returns: `{ tier, companyName, teamName, customerEmail, paid }`
- `paid` = `session.payment_status === 'paid'`

**Webhook handler:**
- Verifies signature with `STRIPE_WEBHOOK_SECRET`
- On `checkout.session.completed`: tries to find `User` by `customer_email`; if found, updates `stripe_customer_id` and `stripe_subscription_id`
- If user not found (pre-registration), logs and returns 200 — Phase 3 registration will handle hydration

### Frontend — new pages + Login addition

**Files changed/added:**
- `client/src/api/stripe.ts` — new API client functions
- `client/src/pages/Login.tsx` — add "Setup New Company" divider + button below form (no other changes)
- `client/src/pages/SetupCompany.tsx` — new page, no auth required
- `client/src/pages/Register.tsx` — replaced with session-aware creator registration
- `client/src/App.tsx` — add `/setup-company` route (no `ProtectedRoute`)

**Login addition:** A horizontal divider ("or") below the existing sign-in form, then a full-width ghost button "Setup New Company →" linking to `/setup-company`. Uses `theme` tokens.

**SetupCompany (`/setup-company`):**
- Two tier cards (Team / Enterprise) with price, seat limit, and feature summary
- Selected card highlighted with `theme.accent` border
- Two inputs: Company Name, Team Name (required)
- "Continue to Payment" button — calls `POST /api/stripe/create-checkout-session`, then `window.location.href = url`
- Loading state; error display

**Register (`/register`):**
- Reads `?session_id=` from URL params on mount
- Calls `GET /api/stripe/session/:sessionId`; shows spinner during load
- If `paid !== true`: shows "Payment not confirmed" error state
- Pre-fills Company Name and Team Name as read-only display (not form fields)
- Editable fields: Name, Email, Password (min 8)
- Submit → calls `POST /api/auth/register-creator` (Phase 3 stub: for now `console.log` the payload and show a "✓ Account created" success state)
- Full dark theme matching Login

## Data Flow

```
/setup-company → POST /api/stripe/create-checkout-session
              → Stripe Checkout (external)
              → /register?session_id=XXX
              → GET /api/stripe/session/XXX
              → form submit → POST /api/auth/register-creator (Phase 3)
```

## Constraints

- Do not modify existing `/api/billing/` routes or `billingController.ts`
- Do not modify existing auth flow (`/api/auth/`)
- `stripe` npm package already in `server/package.json`
- Use `theme` tokens from `client/src/lib/theme.ts` for all new screens
- Webhook raw body parser must be registered before `express.json()` in `index.ts`
