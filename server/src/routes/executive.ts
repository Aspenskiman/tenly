import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getAllTeams, getCompanyStats, getCompanyManagers } from '../controllers/teamController.js';
import { getCompanyEntries } from '../controllers/entryController.js';

const router = Router();

router.get('/teams', requireAuth, requireRole('executive', 'manager', 'creator'), getAllTeams);
router.get('/entries', requireAuth, requireRole('executive', 'manager'), getCompanyEntries);
router.get('/stats', requireAuth, requireRole('creator'), getCompanyStats);
router.get('/managers', requireAuth, requireRole('creator'), getCompanyManagers);

export default router;
