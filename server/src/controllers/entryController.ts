import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types/index.js';

const prisma = new PrismaClient();

export async function logEntry(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { memberId } = req.params;
    const { score, notes, interaction_date } = req.body;

    const member = await prisma.teamMember.findFirst({
      where: { id: memberId, archived_at: null },
      include: { team: true },
    });
    if (!member || member.team.manager_id !== req.user!.userId) {
      res.status(404).json({ error: 'Team member not found' });
      return;
    }

    const entry = await prisma.happinessEntry.create({
      data: {
        team_member_id: memberId,
        logged_by_user_id: req.user!.userId,
        score,
        notes: notes || null,
        interaction_date: new Date(interaction_date),
      },
    });
    res.status(201).json({ entry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log entry' });
  }
}

export async function getMemberEntries(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { memberId } = req.params;
    const { days = '30' } = req.query;

    const since = new Date();
    since.setDate(since.getDate() - parseInt(days as string, 10));

    const entries = await prisma.happinessEntry.findMany({
      where: {
        team_member_id: memberId,
        interaction_date: { gte: since },
      },
      orderBy: { interaction_date: 'asc' },
    });

    res.json({ entries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
}

export async function getCompanyEntries(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { days = '30' } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days as string, 10));

    const teams = await prisma.team.findMany({
      where: { company_id: req.user!.companyId },
      include: {
        members: {
          where: { archived_at: null },
          include: {
            entries: {
              where: { interaction_date: { gte: since } },
              orderBy: { interaction_date: 'asc' },
            },
          },
        },
        manager: { select: { id: true, name: true } },
      },
    });

    res.json({ teams });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch company entries' });
  }
}
