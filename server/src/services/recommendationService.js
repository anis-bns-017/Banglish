import natural from 'natural';
import User from '../models/User.js';
import Room from '../models/Room.js';

const TfIdf = natural.TfIdf;
const tfidf = new TfIdf();

// Calculate similarity between two text vectors
const calculateSimilarity = (text1, text2) => {
  const vector1 = text1.toLowerCase().split(' ');
  const vector2 = text2.toLowerCase().split(' ');
  
  const set1 = new Set(vector1);
  const set2 = new Set(vector2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
};

// Get user interests from various sources
const getUserInterests = async (userId) => {
  const user = await User.findById(userId);
  
  // Find rooms the user has participated in
  const userRooms = await Room.find({
    $or: [
      { host: userId },
      { 'participants.user': userId }
    ]
  }).select('category tags topics name description');
  
  const interests = new Set();
  
  // Add explicit interests from user profile
  if (user.interests && user.interests.length > 0) {
    user.interests.forEach(i => interests.add(i.toLowerCase()));
  }
  
  // Add from learning languages
  if (user.learningLanguages && user.learningLanguages.length > 0) {
    user.learningLanguages.forEach(l => {
      if (l.language) interests.add(l.language.toLowerCase());
      interests.add('language');
    });
  }
  
  // Add from rooms joined/hosted
  if (userRooms && userRooms.length > 0) {
    userRooms.forEach(room => {
      if (room.category) interests.add(room.category.toLowerCase());
      if (room.tags) room.tags.forEach(tag => interests.add(tag.toLowerCase()));
      if (room.topics) room.topics.forEach(topic => interests.add(topic.toLowerCase()));
      
      // Extract keywords from room name and description
      if (room.name) {
        room.name.toLowerCase().split(' ')
          .filter(word => word.length > 3)
          .forEach(word => interests.add(word));
      }
      if (room.description) {
        room.description.toLowerCase().split(' ')
          .filter(word => word.length > 3)
          .forEach(word => interests.add(word));
      }
    });
  }
  
  // Add native language as interest
  if (user.nativeLanguage) {
    interests.add(user.nativeLanguage.toLowerCase());
  }
  
  return Array.from(interests);
};

// Get personalized room recommendations
export const getRecommendations = async (userId, limit = 10) => {
  try {
    const user = await User.findById(userId);
    if (!user) return [];
    
    const userInterests = await getUserInterests(userId);
    
    // Get recent rooms user interacted with (to exclude them)
    const recentRooms = await Room.find({
      $or: [
        { host: userId },
        { 'participants.user': userId }
      ]
    })
    .sort('-updatedAt')
    .limit(20)
    .select('_id');
    
    const recentRoomIds = recentRooms.map(r => r._id);
    
    // Build query for potential rooms
    const query = {
      _id: { $nin: recentRoomIds },
      isActive: true
    };
    
    // Add interest-based conditions if there are any interests
    if (userInterests.length > 0) {
      query.$or = [
        { category: { $in: userInterests } },
        { tags: { $in: userInterests } }
      ];
      
      // Add language learning condition
      if (user.learningLanguages && user.learningLanguages.length > 0) {
        const targetLanguages = user.learningLanguages.map(l => l.language);
        query.$or.push({ targetLanguages: { $in: targetLanguages } });
      }
    }
    
    const potentialRooms = await Room.find(query)
      .populate('host', 'username fullName avatar level badges isCreator')
      .limit(50);
    
    // Score and rank rooms
    const scoredRooms = potentialRooms.map(room => {
      let score = 0;
      
      // Category match
      if (userInterests.includes(room.category?.toLowerCase())) score += 10;
      
      // Tag matches
      const tagMatches = room.tags?.filter(tag => 
        userInterests.includes(tag.toLowerCase())
      ).length || 0;
      score += tagMatches * 5;
      
      // Topic matches
      const topicMatches = room.topics?.filter(topic => 
        userInterests.includes(topic.toLowerCase())
      ).length || 0;
      score += topicMatches * 3;
      
      // Language match for learning
      if (room.targetLanguages && user.learningLanguages) {
        const userTargetLangs = user.learningLanguages.map(l => l.language);
        const languageMatches = room.targetLanguages.filter(lang => 
          userTargetLangs.includes(lang)
        ).length;
        score += languageMatches * 8;
      }
      
      // Native language match (for language exchange)
      if (user.nativeLanguage && room.targetLanguages?.includes(user.nativeLanguage)) {
        score += 6; // Rooms where you can help others learn your native language
      }
      
      // Popularity boost
      score += (room.participantCount || 0) * 0.5;
      
      // Recent activity boost
      const hoursSinceCreation = (Date.now() - new Date(room.createdAt)) / (1000 * 60 * 60);
      if (hoursSinceCreation < 24) score += 5; // New rooms
      
      // Host reputation boost
      if (room.host?.level > 5) score += 3;
      if (room.host?.badges?.length > 0) score += 2;
      
      return { room, score };
    });
    
    // Sort by score and return top recommendations
    return scoredRooms
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.room);
    
  } catch (error) {
    console.error('Recommendation error:', error);
    return [];
  }
};

