import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getLanguages,
  updateLanguagePreferences,
  translateMessage,
  getLanguageRooms,
  getLanguagePartners
} from '../controllers/languageController.js';

const router = express.Router();

router.use(protect);

router.get('/', getLanguages);
router.put('/preferences', updateLanguagePreferences);
router.post('/translate', translateMessage);
router.get('/rooms', getLanguageRooms);
router.get('/partners', getLanguagePartners);

export default router;