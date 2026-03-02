import express from 'express';
import { body } from 'express-validator';
import {
  createRoom,
  getRooms,
  getRoomById,
  joinRoom,
  leaveRoom,
  updateRoom,
  deleteRoom,
  moderateRoom
} from '../controllers/roomController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

// All room routes require authentication
router.use(protect);

// Validation rules
const createRoomValidation = [
  body('name')
    .isLength({ min: 3, max: 50 })
    .withMessage('Room name must be 3-50 characters'),
  body('description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
  body('category')
    .isIn(['language', 'music', 'gaming', 'tech', 'social', 'education', 'other'])
    .withMessage('Invalid category'),
  body('isPrivate')
    .optional()
    .isBoolean(),
  body('password')
    .if(body('isPrivate').equals('true'))
    .isLength({ min: 4 })
    .withMessage('Password must be at least 4 characters'),
  body('maxParticipants')
    .optional()
    .isInt({ min: 2, max: 1000 })
    .withMessage('Max participants must be between 2 and 1000'),
  body('tags')
    .optional()
    .isArray()
];

// Routes
router.post('/', createRoomValidation, validate, createRoom);
router.get('/', getRooms);
router.get('/:roomId', getRoomById);
router.post('/:roomId/join', joinRoom);
router.post('/:roomId/leave', leaveRoom);
router.put('/:roomId', updateRoom);
router.delete('/:roomId', deleteRoom);
router.post('/:roomId/moderate', moderateRoom);

export default router;