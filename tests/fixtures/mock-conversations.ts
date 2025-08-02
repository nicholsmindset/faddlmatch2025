/**
 * Mock Conversations Data
 * Predefined conversations and messages for testing
 */

export interface MockMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: string;
  islamicCompliant: boolean;
  guardianApproved: boolean;
  messageType: 'text' | 'image' | 'system' | 'guidance';
  status: 'sent' | 'delivered' | 'read' | 'pending' | 'queued';
  moderationFlags?: string[];
}

export interface MockConversation {
  id: string;
  participants: string[];
  guardianOversight: boolean;
  islamicCompliant: boolean;
  status: 'active' | 'paused' | 'terminated' | 'pending_approval';
  createdAt: string;
  lastActivity: string;
  guardianNotes?: string;
  complianceScore: number;
}

/**
 * Standard test conversations
 */
export const mockConversations: MockConversation[] = [
  {
    id: 'test-conversation-1',
    participants: ['test-user-1', 'test-user-2'],
    guardianOversight: true,
    islamicCompliant: true,
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    lastActivity: '2024-01-20T14:30:00Z',
    guardianNotes: 'Both families are satisfied with the progress.',
    complianceScore: 95
  },
  {
    id: 'test-conversation-2',
    participants: ['test-user-1', 'test-user-3'],
    guardianOversight: true,
    islamicCompliant: true,
    status: 'paused',
    createdAt: '2024-01-10T09:00:00Z',
    lastActivity: '2024-01-18T16:45:00Z',
    guardianNotes: 'Temporary pause for family consultation.',
    complianceScore: 88
  },
  {
    id: 'test-conversation-pending',
    participants: ['test-user-pending', 'test-user-2'],
    guardianOversight: true,
    islamicCompliant: true,
    status: 'pending_approval',
    createdAt: '2024-01-22T11:00:00Z',
    lastActivity: '2024-01-22T11:05:00Z',
    complianceScore: 92
  }
];

/**
 * Standard test messages for various scenarios
 */
export const mockMessages: MockMessage[] = [
  // Test Conversation 1 Messages
  {
    id: 'message-1',
    conversationId: 'test-conversation-1',
    senderId: 'test-user-1',
    content: 'Assalamu Alaikum sister, how are you today?',
    timestamp: '2024-01-20T10:00:00Z',
    islamicCompliant: true,
    guardianApproved: true,
    messageType: 'text',
    status: 'read'
  },
  {
    id: 'message-2',
    conversationId: 'test-conversation-1',
    senderId: 'test-user-2',
    content: 'Wa alaikum assalam brother, Alhamdulillah I am well. How was your day?',
    timestamp: '2024-01-20T10:05:00Z',
    islamicCompliant: true,
    guardianApproved: true,
    messageType: 'text',
    status: 'read'
  },
  {
    id: 'message-3',
    conversationId: 'test-conversation-1',
    senderId: 'test-user-1',
    content: 'Alhamdulillah, it was blessed. I attended Maghrib prayer at the mosque.',
    timestamp: '2024-01-20T10:10:00Z',
    islamicCompliant: true,
    guardianApproved: true,
    messageType: 'text',
    status: 'read'
  },
  {
    id: 'message-4',
    conversationId: 'test-conversation-1',
    senderId: 'test-user-2',
    content: 'That\'s wonderful. I believe involving our families would be the next step.',
    timestamp: '2024-01-20T10:15:00Z',
    islamicCompliant: true,
    guardianApproved: true,
    messageType: 'text',
    status: 'read'
  },
  {
    id: 'guardian-guidance-1',
    conversationId: 'test-conversation-1',
    senderId: 'system',
    content: 'Guardian guidance: Remember to keep conversations respectful and family-appropriate.',
    timestamp: '2024-01-20T10:20:00Z',
    islamicCompliant: true,
    guardianApproved: true,
    messageType: 'guidance',
    status: 'delivered'
  },

  // Test Conversation 2 Messages (Paused conversation)
  {
    id: 'message-5',
    conversationId: 'test-conversation-2',
    senderId: 'test-user-1',
    content: 'As-salamu alaikum, I hope you and your family are in good health.',
    timestamp: '2024-01-18T15:00:00Z',
    islamicCompliant: true,
    guardianApproved: true,
    messageType: 'text',
    status: 'read'
  },
  {
    id: 'message-6',
    conversationId: 'test-conversation-2',
    senderId: 'test-user-3',
    content: 'Wa alaikum as-salam, yes Alhamdulillah we are all well.',
    timestamp: '2024-01-18T15:05:00Z',
    islamicCompliant: true,
    guardianApproved: true,
    messageType: 'text',
    status: 'read'
  },
  {
    id: 'system-pause-1',
    conversationId: 'test-conversation-2',
    senderId: 'system',
    content: 'Conversation has been paused by guardian for family consultation.',
    timestamp: '2024-01-18T16:45:00Z',
    islamicCompliant: true,
    guardianApproved: true,
    messageType: 'system',
    status: 'delivered'
  },

  // Pending conversation messages
  {
    id: 'message-pending-1',
    conversationId: 'test-conversation-pending',
    senderId: 'test-user-pending',
    content: 'Assalamu Alaikum, I would like to get to know you better.',
    timestamp: '2024-01-22T11:05:00Z',
    islamicCompliant: true,
    guardianApproved: false,
    messageType: 'text',
    status: 'pending'
  }
];

/**
 * Generate Islamic compliant test messages
 */
