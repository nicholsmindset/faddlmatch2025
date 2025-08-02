import { Database } from './database'

export type Message = Database['public']['Tables']['messages']['Row']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']
export type MessageUpdate = Database['public']['Tables']['messages']['Update']

export type Conversation = Database['public']['Tables']['conversations']['Row']
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert']
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update']

export type MessageType = Database['public']['Enums']['message_type']
export type ModerationStatus = Database['public']['Enums']['moderation_status']

// Composite types
export interface ConversationWithMessages {
  conversation: Conversation
  messages: Message[]
  otherUser: {
    id: string
    firstName: string
    photo?: string
  }
}

export interface MessageWithSender {
  message: Message
  sender: {
    id: string
    firstName: string
    photo?: string
  }
}

export interface ChatMessage {
  id: string
  content: string
  type: MessageType
  senderId: string
  recipientId: string
  sentAt: string
  deliveredAt?: string
  readAt?: string
  moderationStatus: ModerationStatus
  isOwn: boolean
}