import { Router } from 'express';
import {
  register,
  registerCreator,
  login,
  logout,
  refresh,
  me,
  registerSchema,
  loginSchema,
  registerCreatorSchema,
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/register-creator', validate(registerCreatorSchema), registerCreator);
router.post('/login', validate(loginSchema), login);
router.post('/logout', requireAuth, logout);
router.post('/refresh', refresh);
router.get('/me', requireAuth, me);

export default router;
