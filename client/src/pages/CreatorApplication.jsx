import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Instagram, Twitter, Youtube, Globe, Send } from 'lucide-react';
import axios from '../utils/axios';
import toast from 'react-hot-toast';

const CreatorApplication = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    bio: '',
    whyCreator: '',
    socialLinks: {
      instagram: '',
      twitter: '',
      youtube: '',
      website: ''
    },
    experience: '',
    sampleRoom: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post('/payments/apply-creator', formData);
      toast.success('Application submitted successfully!');
      navigate('/profile');
    } catch (error) {
      toast.error('Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <div className="flex items-center mb-6">
              <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">Become a Creator</h1>
                <p className="text-gray-600">Start monetizing your content</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Creator Bio *
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Tell us about yourself and your content..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why do you want to become a creator? *
                </label>
                <textarea
                  value={formData.whyCreator}
                  onChange={(e) => setFormData({ ...formData, whyCreator: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Share your motivation and goals..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Experience
                </label>
                <textarea
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Any relevant experience in content creation, hosting, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sample Room Link (Optional)
                </label>
                <input
                  type="url"
                  value={formData.sampleRoom}
                  onChange={(e) => setFormData({ ...formData, sampleRoom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="https://yourapp.com/room/123"
                />
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Social Links</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Instagram className="h-5 w-5 text-gray-400 mr-2" />
                    <input
                      type="url"
                      value={formData.socialLinks.instagram}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialLinks: { ...formData.socialLinks, instagram: e.target.value }
                      })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Instagram URL"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <Twitter className="h-5 w-5 text-gray-400 mr-2" />
                    <input
                      type="url"
                      value={formData.socialLinks.twitter}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialLinks: { ...formData.socialLinks, twitter: e.target.value }
                      })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Twitter URL"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <Youtube className="h-5 w-5 text-gray-400 mr-2" />
                    <input
                      type="url"
                      value={formData.socialLinks.youtube}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialLinks: { ...formData.socialLinks, youtube: e.target.value }
                      })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="YouTube URL"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <Globe className="h-5 w-5 text-gray-400 mr-2" />
                    <input
                      type="url"
                      value={formData.socialLinks.website}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialLinks: { ...formData.socialLinks, website: e.target.value }
                      })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Personal Website"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Our team will review your application within 2-3 business days</li>
                  <li>• You'll receive an email notification once approved</li>
                  <li>• After approval, you can set up your Stripe account for payouts</li>
                  <li>• Start creating monetized rooms and earning!</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorApplication;