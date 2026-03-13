import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createClub,
  getClubs,
  getClubById,
  joinClub,
  leaveClub,
  approveMember,
  createClubRoom
} from '../controllers/clubController.js';

const router = express.Router();

router.use(protect);

router.post('/', createClub);
router.get('/', getClubs);
router.get('/:clubId', getClubById);
router.post('/:clubId/join', joinClub);
router.post('/:clubId/leave', leaveClub);
router.post('/:clubId/approve/:userId', approveMember);
router.post('/:clubId/rooms', createClubRoom);

export default router;