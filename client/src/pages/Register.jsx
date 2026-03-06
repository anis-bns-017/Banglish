import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle, Check, Globe, ChevronDown } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    nativeLanguage: '',
    learningLanguages: [],
    interests: []
  });
  
  const [currentLearningLang, setCurrentLearningLang] = useState('');
  const [currentLearningLevel, setCurrentLearningLevel] = useState('beginner');
  const [currentInterest, setCurrentInterest] = useState('');
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Language options (matching your model)
  const languages = [
    'English', 'Bangla', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 
    'Korean', 'Arabic', 'Russian', 'Portuguese', 'Italian', 'Dutch',
    'Polish', 'Turkish', 'Vietnamese', 'Thai', 'Indonesian', 'Hindi',
    'Bengali', 'Urdu', 'Other'
  ];

  const proficiencyLevels = ['beginner', 'intermediate', 'advanced', 'fluent'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const addLearningLanguage = () => {
    if (!currentLearningLang) {
      toast.error('Please select a language');
      return;
    }
    
    if (formData.learningLanguages.some(l => l.language === currentLearningLang)) {
      toast.error('Language already added');
      return;
    }
    
    setFormData({
      ...formData,
      learningLanguages: [
        ...formData.learningLanguages,
        { language: currentLearningLang, level: currentLearningLevel }
      ]
    });
    setCurrentLearningLang('');
    setCurrentLearningLevel('beginner');
  };

  const removeLearningLanguage = (langToRemove) => {
    setFormData({
      ...formData,
      learningLanguages: formData.learningLanguages.filter(
        l => l.language !== langToRemove
      )
    });
  };

  const addInterest = () => {
    if (!currentInterest.trim()) return;
    
    if (formData.interests.includes(currentInterest.trim())) {
      toast.error('Interest already added');
      return;
    }
    
    setFormData({
      ...formData,
      interests: [...formData.interests, currentInterest.trim()]
    });
    setCurrentInterest('');
  };

  const removeInterest = (interestToRemove) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter(i => i !== interestToRemove)
    });
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 20) {
      newErrors.username = 'Username cannot exceed 20 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    } else if (formData.fullName.length > 50) {
      newErrors.fullName = 'Full name cannot exceed 50 characters';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Native language validation (optional but recommended)
    if (!formData.nativeLanguage) {
      newErrors.nativeLanguage = 'Please select your native language (optional)';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    
    // Prepare data matching your model
    const registrationData = {
      ...formData,
      // Remove confirmPassword as it's not in model
      confirmPassword: undefined,
      // Ensure arrays are properly formatted
      learningLanguages: formData.learningLanguages,
      interests: formData.interests,
      // Default values for other fields
      emailVerified: false,
      isActive: true,
      role: 'user',
      xp: 0,
      level: 1,
      badges: [],
      totalRoomsHosted: 0,
      totalRoomsJoined: 0,
      totalSpeakingTime: 0,
      totalListenTime: 0,
      isCreator: false,
      notificationPreferences: {
        newFollowers: true,
        roomReminders: true,
        friendActivity: true,
        recommendations: true
      }
    };

    const result = await register(registrationData);
    setIsLoading(false);

    console.log('Registration result:', result);
    
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-white text-3xl font-bold">H</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200">
            sign in to existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow-xl shadow-indigo-100/50 sm:rounded-xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username *
                </label>
                <div className="mt-1">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      errors.username ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    placeholder="johndoe_123"
                  />
                  {errors.username && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.username}
                    </p>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address *
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    placeholder="john@example.com"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Full Name Field */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <div className="mt-1">
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      errors.fullName ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    placeholder="John Doe"
                  />
                  {errors.fullName && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.fullName}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Password</h3>
              
              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password *
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Password requirements:</h4>
                <ul className="text-xs space-y-1 text-gray-600">
                  <li className="flex items-center gap-2">
                    <span className={`${formData.password.length >= 6 ? 'text-green-500' : 'text-gray-400'}`}>
                      {formData.password.length >= 6 ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <span className="h-3 w-3 rounded-full border border-gray-400 inline-block" />
                      )}
                    </span>
                    At least 6 characters
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={`${/[a-z]/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}`}>
                      {/[a-z]/.test(formData.password) ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <span className="h-3 w-3 rounded-full border border-gray-400 inline-block" />
                      )}
                    </span>
                    One lowercase letter
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={`${/[A-Z]/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}`}>
                      {/[A-Z]/.test(formData.password) ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <span className="h-3 w-3 rounded-full border border-gray-400 inline-block" />
                      )}
                    </span>
                    One uppercase letter
                  </li>
                  <li className="flex items-center gap-2">
                    <span className={`${/\d/.test(formData.password) ? 'text-green-500' : 'text-gray-400'}`}>
                      {/\d/.test(formData.password) ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <span className="h-3 w-3 rounded-full border border-gray-400 inline-block" />
                      )}
                    </span>
                    One number
                  </li>
                </ul>
              </div>
            </div>

            {/* Language Section */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Globe className="h-5 w-5 mr-2 text-indigo-600" />
                Language Preferences
              </h3>
              
              {/* Native Language */}
              <div>
                <label htmlFor="nativeLanguage" className="block text-sm font-medium text-gray-700">
                  Native Language
                </label>
                <div className="mt-1">
                  <select
                    id="nativeLanguage"
                    name="nativeLanguage"
                    value={formData.nativeLanguage}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      errors.nativeLanguage ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  >
                    <option value="">Select your native language</option>
                    {languages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                  {errors.nativeLanguage && (
                    <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.nativeLanguage}
                    </p>
                  )}
                </div>
              </div>

              {/* Languages Learning */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Languages You're Learning
                </label>
                
                {/* Add Language */}
                <div className="flex gap-2 mb-3">
                  <select
                    value={currentLearningLang}
                    onChange={(e) => setCurrentLearningLang(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select language...</option>
                    {languages
                      .filter(l => l !== formData.nativeLanguage && !formData.learningLanguages.some(ll => ll.language === l))
                      .map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                  </select>
                  
                  <select
                    value={currentLearningLevel}
                    onChange={(e) => setCurrentLearningLevel(e.target.value)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {proficiencyLevels.map(level => (
                      <option key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    type="button"
                    onClick={addLearningLanguage}
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
                  >
                    Add
                  </button>
                </div>

                {/* Learning Languages List */}
                <div className="space-y-2">
                  {formData.learningLanguages.map((lang) => (
                    <div key={lang.language} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">{lang.language}</span>
                        <span className="ml-2 text-sm text-gray-500">({lang.level})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLearningLanguage(lang.language)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <AlertCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Interests Section */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Interests</h3>
              
              {/* Add Interest */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentInterest}
                  onChange={(e) => setCurrentInterest(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                  placeholder="Add an interest (e.g., music, tech, gaming)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={addInterest}
                  className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
                >
                  Add
                </button>
              </div>

              {/* Interests List */}
              <div className="flex flex-wrap gap-2">
                {formData.interests.map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                  >
                    {interest}
                    <button
                      type="button"
                      onClick={() => removeInterest(interest)}
                      className="ml-2 text-indigo-600 hover:text-indigo-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-center pt-4">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                required
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                I agree to the{' '}
                <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;