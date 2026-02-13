
export const COLORS = {
  primary: '#922c26',
  secondary: '#efeae2', // Cor de fundo do wallpaper
  white: '#ffffff',
  text: '#111b21',
  textSecondary: '#667781',
  userBubble: '#f7e7e6', // Vinho muito claro para mensagens do usuário
  botBubble: '#ffffff',  
  background: '#dadbd3', 
  sidebarHeader: '#f0f2f5',
  chatHeader: '#f0f2f5',
  inputArea: '#f0f2f5',
  accent: '#922c26'
};

export const MOCK_CHATS = [
  {
    id: 'gemini-ai',
    name: 'Assistente Inteligente',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Gemini',
    lastMessage: 'Olá! Como posso ajudar você hoje?',
    lastMessageTime: '12:45',
    unreadCount: 0,
    online: true,
  },
  {
    id: '1',
    name: 'Suporte Técnico',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Support',
    lastMessage: 'Seu ticket foi atualizado.',
    lastMessageTime: '10:30',
    unreadCount: 0,
    online: true,
  }
];

export const MOCK_CONTACTS = [
  { id: '1', name: 'Suporte Técnico', status: 'Disponível', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Support' },
  { id: 'gemini-ai', name: 'Assistente Inteligente', status: 'IA de triagem', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Gemini' }
];
