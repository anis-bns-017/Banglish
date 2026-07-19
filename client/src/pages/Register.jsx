import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  Globe,
  ChevronDown,
  User,
  Mail,
  Lock,
  UserCircle,
  Plus,
  X,
  Sparkles,
  Shield,
  Award,
  MessageCircle,
  Users,
  BookOpen,
  Star,
} from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    fullName: "",
    password: "",
    confirmPassword: "",
    nativeLanguage: "",
    learningLanguages: [],
    interests: [],
  });

  const [currentLearningLang, setCurrentLearningLang] = useState("");
  const [currentLearningLevel, setCurrentLearningLevel] = useState("beginner");
  const [currentInterest, setCurrentInterest] = useState("");

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("basic");
  const [focusedField, setFocusedField] = useState(null);

  // Language options
  const languages = [
    "English",
    "Bengali",
    "Spanish",
    "French",
    "German",
    "Chinese",
    "Japanese",
    "Korean",
    "Arabic",
    "Russian",
    "Portuguese",
    "Italian",
    "Dutch",
    "Polish",
    "Turkish",
    "Vietnamese",
    "Thai",
    "Indonesian",
    "Hindi",
    "Urdu",
    "Other",
  ];

  const proficiencyLevels = ["beginner", "intermediate", "advanced", "fluent"];

  // Interest suggestions
  const interestSuggestions = [
    "Music",
    "Gaming",
    "Technology",
    "Art",
    "Sports",
    "Travel",
    "Cooking",
    "Photography",
    "Reading",
    "Movies",
    "Fitness",
    "Dance",
    "Writing",
    "Design",
    "Programming",
    "Fashion",
    "Nature",
    "Science",
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: "",
      });
    }
  };

  const addLearningLanguage = () => {
    if (!currentLearningLang) {
      toast.error("Please select a language");
      return;
    }

    if (
      formData.learningLanguages.some((l) => l.language === currentLearningLang)
    ) {
      toast.error("Language already added");
      return;
    }

    setFormData({
      ...formData,
      learningLanguages: [
        ...formData.learningLanguages,
        { language: currentLearningLang, level: currentLearningLevel },
      ],
    });
    setCurrentLearningLang("");
    setCurrentLearningLevel("beginner");
  };

  const removeLearningLanguage = (langToRemove) => {
    setFormData({
      ...formData,
      learningLanguages: formData.learningLanguages.filter(
        (l) => l.language !== langToRemove,
      ),
    });
  };

  const addInterest = (interest) => {
    const trimmedInterest = interest.trim();
    if (!trimmedInterest) return;

    if (formData.interests.includes(trimmedInterest)) {
      toast.error("Interest already added");
      return;
    }

    setFormData({
      ...formData,
      interests: [...formData.interests, trimmedInterest],
    });
    setCurrentInterest("");
  };

  const removeInterest = (interestToRemove) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter((i) => i !== interestToRemove),
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (formData.username.length > 20) {
      newErrors.username = "Username cannot exceed 20 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username =
        "Username can only contain letters, numbers, and underscores";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    } else if (formData.fullName.length > 50) {
      newErrors.fullName = "Full name cannot exceed 50 characters";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to first error
      const firstErrorField = document.querySelector(
        '[name="' + Object.keys(newErrors)[0] + '"]',
      );
      if (firstErrorField) {
        firstErrorField.focus();
      }
      return;
    }

    setIsLoading(true);

    const registrationData = {
      ...formData,
      confirmPassword: undefined,
      learningLanguages: formData.learningLanguages,
      interests: formData.interests,
      emailVerified: false,
      isActive: true,
      role: "user",
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
        recommendations: true,
      },
    };

    const result = await register(registrationData);
    setIsLoading(false);

    if (result.success) {
      navigate("/dashboard");
    }
  };

  const renderPasswordStrength = () => {
    const { password } = formData;
    if (!password) return null;

    const checks = [
      password.length >= 6,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
    ];

    const strength = checks.filter(Boolean).length;
    const strengthText =
      ["Very Weak", "Weak", "Fair", "Good", "Strong"][strength] || "";
    const strengthColor =
      ["red", "red", "yellow", "green", "green"][strength] || "";

    return (
      <div className="mt-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 bg-${strengthColor}-500`}
              style={{ width: `${(strength / 4) * 100}%` }}
            />
          </div>
          <span className={`text-xs font-medium text-${strengthColor}-600`}>
            {strengthText}
          </span>
        </div>
      </div>
    );
  };

  const sections = [
    { id: "basic", label: "Basic Info", icon: UserCircle },
    { id: "security", label: "Security", icon: Shield },
    { id: "language", label: "Languages", icon: Globe },
    { id: "interests", label: "Interests", icon: Star },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-50%] right-[-20%] w-[600px] h-[600px] bg-indigo-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-50%] left-[-20%] w-[600px] h-[600px] bg-purple-100/30 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-200/50 mb-4 transition-transform hover:scale-105 duration-300">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Join the Community
          </h2>
          <p className="mt-2 text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors duration-200 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-8 bg-white/80 backdrop-blur-sm py-8 px-4 shadow-2xl shadow-indigo-100/50 sm:rounded-2xl sm:px-10 border border-gray-100/50">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex justify-between items-center relative">
              {sections.map((section, index) => {
                const isActive = activeSection === section.id;
                const isCompleted =
                  index < sections.findIndex((s) => s.id === activeSection);
                const Icon = section.icon;

                return (
                  <React.Fragment key={section.id}>
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className="flex flex-col items-center group"
                    >
                      <div
                        className={`
                        w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                        ${
                          isActive
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110"
                            : isCompleted
                              ? "bg-green-500 text-white"
                              : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                        }
                      `}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`text-xs mt-2 font-medium transition-colors duration-200
                        ${isActive ? "text-indigo-600" : isCompleted ? "text-green-600" : "text-gray-400"}`}
                      >
                        {section.label}
                      </span>
                    </button>
                    {index < sections.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 transition-colors duration-300
                        ${index < sections.findIndex((s) => s.id === activeSection) ? "bg-green-500" : "bg-gray-200"}`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Basic Info Section */}
            {activeSection === "basic" && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <UserCircle className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Basic Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="username"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      Username *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        value={formData.username}
                        onChange={handleChange}
                        onFocus={() => setFocusedField("username")}
                        onBlur={() => setFocusedField(null)}
                        className={`block w-full pl-10 pr-3 py-2.5 border ${
                          errors.username ? "border-red-300" : "border-gray-300"
                        } rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
                        placeholder="johndoe_123"
                      />
                    </div>
                    {errors.username && (
                      <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.username}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      Full Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserCircle className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        autoComplete="name"
                        value={formData.fullName}
                        onChange={handleChange}
                        className={`block w-full pl-10 pr-3 py-2.5 border ${
                          errors.fullName ? "border-red-300" : "border-gray-300"
                        } rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
                        placeholder="John Doe"
                      />
                    </div>
                    {errors.fullName && (
                      <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.fullName}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Email Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-3 py-2.5 border ${
                        errors.email ? "border-red-300" : "border-gray-300"
                      } rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
                      placeholder="john@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveSection("security")}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Continue
                    <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                  </button>
                </div>
              </div>
            )}

            {/* Security Section */}
            {activeSection === "security" && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Security
                  </h3>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-12 py-2.5 border ${
                        errors.password ? "border-red-300" : "border-gray-300"
                      } rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
                      placeholder="Create a strong password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-indigo-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {renderPasswordStrength()}
                  {errors.password && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`block w-full pl-10 pr-12 py-2.5 border ${
                        errors.confirmPassword
                          ? "border-red-300"
                          : "border-gray-300"
                      } rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-indigo-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="flex justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveSection("basic")}
                    className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200"
                  >
                    <ChevronDown className="w-4 h-4 rotate-90" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection("language")}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Continue
                    <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                  </button>
                </div>
              </div>
            )}

            {/* Language Section */}
            {activeSection === "language" && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Globe className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Language Preferences
                  </h3>
                </div>

                <div>
                  <label
                    htmlFor="nativeLanguage"
                    className="block text-sm font-medium text-gray-700 mb-1.5"
                  >
                    Native Language
                  </label>
                  <select
                    id="nativeLanguage"
                    name="nativeLanguage"
                    value={formData.nativeLanguage}
                    onChange={handleChange}
                    className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
                  >
                    <option value="">Select your native language</option>
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                  {errors.nativeLanguage && (
                    <p className="mt-1.5 text-sm text-gray-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.nativeLanguage}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Languages You're Learning
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <select
                      value={currentLearningLang}
                      onChange={(e) => setCurrentLearningLang(e.target.value)}
                      className="flex-1 min-w-[140px] px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                      <option value="">Select language...</option>
                      {languages
                        .filter(
                          (l) =>
                            l !== formData.nativeLanguage &&
                            !formData.learningLanguages.some(
                              (ll) => ll.language === l,
                            ),
                        )
                        .map((lang) => (
                          <option key={lang} value={lang}>
                            {lang}
                          </option>
                        ))}
                    </select>

                    <select
                      value={currentLearningLevel}
                      onChange={(e) => setCurrentLearningLevel(e.target.value)}
                      className="w-36 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                      {proficiencyLevels.map((level) => (
                        <option key={level} value={level}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={addLearningLanguage}
                      className="px-5 py-2.5 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 transition-all duration-200 font-medium"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {formData.learningLanguages.map((lang) => (
                      <div
                        key={lang.language}
                        className="group flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <span className="font-medium text-sm">
                          {lang.language}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({lang.level})
                        </span>
                        <button
                          type="button"
                          onClick={() => removeLearningLanguage(lang.language)}
                          className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveSection("security")}
                    className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200"
                  >
                    <ChevronDown className="w-4 h-4 rotate-90" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection("interests")}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    Continue
                    <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                  </button>
                </div>
              </div>
            )}

            {/* Interests Section */}
            {activeSection === "interests" && (
              <div className="space-y-5 animate-fadeIn">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Star className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Interests
                  </h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Add Your Interests
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentInterest}
                      onChange={(e) => setCurrentInterest(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), addInterest(currentInterest))
                      }
                      placeholder="Type an interest..."
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => addInterest(currentInterest)}
                      className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Interest Suggestions */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    Popular interests
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {interestSuggestions.slice(0, 12).map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => addInterest(interest)}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-indigo-100 hover:text-indigo-700 transition-all duration-200"
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.interests.map((interest) => (
                    <span
                      key={interest}
                      className="group inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 rounded-full"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() => removeInterest(interest)}
                        className="text-indigo-600 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveSection("language")}
                    className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200"
                  >
                    <ChevronDown className="w-4 h-4 rotate-90" />
                    Back
                  </button>
                </div>
              </div>
            )}

            {/* Terms and Submit */}
            <div
              className={`pt-4 border-t border-gray-200 ${activeSection === "interests" ? "block" : "hidden"}`}
            >
              <div className="flex items-start gap-2 mb-6">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  required
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the{" "}
                  <a
                    href="#"
                    className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full relative flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-indigo-200/50"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Creating account...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Join the Community
                  </>
                )}
              </button>

              <p className="mt-4 text-center text-xs text-gray-500">
                By creating an account, you'll join a community of language
                learners from around the world.
              </p>
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Register;
