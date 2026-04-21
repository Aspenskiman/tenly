import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { AuthPayload, AuthRequest } from '../types/index.js';
import { sendInviteEmail } from '../services/emailService.js';

const prisma = new PrismaClient();

const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

export const createInviteSchema = z.object({
  email: z.string().email(),
  teamId: z.string().cuid().or(z.string().uuid()),
});

export const acceptInviteSchema = z.object({
  name: z.string().min(1).max(100),
  password: z.string().min(8),
});

function setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: REFRESH_EXPIRES_MS,
    path: '/api/auth/refresh',
  });
}

export async function createInvite(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { email, teamId } = req.body as z.infer<typeof createInviteSchema>;
    const creatorId = req.user!.userId;
    const companyId = req.user!.companyId;

    const team = await prisma.team.findFirst({
      where: { id: teamId, company_id: companyId },
    });
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const existing = await prisma.invite.findFirst({
      where: { email, team_id: teamId, accepted_at: null },
    });
    if (existing) {
      res.status(409).json({ error: 'An invite for this email and team is already pending' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');

    await prisma.invite.create({
      data: { company_id: companyId, team_id: teamId, email, token },
    });

    const [company, inviter] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId }, select: { name: true } }),
      prisma.user.findUnique({ where: { id: creatorId }, select: { name: true } }),
    ]);

    const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:5173';
    await sendInviteEmail({
      toEmail: email,
      companyName: company?.name ?? 'Tenly',
      inviterName: inviter?.name ?? 'Your team admin',
      inviteUrl: `${clientUrl}/invite/${token}`,
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send invite' });
  }
}

export async function getInvite(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.params;

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        company: { select: { name: true, created_by: { select: { name: true } } } },
        team: { select: { name: true } },
      },
    });

    if (!invite || invite.accepted_at !== null) {
      res.status(404).json({ error: 'Invite not found or already accepted' });
      return;
    }

    res.json({
      email: invite.email,
      companyName: invite.company.name,
      teamName: invite.team?.name ?? null,
      inviterName: invite.company.created_by?.name ?? 'Tenly Admin',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load invite' });
  }
}

export async function acceptInvite(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.params;
    const { name, password } = req.body as z.infer<typeof acceptInviteSchema>;

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: { team: true },
    });

    if (!invite || invite.accepted_at !== null) {
      res.status(404).json({ error: 'Invite not found or already accepted' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email: invite.email } });
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);

    const { user, team } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          company_id: invite.company_id,
          name,
          email: invite.email,
          password_hash,
          role: 'manager',
        },
      });

      let team = invite.team;
      if (invite.team_id) {
        team = await tx.team.update({
          where: { id: invite.team_id },
          data: { manager_id: user.id },
        });
      }

      await tx.invite.update({
        where: { token },
        data: { accepted_at: new Date() },
      });

      return { user, team };
    });

    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: 'manager',
      companyId: user.company_id,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: ACCESS_EXPIRES });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });

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
      user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.company_id },
      team: team ? { id: team.id, name: team.name } : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to accept invite' });
  }
}
