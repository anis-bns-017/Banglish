import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createEvent,
  getEvents,
  rsvpEvent,
  getMyEvents
} from '../controllers/eventController.js';

const router = express.Router();

router.use(protect);

router.post('/', createEvent);
router.get('/', getEvents);
router.get('/my-events', getMyEvents);
router.post('/:eventId/rsvp', rsvpEvent);

export default router;