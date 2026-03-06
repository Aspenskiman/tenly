import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types/index.js';

const prisma = new PrismaClient();

export async function addMember(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { teamId } = req.params;
    const { name, email } = req.body;

    const team = await prisma.team.findFirst({
      where: { id: teamId, manager_id: req.user!.userId },
    });
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const member = await prisma.teamMember.create({
      data: { team_id: teamId, name, email },
    });
    res.status(201).json({ member });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add member' });
  }
}

export async function archiveMember(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { memberId } = req.params;

    const member = await prisma.teamMember.findFirst({
      where: { id: memberId },
      include: { team: true },
    });
    if (!member || member.team.manager_id !== req.user!.userId) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    const updated = await prisma.teamMember.update({
      where: { id: memberId },
      data: { archived_at: new Date() },
    });
    res.json({ member: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to archive member' });
  }
}
