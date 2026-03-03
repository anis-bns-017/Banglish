import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Globe } from 'lucide-react';
import axios from '../utils/axios';
import toast from 'react-hot-toast';

const LanguagePreferences = ({ onClose, onUpdate }) => {
  const [languages, setLanguages] = useState([]);
  const [nativeLanguage, setNativeLanguage] = useState('');
  const [learningLanguages, setLearningLanguages] = useState([]);
  const [selectedLevels, setSelectedLevels] = useState({});
  const [loading, setLoading] = useState(false);

  const languageLevels = ['beginner', 'intermediate', 'advanced', 'fluent'];

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      const response = await axios.get('/languages');
      setLanguages(response.data.languages);
    } catch (error) {
      console.error('Failed to fetch languages:', error);
    }
  };

  const addLearningLanguage = (langCode) => {
    if (!learningLanguages.find(l => l.language === langCode)) {
      setLearningLanguages([
        ...learningLanguages,
        { language: langCode, level: 'beginner' }
      ]);
      setSelectedLevels({
        ...selectedLevels,
        [langCode]: 'beginner'
      });
    }
  };

  const removeLearningLanguage = (langCode) => {
    setLearningLanguages(learningLanguages.filter(l => l.language !== langCode));
    const newLevels = { ...selectedLevels };
    delete newLevels[langCode];
    setSelectedLevels(newLevels);
  };

  const updateLevel = (langCode, level) => {
    setLearningLanguages(learningLanguages.map(l => 
      l.language === langCode ? { ...l, level } : l
    ));
    setSelectedLevels({ ...selectedLevels, [langCode]: level });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nativeLanguage) {
      toast.error('Please select your native language');
      return;
    }

    setLoading(true);
    try {
      await axios.put('/languages/preferences', {
        nativeLanguage,
        learningLanguages
      });
      
      toast.success('Language preferences saved!');
      onUpdate();
      onClose();
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold flex items-center">
            <Globe className="h-5 w-5 mr-2 text-indigo-600" />
            Language Preferences
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Native Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Native Language *
            </label>
            <select
              value={nativeLanguage}
              onChange={(e) => setNativeLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Select your native language</option>
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Languages to Learn */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Languages You're Learning
            </label>
            
            {/* Add Language */}
            <div className="flex gap-2 mb-4">
              <select
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                value=""
                onChange={(e) => addLearningLanguage(e.target.value)}
              >
                <option value="">Add a language...</option>
                {languages
                  .filter(l => l.code !== nativeLanguage && !learningLanguages.find(ll => ll.language === l.code))
                  .map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Learning Languages List */}
            <div className="space-y-3">
              {learningLanguages.map((lang) => {
                const langInfo = languages.find(l => l.code === lang.language);
                return (
                  <div key={lang.language} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium flex-1">{langInfo?.name}</span>
                    <select
                      value={lang.level}
                      onChange={(e) => updateLevel(lang.language, e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      {languageLevels.map(level => (
                        <option key={level} value={level}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeLearningLanguage(lang.language)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {learningLanguages.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                Add languages you want to learn or practice
              </p>
            )}
          </div>

          {/* Language Exchange Info */}
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="font-medium text-indigo-900 mb-2">Language Exchange Tips</h3>
            <ul className="text-sm text-indigo-700 space-y-1">
              <li>• Join rooms with your target language</li>
              <li>• Practice with native speakers</li>
              <li>• Help others learn your language</li>
              <li>• Earn XP for language practice</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center"
            >
              {loading ? 'Saving...' : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LanguagePreferences;