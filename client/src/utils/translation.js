import axios from 'axios';

const TRANSLATION_API = 'https://libretranslate.com/translate';

export const translateText = async (text, targetLang) => {
  try {
    const response = await axios.post(TRANSLATION_API, {
      q: text,
      source: 'auto',
      target: targetLang,
      format: 'text'
    });
    
    return response.data.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original on error
  }
};

export const getLanguageName = (code) => {
  const languages = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    zh: 'Chinese',
    ja: 'Japanese',
    ko: 'Korean',
    ar: 'Arabic',
    ru: 'Russian',
    pt: 'Portuguese',
    it: 'Italian',
    nl: 'Dutch',
    pl: 'Polish',
    tr: 'Turkish',
    vi: 'Vietnamese',
    th: 'Thai',
    id: 'Indonesian',
    hi: 'Hindi',
    bn: 'Bengali',
    ur: 'Urdu'
  };
  return languages[code] || 'English';
};