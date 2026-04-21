import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createInvite,
  getInvite,
  acceptInvite,
  createInviteSchema,
  acceptInviteSchema,
} from '../controllers/inviteController.js';

const router = Router();

router.post('/', requireAuth, requireRole('creator'), validate(createInviteSchema), createInvite);
router.get('/:token', getInvite);
router.post('/:token/accept', validate(acceptInviteSchema), acceptInvite);

export default router;
