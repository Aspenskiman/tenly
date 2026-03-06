import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { getMyTeams, getAllTeams, createTeam } from '../controllers/teamController.js';
import { addMember, archiveMember } from '../controllers/memberController.js';
import { logEntry, getMemberEntries } from '../controllers/entryController.js';

const router = Router();

const createTeamSchema = z.object({ name: z.string().min(1).max(100) });
const addMemberSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
});
const logEntrySchema = z.object({
  score: z.number().int().min(1).max(10),
  notes: z.string().max(500).optional(),
  interaction_date: z.string().datetime().or(z.string().date()),
});

// Manager routes
router.get('/my', requireAuth, requireRole('manager'), getMyTeams);
router.post('/', requireAuth, requireRole('manager'), validate(createTeamSchema), createTeam);

// Members
router.post('/:teamId/members', requireAuth, requireRole('manager'), validate(addMemberSchema), addMember);
router.delete('/members/:memberId', requireAuth, requireRole('manager'), archiveMember);

// Entries
router.post('/members/:memberId/entries', requireAuth, requireRole('manager'), validate(logEntrySchema), logEntry);
router.get('/members/:memberId/entries', requireAuth, getMemberEntries);

export default router;