// Get trending topics
export const getTrendingTopics = async () => {
  try {
    const rooms = await Room.find({
      isActive: true,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }).select('category tags topics participantCount');
    
    const topicCounts = {};
    const categoryCounts = {};
    const engagementScores = {};
    
    rooms.forEach(room => {
      // Count categories with engagement weighting
      if (room.category) {
        const weight = 1 + (room.participantCount || 0) * 0.1;
        categoryCounts[room.category] = (categoryCounts[room.category] || 0) + weight;
      }
      
      // Count tags with engagement weighting
      if (room.tags && room.tags.length > 0) {
        room.tags.forEach(tag => {
          const weight = 1 + (room.participantCount || 0) * 0.1;
          topicCounts[tag] = (topicCounts[tag] || 0) + weight;
          
          // Track engagement score separately
          engagementScores[tag] = (engagementScores[tag] || 0) + (room.participantCount || 0);
        });
      }
      
      // Count topics with engagement weighting
      if (room.topics && room.topics.length > 0) {
        room.topics.forEach(topic => {
          const weight = 1 + (room.participantCount || 0) * 0.1;
          topicCounts[topic] = (topicCounts[topic] || 0) + weight;
        });
      }
    });
    
    // Sort and format with engagement boost
    const trendingCategories = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, score]) => ({ 
        name, 
        count: Math.round(score),
        rooms: Math.round(score / 1.5) // Approximate room count
      }));
    
    const trendingTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, score]) => ({ 
        name, 
        count: Math.round(score),
        engagement: engagementScores[name] || 0
      }));
    
    return { trendingCategories, trendingTopics };
    
  } catch (error) {
    console.error('Trending topics error:', error);
    return { trendingCategories: [], trendingTopics: [] };
  }
};

// Smart notifications
export const getSmartNotifications = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return [];
    
    const userInterests = await getUserInterests(userId);
    const notifications = [];
    
    // Rooms starting soon that match interests
    const upcomingRooms = await Room.find({
      scheduledFor: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 2 * 60 * 60 * 1000) // Next 2 hours
      },
      $or: userInterests.length > 0 ? [
        { category: { $in: userInterests } },
        { tags: { $in: userInterests } }
      ] : []
    })
    .populate('host', 'username fullName avatar')
    .limit(3);
    
    upcomingRooms.forEach(room => {
      notifications.push({
        type: 'upcoming_room',
        title: `🔔 Room starting soon: ${room.name}`,
        message: `Hosted by ${room.host?.username || 'someone'}`,
        roomId: room._id,
        priority: 'high',
        time: room.scheduledFor,
        icon: '📅'
      });
    });
    
    // Trending rooms in user's interests
    if (userInterests.length > 0) {
      const trendingRooms = await Room.find({
        isActive: true,
        participantCount: { $gt: 10 },
        $or: [
          { category: { $in: userInterests } },
          { tags: { $in: userInterests } }
        ]
      })
      .sort('-participantCount')
      .limit(3)
      .populate('host', 'username');
      
      trendingRooms.forEach(room => {
        notifications.push({
          type: 'trending',
          title: `🔥 Trending: ${room.name}`,
          message: `${room.participantCount} people are in this room`,
          roomId: room._id,
          priority: 'medium',
          icon: '📈'
        });
      });
    }
    
    // Language practice reminders
    if (user.learningLanguages && user.learningLanguages.length > 0) {
      const targetLangs = user.learningLanguages.map(l => l.language);
      
      const practiceRooms = await Room.find({
        isActive: true,
        $or: [
          { targetLanguages: { $in: targetLangs } },
          { category: 'language' }
        ]
      })
      .sort('-participantCount')
      .limit(2);
      
      practiceRooms.forEach(room => {
        const matchedLangs = room.targetLanguages?.filter(lang => 
          targetLangs.includes(lang)
        ) || [];
        
        notifications.push({
          type: 'language',
          title: matchedLangs.length > 0 
            ? `🗣️ Practice ${matchedLangs.join(', ')}`
            : '🗣️ Practice a language',
          message: `Join a language exchange room`,
          roomId: room._id,
          priority: 'low',
          icon: '🌐'
        });
      });
    }
    
    // Rooms hosted by people the user follows
    if (user.following && user.following.length > 0) {
      const followRooms = await Room.find({
        host: { $in: user.following },
        isActive: true,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
      .populate('host', 'username')
      .limit(2);
      
      followRooms.forEach(room => {
        notifications.push({
          type: 'follow',
          title: `👤 ${room.host?.username} started a room`,
          message: room.name,
          roomId: room._id,
          priority: 'medium',
          icon: '👥'
        });
      });
    }
    
    return notifications.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
    
  } catch (error) {
    console.error('Smart notifications error:', error);
    return [];
  }
};

// Get similar users based on interests
export const getSimilarUsers = async (userId, limit = 5) => {
  try {
    const user = await User.findById(userId);
    if (!user) return [];
    
    const userInterests = await getUserInterests(userId);
    
    const similarUsers = await User.find({
      _id: { $ne: userId },
      $or: [
        { interests: { $in: user.interests || [] } },
        { nativeLanguage: { $in: user.learningLanguages?.map(l => l.language) || [] } },
        { learningLanguages: { $elemMatch: { language: user.nativeLanguage } } }
      ]
    })
    .select('username fullName avatar level badges interests nativeLanguage learningLanguages')
    .limit(limit * 2); // Fetch more for scoring
    
    // Score and sort similar users
    const scoredUsers = similarUsers.map(similarUser => {
      let score = 0;
      
      // Shared interests
      const sharedInterests = similarUser.interests?.filter(i => 
        user.interests?.includes(i)
      ).length || 0;
      score += sharedInterests * 10;
      
      // Language learning compatibility
      if (similarUser.nativeLanguage && user.learningLanguages) {
        if (user.learningLanguages.some(l => l.language === similarUser.nativeLanguage)) {
          score += 15; // They can help you learn their native language
        }
      }
      
      if (similarUser.learningLanguages && user.nativeLanguage) {
        if (similarUser.learningLanguages.some(l => l.language === user.nativeLanguage)) {
          score += 15; // You can help them learn your native language
        }
      }
      
      return { user: similarUser, score };
    });
    
    return scoredUsers
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.user);
    
  } catch (error) {
    console.error('Similar users error:', error);
    return [];
  }
};