
export interface Attachment {
  name: string;
  type: string;
  size: string;
  url: string;
  data?: string; // base64 data for Gemini
}

export interface Message {
  id: string;
  text?: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  attachment?: Attachment;
  isEdited?: boolean;
  replyTo?: Message;
  isDeletedForEveryone?: boolean;
  reactions?: string[];
  isBroadcastItem?: boolean; // Identifica se a mensagem veio de uma lista
}

export interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  online: boolean;
  isBroadcast?: boolean;
  memberIds?: string[];
}
