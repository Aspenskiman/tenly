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

export async function updateTeam(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, managerId } = req.body as { name?: string; managerId?: string };

    const team = await prisma.team.findFirst({
      where: { id, company_id: req.user!.companyId },
    });
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const data: { name?: string; manager_id?: string } = {};
    if (name !== undefined) data.name = name;
    if (managerId !== undefined) {
      const manager = await prisma.user.findFirst({
        where: { id: managerId, company_id: req.user!.companyId, role: 'manager' },
      });
      if (!manager) {
        res.status(404).json({ error: 'Manager not found' });
        return;
      }
      data.manager_id = managerId;
    }

    const updated = await prisma.team.update({
      where: { id },
      data,
      include: { manager: { select: { id: true, name: true, email: true } } },
    });

    res.json({ team: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update team' });
  }
}

export async function getCompanyStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const companyId = req.user!.companyId;

    const [teamCount, managerCount, memberCount, pendingInviteCount] = await Promise.all([
      prisma.team.count({ where: { company_id: companyId } }),
      prisma.user.count({ where: { company_id: companyId, role: 'manager' } }),
      prisma.teamMember.count({
        where: { team: { company_id: companyId }, archived_at: null },
      }),
      prisma.invite.count({ where: { company_id: companyId, accepted_at: null } }),
    ]);

    res.json({ teamCount, managerCount, memberCount, pendingInviteCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

export async function getCompanyManagers(req: AuthRequest, res: Response): Promise<void> {
  try {
    const managers = await prisma.user.findMany({
      where: { company_id: req.user!.companyId, role: 'manager' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
    res.json({ managers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch managers' });
  }
}

export async function createTeam(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name } = req.body;
    const team = await prisma.team.create({
      data: {
        company_id: req.user!.companyId,
        manager_id: req.user!.userId,
        created_by_user_id: req.user!.userId,
        name,
      },
    });
    res.status(201).json({ team });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create team' });
  }
}
