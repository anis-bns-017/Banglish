import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getCreatorAnalytics,
  getRoomAnalytics,
  getUserAnalytics,
  getPlatformAnalytics,
  getEngagementMetrics,
  getRevenueAnalytics
} from '../controllers/analyticsController.js';

const router = express.Router();

// All analytics routes require authentication
router.use(protect);

// Creator analytics (for creators and admins)
router.get('/creator', getCreatorAnalytics);
router.get('/room/:roomId', getRoomAnalytics);
router.get('/user/:userId', getUserAnalytics);
router.get('/engagement', getEngagementMetrics);
router.get('/revenue', getRevenueAnalytics);

// Admin only routes
import { adminOnly } from '../middleware/auth.js';
router.get('/platform', adminOnly, getPlatformAnalytics);

export default router;