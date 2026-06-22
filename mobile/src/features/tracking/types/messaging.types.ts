// ============================================================
// Messaging Types
// ============================================================

export type MessageSender = "USER" | "DRIVER";

export interface Conversation {
  id: string;
  orderId: string;
  userId: string;
  driverId: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderType: MessageSender;
  senderId: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface SendMessageRequest {
  body: string;
}
