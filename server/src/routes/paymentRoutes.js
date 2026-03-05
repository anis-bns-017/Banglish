import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createTicketIntent,
  createSubscription,
  createDonation,
  applyCreator,
  createConnectAccount,
  getCreatorDashboard,
  requestPayout,
  stripeWebhook
} from '../controllers/paymentController.js';

const router = express.Router();

// Public webhook (no auth)
router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// Protected routes
router.use(protect);

router.post('/create-ticket-intent', createTicketIntent);
router.post('/create-subscription', createSubscription);
router.post('/donate', createDonation);
router.post('/apply-creator', applyCreator);
router.post('/create-connect-account', createConnectAccount);
router.get('/creator-dashboard', getCreatorDashboard);
router.post('/request-payout', requestPayout);

export default router;