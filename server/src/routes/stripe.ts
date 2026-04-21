import { Router } from 'express';
import {
  createPreAuthCheckout,
  getSession,
  handlePreAuthWebhook,
} from '../controllers/stripeController.js';

const router = Router();

// No auth — pre-account flow
router.post('/create-checkout-session', createPreAuthCheckout);
router.get('/session/:sessionId', getSession);

// Webhook — raw body (registered before express.json() in index.ts)
router.post('/webhook', handlePreAuthWebhook);

export default router;
