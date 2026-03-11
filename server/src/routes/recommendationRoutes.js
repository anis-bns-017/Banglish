import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getRoomRecommendations,
  getTrending,
  getNotifications,
  updateInterests
} from '../controllers/recommendationController.js';

const router = express.Router();

router.use(protect);

router.get('/rooms', getRoomRecommendations);
router.get('/trending', getTrending);
router.get('/notifications', getNotifications);
router.post('/update-interests', updateInterests);

export default router;