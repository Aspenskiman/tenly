import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types/index.js';

const prisma = new PrismaClient();

export async function getMyTeams(req: AuthRequest, res: Response): Promise<void> {
  try {
    const teams = await prisma.team.findMany({
      where: { manager_id: req.user!.userId },
      include: {
        members: {
          where: { archived_at: null },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ teams });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
}

export async function getAllTeams(req: AuthRequest, res: Response): Promise<void> {
  try {
    const teams = await prisma.team.findMany({
      where: { company_id: req.user!.companyId },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        members: {
          where: { archived_at: null },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json({ teams });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
}

export async function createTeam(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name } = req.body;
    const team = await prisma.team.create({
      data: {
        company_id: req.user!.companyId,
        manager_id: req.user!.userId,
        name,
      },
    });
    res.status(201).json({ team });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create team' });
  }
}
