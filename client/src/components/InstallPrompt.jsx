import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const InstallPrompt = () => {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Show install prompt
    window.showInstallPrompt = () => {
      setShow(true);
    };

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Show after 30 seconds if not installed
    const timer = setTimeout(() => {
      if (!window.deferredPrompt) return;
      setShow(true);
    }, 30000);

    return () => {
      clearTimeout(timer);
      delete window.showInstallPrompt;
    };
  }, []);

  const handleInstall = async () => {
    if (!window.deferredPrompt) return;

    window.deferredPrompt.prompt();
    const { outcome } = await window.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted install');
    }
    
    window.deferredPrompt = null;
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <span className="text-xl">📱</span>
              </div>
              <div className="ml-3">
                <h3 className="font-semibold">Install App</h3>
                <p className="text-xs text-indigo-100">Get the best experience</p>
              </div>
            </div>
            <button
              onClick={() => setShow(false)}
              className="text-indigo-200 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="space-y-3 mb-4">
            <div className="flex items-center text-sm">
              <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs mr-3">✓</span>
              <span>Install on home screen</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs mr-3">✓</span>
              <span>Use offline</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs mr-3">✓</span>
              <span>Get push notifications</span>
            </div>
          </div>

          <button
            onClick={handleInstall}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center"
          >
            <Download className="h-5 w-5 mr-2" />
            Install App
          </button>
          
          <p className="text-xs text-gray-500 text-center mt-3">
            No app store required. Works offline.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;