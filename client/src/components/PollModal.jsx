import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const PollModal = ({ roomId, onClose, onCreatePoll }) => {
  const [poll, setPoll] = useState({
    question: '',
    options: ['', ''],
    duration: 5
  });

  const addOption = () => {
    setPoll({
      ...poll,
      options: [...poll.options, '']
    });
  };

  const removeOption = (index) => {
    if (poll.options.length > 2) {
      setPoll({
        ...poll,
        options: poll.options.filter((_, i) => i !== index)
      });
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...poll.options];
    newOptions[index] = value;
    setPoll({ ...poll, options: newOptions });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreatePoll(poll);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Create Poll</h3>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Question</label>
            <input
              type="text"
              value={poll.question}
              onChange={(e) => setPoll({ ...poll, question: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Options</label>
            {poll.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 rounded-lg"
                  placeholder={`Option ${index + 1}`}
                  required
                />
                {index >= 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="p-2 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            
            <button
              type="button"
              onClick={addOption}
              className="mt-2 flex items-center text-sm text-indigo-400 hover:text-indigo-300"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Option
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={poll.duration}
              onChange={(e) => setPoll({ ...poll, duration: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 rounded-lg"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700"
            >
              Create Poll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PollModal;