import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { PrismaClient, Tier, Plan } from '@prisma/client';
import { stripe } from '../services/stripeService.js';
import { AuthPayload, AuthRequest } from '../types/index.js';

const prisma = new PrismaClient();

const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(1).max(200).optional(),
  companyId: z.string().uuid().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerCreatorSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  companyName: z.string().min(1).max(200),
  teamName: z.string().min(1).max(200),
  sessionId: z.string().regex(/^cs_[a-zA-Z0-9_]+$/),
});

function makeAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: ACCESS_EXPIRES });
}

function makeRefreshToken(payload: AuthPayload): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });
}

function setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 15 * 60 * 1000, // 15 min
  });
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: REFRESH_EXPIRES_MS,
    path: '/api/auth/refresh',
  });
}

function clearTokenCookies(res: Response) {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
}

function mapStripeTierToDb(metaTier: string): { tier: Tier; plan: Plan } {
  if (metaTier === 'growth') return { tier: Tier.team, plan: Plan.TEAM };
  if (metaTier === 'team') return { tier: Tier.enterprise, plan: Plan.ENTERPRISE };
  return { tier: Tier.free, plan: Plan.FREE };
}

export async function registerCreator(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, companyName, teamName, sessionId } = req.body as z.infer<typeof registerCreatorSchema>;

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      res.status(402).json({ error: 'Payment not completed' });
      return;
    }

    const metaTier = session.metadata?.tier ?? '';
    const { tier, plan } = mapStripeTierToDb(metaTier);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { company, user, team } = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { name: companyName, tier, plan },
      });

      const user = await tx.user.create({
        data: { company_id: company.id, name, email, password_hash, role: 'creator' },
      });

      await tx.company.update({
        where: { id: company.id },
        data: { created_by_user_id: user.id },
      });

      const team = await tx.team.create({
        data: {
          company_id: company.id,
          manager_id: user.id,
          created_by_user_id: user.id,
          name: teamName,
        },
      });

      return { company, user, team };
    });

    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: 'creator',
      companyId: company.id,
    };

    const accessToken = makeAccessToken(payload);
    const refreshToken = makeRefreshToken(payload);

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + REFRESH_EXPIRES_MS),
      },
    });

    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: company.id, companyName: company.name },
      company: { id: company.id, name: company.name, tier, plan },
      team: { id: team.id, name: team.name },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, companyName, companyId } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);
    let resolvedCompanyId: string;

    let userId: string;

    if (companyId) {
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      if (!company) {
        res.status(404).json({ error: 'Company not found' });
        return;
      }
      resolvedCompanyId = company.id;
      const user = await prisma.user.create({
        data: { company_id: resolvedCompanyId, name, email, password_hash, role: 'manager' },
      });
      userId = user.id;
    } else {
      // Create company + user + team atomically so no partial writes on failure
      const defaultName = companyName?.trim() || `${name}'s Team`;
      const result = await prisma.$transaction(async (tx) => {
        const company = await tx.company.create({ data: { name: defaultName } });
        const user = await tx.user.create({
          data: { company_id: company.id, name, email, password_hash, role: 'manager' },
        });
        await tx.team.create({
          data: { company_id: company.id, manager_id: user.id, created_by_user_id: user.id, name: defaultName },
        });
        return { companyId: company.id, userId: user.id };
      });
      resolvedCompanyId = result.companyId;
      userId = result.userId;
    }

    const payload: AuthPayload = { userId, email, role: 'manager', companyId: resolvedCompanyId };
    const accessToken = makeAccessToken(payload);
    const refreshToken = makeRefreshToken(payload);
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await prisma.refreshToken.create({
      data: { user_id: userId, token_hash: tokenHash, expires_at: new Date(Date.now() + REFRESH_EXPIRES_MS) },
    });
    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      user: { id: userId, name, email, role: 'manager', companyId: resolvedCompanyId },
    });
  } catch (err) {
    console.error('[register]', err);
    res.status(500).json({ error: 'Registration failed' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as 'manager' | 'executive' | 'creator',
      companyId: user.company_id,
    };

    const accessToken = makeAccessToken(payload);
    const refreshToken = makeRefreshToken(payload);

    // Store refresh token hash
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + REFRESH_EXPIRES_MS),
      },
    });

    setTokenCookies(res, accessToken, refreshToken);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.company_id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) {
      res.status(401).json({ error: 'No refresh token' });
      return;
    }

    let payload: AuthPayload;
    try {
      payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as AuthPayload;
    } catch {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const stored = await prisma.refreshToken.findUnique({ where: { token_hash: tokenHash } });

    if (!stored || stored.expires_at < new Date()) {
      res.status(401).json({ error: 'Refresh token expired or revoked' });
      return;
    }

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { token_hash: tokenHash } });

    const newPayload: AuthPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      companyId: payload.companyId,
    };

    const newAccessToken = makeAccessToken(newPayload);
    const newRefreshToken = makeRefreshToken(newPayload);

    const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    await prisma.refreshToken.create({
      data: {
        user_id: payload.userId,
        token_hash: newHash,
        expires_at: new Date(Date.now() + REFRESH_EXPIRES_MS),
      },
    });

    setTokenCookies(res, newAccessToken, newRefreshToken);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Token refresh failed' });
  }
}

export async function logout(req: AuthRequest, res: Response): Promise<void> {
  try {
    const token = req.cookies?.refresh_token;
    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await prisma.refreshToken.deleteMany({ where: { token_hash: tokenHash } });
    }
    clearTokenCookies(res);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Logout failed' });
  }
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, role: true, company_id: true, company: { select: { name: true } } },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.company_id, companyName: user.company.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}
