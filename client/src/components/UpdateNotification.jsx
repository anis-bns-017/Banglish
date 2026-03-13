import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

const UpdateNotification = () => {
  const [show, setShow] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    // Expose function to show notification when update is available
    window.showUpdateNotification = () => {
      setShow(true);
    };

    // Listen for service worker updates
    navigator.serviceWorker?.addEventListener('controllerchange', () => {
      window.location.reload();
    });

    return () => {
      delete window.showUpdateNotification;
    };
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setShow(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="bg-indigo-600 text-white rounded-lg shadow-xl p-4 max-w-md">
        <div className="flex items-start">
          <div className="flex-1">
            <h3 className="font-semibold flex items-center">
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Update Available
            </h3>
            <p className="text-sm text-indigo-100 mt-1">
              A new version is ready. Refresh to get the latest features.
            </p>
            <button
              onClick={handleUpdate}
              className="mt-3 px-4 py-2 bg-white text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors"
            >
              Update Now
            </button>
          </div>
          <button
            onClick={() => setShow(false)}
            className="ml-4 text-indigo-200 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;