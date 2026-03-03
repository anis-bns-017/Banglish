import User from '../models/User.js';
import Room from '../models/Room.js';
import { translateText, getSupportedLanguages } from '../services/translationService.js';

// @desc    Get supported languages
// @route   GET /api/languages
export const getLanguages = async (req, res) => {
  try {
    const languages = await getSupportedLanguages();
    res.json({ success: true, languages });
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update user language preferences
// @route   PUT /api/languages/preferences
export const updateLanguagePreferences = async (req, res) => {
  try {
    const { nativeLanguage, learningLanguages } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (nativeLanguage) user.nativeLanguage = nativeLanguage;
    if (learningLanguages) user.learningLanguages = learningLanguages;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Language preferences updated',
      user: {
        nativeLanguage: user.nativeLanguage,
        learningLanguages: user.learningLanguages
      }
    });
  } catch (error) {
    console.error('Update language preferences error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Translate message in room
// @route   POST /api/languages/translate
export const translateMessage = async (req, res) => {
  try {
    const { text, targetLang, sourceLang } = req.body;
    
    const result = await translateText(text, targetLang, sourceLang);
    
    res.json(result);
  } catch (error) {
    console.error('Translate message error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get language learning rooms
// @route   GET /api/languages/rooms
export const getLanguageRooms = async (req, res) => {
  try {
    const { language, level } = req.query;
    
    const query = {
      isActive: true,
      isLanguageExchange: true
    };
    
    if (language) {
      query.targetLanguages = language;
    }
    
    if (level) {
      query.languageLevels = level;
    }
    
    const rooms = await Room.find(query)
      .populate('host', 'username fullName avatar nativeLanguage')
      .sort('-participantCount')
      .limit(20);
    
    res.json({ success: true, rooms });
  } catch (error) {
    console.error('Get language rooms error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get language partners (matching users)
// @route   GET /api/languages/partners
export const getLanguagePartners = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Find users who speak user's target languages and want to learn user's native language
    const partners = await User.find({
      _id: { $ne: req.user.id },
      'learningLanguages.language': user.nativeLanguage,
      nativeLanguage: { $in: user.learningLanguages.map(l => l.language) }
    })
    .select('username fullName avatar nativeLanguage learningLanguages level badges')
    .limit(10);
    
    res.json({ success: true, partners });
  } catch (error) {
    console.error('Get language partners error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};