import axios from 'axios';


// Using LibreTranslate (free, open-source)
const TRANSLATION_API = 'https://libretranslate.com/translate';

export const translateText = async (text, targetLang, sourceLang = 'auto') => {
  try {
    const response = await axios.post(TRANSLATION_API, {
      q: text,
      source: sourceLang,
      target: targetLang,
      format: 'text'
    });
    
    return {
      success: true,
      translatedText: response.data.translatedText,
      detectedLanguage: response.data.detectedLanguage
    };
  } catch (error) {
    console.error('Translation error:', error);
    return {
      success: false,
      translatedText: text,
      error: error.message
    };
  }
};

export const getSupportedLanguages = async () => {
  try {
    const response = await axios.get('https://libretranslate.com/languages');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch languages:', error);
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' }
    ];
  }
};