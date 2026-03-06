import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getAllTeams } from '../controllers/teamController.js';
import { getCompanyEntries } from '../controllers/entryController.js';

const router = Router();

router.get('/teams', requireAuth, requireRole('executive', 'manager'), getAllTeams);
router.get('/entries', requireAuth, requireRole('executive', 'manager'), getCompanyEntries);

export default router;
