import { Router, Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getPlanStatus, createCheckout } from '../controllers/billingController.js';
import { handleWebhook } from '../services/stripeService.js';

const router = Router();

// Plan status — any authenticated user
router.get('/plan', requireAuth, getPlanStatus);

// Create Stripe checkout session
router.post('/checkout', requireAuth, requireRole('manager'), createCheckout);

// Stripe webhook — raw body required (registered before express.json())
router.post(
  '/webhook',
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    if (!sig) {
      res.status(400).json({ error: 'Missing stripe-signature header' });
      return;
    }
    try {
      const result = await handleWebhook(req.body as Buffer, sig);
      res.json(result);
    } catch (err: any) {
      console.error('[Stripe webhook error]', err.message);
      res.status(400).json({ error: err.message });
    }
  }
);

export default router;
