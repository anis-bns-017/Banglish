import express from 'express';
import { body } from 'express-validator';
import {
  getMyProfile,
  updateProfile,
  changePassword,
  getUserProfile,
  updateInterests,
  updateNotifications,
  updateLanguages,
  uploadAvatar,
  getUserStats,
  toggleFollow
} from '../controllers/profileController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import upload from '../middleware/uploadMiddleware.js'; // You'll need to create this

const router = express.Router();

// All profile routes require authentication
router.use(protect);

// Validation rules
const updateProfileValidation = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be 3-20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('fullName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Full name cannot exceed 50 characters'),
  body('bio')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Bio cannot exceed 200 characters'),
  body('creatorBio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Creator bio cannot exceed 500 characters'),
  body('nativeLanguage')
    .optional()
    .isIn(['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Russian', 'Portuguese', 'Italian', 'Dutch', 'Polish', 'Turkish', 'Vietnamese', 'Thai', 'Indonesian', 'Hindi', 'Bengali', 'Urdu', 'Other'])
    .withMessage('Invalid language selection')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
];

const interestsValidation = [
  body('interests')
    .isArray()
    .withMessage('Interests must be an array')
    .custom((interests) => interests.every(i => typeof i === 'string' && i.length <= 30))
    .withMessage('Each interest must be a string less than 30 characters')
];

const notificationsValidation = [
  body('preferences')
    .isObject()
    .withMessage('Preferences must be an object'),
  body('preferences.newFollowers')
    .optional()
    .isBoolean()
    .withMessage('newFollowers must be a boolean'),
  body('preferences.roomReminders')
    .optional()
    .isBoolean()
    .withMessage('roomReminders must be a boolean'),
  body('preferences.friendActivity')
    .optional()
    .isBoolean()
    .withMessage('friendActivity must be a boolean'),
  body('preferences.recommendations')
    .optional()
    .isBoolean()
    .withMessage('recommendations must be a boolean')
];

const languagesValidation = [
  body('nativeLanguage')
    .optional()
    .isIn(['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Russian', 'Portuguese', 'Italian', 'Dutch', 'Polish', 'Turkish', 'Vietnamese', 'Thai', 'Indonesian', 'Hindi', 'Bengali', 'Urdu', 'Other'])
    .withMessage('Invalid native language'),
  body('learningLanguages')
    .optional()
    .isArray()
    .withMessage('learningLanguages must be an array'),
  body('learningLanguages.*.language')
    .optional()
    .isString()
    .withMessage('Language must be a string'),
  body('learningLanguages.*.level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'fluent'])
    .withMessage('Invalid proficiency level')
];

// Basic profile routes
router.get('/me', getMyProfile);
router.put('/me', updateProfileValidation, validate, updateProfile);
router.put('/change-password', changePasswordValidation, validate, changePassword);

// NEW: Interests routes
router.route('/interests')
  .put(interestsValidation, validate, updateInterests)
  .post(interestsValidation, validate, updateInterests); // Support both methods

// NEW: Notification preferences
router.route('/notifications')
  .put(notificationsValidation, validate, updateNotifications)
  .post(notificationsValidation, validate, updateNotifications);

// NEW: Language preferences
router.route('/languages')
  .put(languagesValidation, validate, updateLanguages)
  .post(languagesValidation, validate, updateLanguages);

// NEW: Avatar upload
router.post('/avatar', upload.single('avatar'), uploadAvatar);

// NEW: User stats
router.get('/stats', getUserStats);

// NEW: Follow/Unfollow
router.post('/:userId/follow', toggleFollow);

// Public profile route (keep this last as it uses a parameter)
router.get('/:userId', getUserProfile);

export default router;