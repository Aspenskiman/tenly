import { Router } from 'express';
import {
  register,
  login,
  logout,
  refresh,
  me,
  registerSchema,
  loginSchema,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter, refreshLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', requireAuth, logout);
router.post('/refresh', refreshLimiter, refresh);
router.get('/me', requireAuth, me);

export default router;