export const generateIslamicMessages = (conversationId: string, senderId: string, count: number = 5): MockMessage[] => {
  const islamicMessages = [
    'Assalamu Alaikum, how are you today?',
    'Alhamdulillah, I had a blessed day.',
    'May Allah guide us in making the right decisions.',
    'I pray that our families will be pleased with this process.',
    'InshaAllah we can arrange a meeting with our families.',
    'Barakallahu feeki for your thoughtful response.',
    'I believe Islamic values should guide our conversations.',
    'May Allah bless both our families.',
    'I appreciate your commitment to Islamic principles.',
    'Let us seek Allah\'s guidance through Istikhara.'
  ];

  const messages: MockMessage[] = [];
  
  for (let i = 0; i < count; i++) {
    messages.push({
      id: `generated-message-${conversationId}-${i}`,
      conversationId,
      senderId,
      content: islamicMessages[i % islamicMessages.length],
      timestamp: new Date(Date.now() + i * 300000).toISOString(), // 5 minutes apart
      islamicCompliant: true,
      guardianApproved: true,
      messageType: 'text',
      status: 'delivered'
    });
  }
  
  return messages;
};

/**
 * Generate problematic test messages for moderation testing
 */
export const generateProblematicMessages = (conversationId: string, senderId: string): MockMessage[] => {
  const problematicContent = [
    {
      content: 'Can we meet alone without our families knowing?',
      flags: ['inappropriate_meeting_request', 'family_exclusion']
    },
    {
      content: 'Send me your photos without hijab.',
      flags: ['inappropriate_content', 'privacy_violation']
    },
    {
      content: 'I don\'t think we need guardian approval for this.',
      flags: ['guardian_avoidance', 'islamic_non_compliance']
    },
    {
      content: 'Let\'s exchange personal contact information.',
      flags: ['private_contact_exchange']
    }
  ];

  return problematicContent.map((item, index) => ({
    id: `problematic-message-${conversationId}-${index}`,
    conversationId,
    senderId,
    content: item.content,
    timestamp: new Date(Date.now() + index * 60000).toISOString(),
    islamicCompliant: false,
    guardianApproved: false,
    messageType: 'text' as const,
    status: 'pending' as const,
    moderationFlags: item.flags
  }));
};

/**
 * Generate guardian guidance messages
 */
export const generateGuardianGuidance = (conversationId: string): MockMessage[] => {
  const guidanceMessages = [
    'Remember to maintain Islamic etiquette in your conversations.',
    'Family involvement is encouraged in the getting-to-know process.',
    'Please keep discussions appropriate and respectful.',
    'Consider arranging a family meeting for the next step.',
    'Islamic marriage is a blessed union - seek Allah\'s guidance.'
  ];

  return guidanceMessages.map((content, index) => ({
    id: `guidance-${conversationId}-${index}`,
    conversationId,
    senderId: 'system',
    content: `Guardian guidance: ${content}`,
    timestamp: new Date(Date.now() + index * 3600000).toISOString(), // 1 hour apart
    islamicCompliant: true,
    guardianApproved: true,
    messageType: 'guidance' as const,
    status: 'delivered' as const
  }));
};

/**
 * Get messages for a specific conversation
 */
export const getMessagesForConversation = (conversationId: string): MockMessage[] => {
  return mockMessages.filter(message => message.conversationId === conversationId);
};

/**
 * Get conversations for a specific user
 */
export const getConversationsForUser = (userId: string): MockConversation[] => {
  return mockConversations.filter(conversation => 
    conversation.participants.includes(userId)
  );
};

/**
 * Get pending conversations for guardian approval
 */
export const getPendingConversations = (): MockConversation[] => {
  return mockConversations.filter(conversation => 
    conversation.status === 'pending_approval'
  );
};

/**
 * Generate conversation analytics data
 */
export const generateConversationAnalytics = (conversationId: string) => {
  const messages = getMessagesForConversation(conversationId);
  const conversation = mockConversations.find(c => c.id === conversationId);
  
  if (!conversation) return null;

  const totalMessages = messages.length;
  const islamicCompliantMessages = messages.filter(m => m.islamicCompliant).length;
  const guardianApprovedMessages = messages.filter(m => m.guardianApproved).length;
  const flaggedMessages = messages.filter(m => m.moderationFlags && m.moderationFlags.length > 0).length;

  return {
    conversationId,
    totalMessages,
    complianceRate: totalMessages > 0 ? (islamicCompliantMessages / totalMessages) * 100 : 100,
    approvalRate: totalMessages > 0 ? (guardianApprovedMessages / totalMessages) * 100 : 100,
    flaggedMessages,
    averageResponseTime: '15 minutes', // Simulated
    lastActivity: conversation.lastActivity,
    participantEngagement: {
      [conversation.participants[0]]: Math.floor(totalMessages * 0.6),
      [conversation.participants[1]]: Math.floor(totalMessages * 0.4)
    }
  };
};

/**
 * Load testing conversation data generator
 */
export const generateLoadTestConversations = (userCount: number): MockConversation[] => {
  const conversations: MockConversation[] = [];
  
  for (let i = 0; i < userCount / 2; i++) {
    conversations.push({
      id: `load-test-conversation-${i}`,
      participants: [`load-test-user-${i * 2}`, `load-test-user-${i * 2 + 1}`],
      guardianOversight: true,
      islamicCompliant: true,
      status: 'active',
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastActivity: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      complianceScore: 85 + Math.floor(Math.random() * 15) // 85-100
    });
  }
  
  return conversations;
};