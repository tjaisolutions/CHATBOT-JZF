
export const COLORS = {
  primary: '#922c26',
  secondary: '#e6e6e6',
  white: '#ffffff',
  text: '#111b21',
  textSecondary: '#667781',
  userBubble: '#fbe9e8', // Tom de vinho bem claro
  botBubble: '#ffffff',  
  background: '#e6e6e6', 
  sidebarHeader: '#f0f2f5',
  chatHeader: '#f0f2f5',
  inputArea: '#f0f2f5',
  accent: '#922c26'
};

export const MOCK_CHATS = [
  {
    id: 'gemini-ai',
    name: 'Assistente Inteligente',
    avatar: 'https://picsum.photos/seed/gemini/200',
    lastMessage: 'Olá! Como posso ajudar você hoje?',
    lastMessageTime: '12:45',
    unreadCount: 0,
    online: true,
  },
  {
    id: '1',
    name: 'Suporte Técnico',
    avatar: 'https://picsum.photos/seed/patricia/200',
    lastMessage: 'Seu ticket foi atualizado.',
    lastMessageTime: '10:30',
    unreadCount: 0,
    online: true,
  }
];

export const MOCK_CONTACTS = [
  { id: '1', name: 'Suporte Técnico', status: 'Disponível', avatar: 'https://picsum.photos/seed/patricia/200' },
  { id: 'gemini-ai', name: 'Assistente Inteligente', status: 'IA de triagem', avatar: 'https://picsum.photos/seed/gemini/200' }
];
