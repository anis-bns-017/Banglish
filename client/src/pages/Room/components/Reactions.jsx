import React, { useEffect, useState } from 'react';

const Reactions = ({ reactions }) => {
  const [visibleReactions, setVisibleReactions] = useState([]);

  useEffect(() => {
    if (reactions.length > 0) {
      const newReaction = reactions[reactions.length - 1];
      setVisibleReactions(prev => [...prev, newReaction]);
      
      setTimeout(() => {
        setVisibleReactions(prev => prev.filter(r => r.id !== newReaction.id));
      }, 3000);
    }
  }, [reactions]);

  return (
    <div className="fixed inset-0 pointer-events-none">
      {visibleReactions.map((reaction) => (
        <div
          key={reaction.id}
          className="absolute text-4xl animate-float"
          style={{
            left: `${reaction.x || 50}%`,
            bottom: '20%',
            animation: 'float 3s ease-out forwards'
          }}
        >
          {reaction.emoji}
        </div>
      ))}
    </div>
  );
};

export default Reactions;