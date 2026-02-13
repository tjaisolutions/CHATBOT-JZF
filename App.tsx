
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import ConnectionModal from './components/ConnectionModal';
import ContactInfoSidebar from './components/ContactInfoSidebar';
import { COLORS, MOCK_CHATS, MOCK_CONTACTS } from './constants';
import { Message, Chat } from './types';
import { whatsappService } from './services/whatsappService';
import { geminiService } from './services/geminiService';

export const formatWhatsAppDate = (date: Date): string => {
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  const isToday = now.toDateString() === date.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = yesterday.toDateString() === date.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (isYesterday) {
    return 'Ontem';
  } else if (diffInDays < 7) {
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return days[date.getDay()];
  } else {
    return date.toLocaleDateString('pt-BR');
  }
};

const App: React.FC = () => {
  const [activeChatId, setActiveChatId] = useState('gemini-ai');
  const [isConnected, setIsConnected] = useState(() => {
    return localStorage.getItem('whatsapp_connected') === 'true';
  });
  const [showConnectionModal, setShowConnectionModal] = useState(!isConnected);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('whatsapp_unread');
    return saved ? JSON.parse(saved) : { '1': 1 }; 
  });

  const [currentAttendantRole, setCurrentAttendantRole] = useState<string | null>(null);
  const [botDeactivatedChats, setBotDeactivatedChats] = useState<Set<string>>(new Set());

  const [broadcastLists, setBroadcastLists] = useState<Chat[]>(() => {
    const saved = localStorage.getItem('whatsapp_broadcasts');
    return saved ? JSON.parse(saved) : [];
  });

  const [chatsMessages, setChatsMessages] = useState<Record<string, Message[]>>(() => {
    const saved = localStorage.getItem('whatsapp_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach(chatId => {
          parsed[chatId] = parsed[chatId].map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
        });
        return parsed;
      } catch (e) { console.error(e); }
    }
    
    const initialHistory: Record<string, Message[]> = {
      'gemini-ai': [{
        id: '1',
        text: 'Olá! Sou seu assistente Gemini. Como posso ajudar você hoje?',
        sender: 'bot',
        timestamp: new Date(),
        status: 'read'
      }]
    };

    MOCK_CHATS.forEach(chat => {
      if (chat.id !== 'gemini-ai') {
        initialHistory[chat.id] = [{
          id: Date.now().toString() + chat.id,
          text: chat.lastMessage,
          sender: 'user',
          timestamp: new Date(Date.now() - 1000 * 60 * 60),
          status: 'read'
        }];
      }
    });

    return initialHistory;
  });

  const [blockedContactIds, setBlockedContactIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('whatsapp_blocked');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [assignedAttendants, setAssignedAttendants] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('whatsapp_assignments');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Corrected method name to setCallbacks and wrapped the handler in the expected object format
    whatsappService.setCallbacks({
      onMessage: (msg, chatId) => {
        const currentHistory = chatsMessages[chatId] || [];
        handleUpdateMessages(chatId, [...currentHistory, msg]);
      }
    });
  }, [chatsMessages]);

  useEffect(() => {
    localStorage.setItem('whatsapp_history', JSON.stringify(chatsMessages));
  }, [chatsMessages]);

  useEffect(() => {
    localStorage.setItem('whatsapp_assignments', JSON.stringify(assignedAttendants));
  }, [assignedAttendants]);

  useEffect(() => {
    localStorage.setItem('whatsapp_unread', JSON.stringify(unreadCounts));
  }, [unreadCounts]);

  useEffect(() => {
    localStorage.setItem('whatsapp_broadcasts', JSON.stringify(broadcastLists));
  }, [broadcastLists]);

  useEffect(() => {
    localStorage.setItem('whatsapp_connected', String(isConnected));
  }, [isConnected]);

  useEffect(() => {
    if (activeChatId && unreadCounts[activeChatId] > 0) {
      setUnreadCounts(prev => ({ ...prev, [activeChatId]: 0 }));
    }
  }, [activeChatId]);

  const dynamicChatList = useMemo(() => {
    const baseIds = [...MOCK_CHATS.map(c => c.id), ...Object.keys(chatsMessages)];
    const chatIds = new Set(baseIds);
    
    const chats = Array.from(chatIds).map(id => {
      const contact = MOCK_CONTACTS.find(c => c.id === id);
      const history = chatsMessages[id] || [];
      const lastMsg = history[history.length - 1];
      const isBlocked = blockedContactIds.has(id);
      const responsible = assignedAttendants[id];
      const unread = unreadCounts[id] || 0;
      
      return {
        id,
        name: contact?.name || 'Desconhecido',
        avatar: contact?.avatar || `https://picsum.photos/seed/${id}/200`,
        lastMessage: isBlocked ? '🚫 Bloqueado' : (lastMsg?.isDeletedForEveryone ? '🚫 Esta mensagem foi apagada' : (lastMsg?.text || '')),
        lastMessageTime: lastMsg ? formatWhatsAppDate(lastMsg.timestamp) : '',
        unreadCount: unread,
        online: id === 'gemini-ai' && isConnected,
        timestamp: lastMsg?.timestamp || new Date(0),
        isBlocked,
        responsible,
        isBroadcast: false
      };
    });

    const broadcasts = broadcastLists.map(list => {
      const history = chatsMessages[list.id] || [];
      const lastMsg = history[history.length - 1];
      return {
        ...list,
        lastMessage: lastMsg?.text || 'Lista criada',
        lastMessageTime: lastMsg ? formatWhatsAppDate(lastMsg.timestamp) : '',
        timestamp: lastMsg?.timestamp || new Date(0),
        unreadCount: unreadCounts[list.id] || 0,
        isBroadcast: true
      };
    });

    return [...chats, ...broadcasts]
      .filter(chat => {
        if (chat.id === 'gemini-ai') return true;
        if (currentAttendantRole === null) return true;
        return (chat as any).responsible === currentAttendantRole || chat.isBroadcast;
      })
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [chatsMessages, blockedContactIds, assignedAttendants, currentAttendantRole, unreadCounts, broadcastLists, isConnected]);

  const handleUpdateMessages = async (chatId: string, newMessages: Message[]) => {
    const currentHistory = chatsMessages[chatId] || [];
    const lastMsg = newMessages[newMessages.length - 1];
    
    setChatsMessages(prev => {
      const next = { ...prev, [chatId]: newMessages };
      
      const broadcast = broadcastLists.find(l => l.id === chatId);
      if (broadcast) {
        if (lastMsg && lastMsg.sender === 'user') {
          broadcast.memberIds?.forEach(memberId => {
            const memberHistory = next[memberId] || [];
            next[memberId] = [...memberHistory, {
              ...lastMsg,
              id: Date.now().toString() + memberId,
              isBroadcastItem: true
            }];
            if (isConnected) {
              whatsappService.sendMessage(memberId, lastMsg.text || "");
            }
          });
        }
      }
      return next;
    });

    if (lastMsg && lastMsg.sender === 'bot' && chatId !== activeChatId) {
      setUnreadCounts(prev => ({ ...prev, [chatId]: (prev[chatId] || 0) + 1 }));
    }

    if (lastMsg?.sender === 'user' && isConnected && chatId !== 'gemini-ai') {
        if (!botDeactivatedChats.has(chatId) && !assignedAttendants[chatId]) {
            const responseText = await geminiService.sendMessage(lastMsg.text || "");
            const botMsg: Message = {
                id: Date.now().toString(),
                text: responseText,
                sender: 'bot',
                timestamp: new Date(),
                status: 'read'
            };
            handleUpdateMessages(chatId, [...newMessages, botMsg]);
            whatsappService.sendMessage(chatId, responseText);
        }
    }
  };

  const handleAddBroadcast = (name: string, memberIds: string[]) => {
    const id = 'broadcast-' + Date.now();
    const newList: Chat = {
      id,
      name,
      avatar: '', 
      lastMessage: 'Lista de transmissão criada',
      lastMessageTime: '',
      unreadCount: 0,
      online: false,
      isBroadcast: true,
      memberIds
    };
    setBroadcastLists(prev => [...prev, newList]);
    setActiveChatId(id);
  };

  const handleFinalizeChat = (chatId: string) => {
    if (confirm("Deseja finalizar este atendimento?")) {
      const finalMsg = 'Seu atendimento foi finalizado com sucesso. 👋';
      setChatsMessages(prev => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), {
          id: Date.now().toString(),
          text: finalMsg,
          sender: 'bot',
          timestamp: new Date(),
          status: 'read'
        }]
      }));
      if (isConnected) whatsappService.sendMessage(chatId, finalMsg);
      setBotDeactivatedChats(prev => {
        const next = new Set(prev);
        next.delete(chatId);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#f0f2f5]">
        <i className="fab fa-whatsapp text-7xl text-[#922c26] mb-10 animate-pulse"></i>
        <div className="w-64 h-0.5 bg-gray-200 relative overflow-hidden mb-4">
           <div className="absolute h-full bg-[#922c26] animate-[loading_2s_ease-in-out_infinite]"></div>
        </div>
        <h1 className="text-gray-600 font-light text-xl">Iniciando Biblioteca...</h1>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden p-0 md:p-4 lg:px-10 lg:py-4" style={{ backgroundColor: COLORS.background }}>
      <div className="flex-1 max-w-[1600px] mx-auto w-full bg-white shadow-2xl overflow-hidden rounded-none md:rounded-lg flex-col md:flex-row border border-gray-300 relative">
        <div className="absolute top-0 left-0 w-full h-32 z-[-1]" style={{ backgroundColor: COLORS.primary }}></div>
        
        <Sidebar 
          activeChatId={activeChatId} 
          onSelectChat={setActiveChatId}
          onProfileClick={() => setShowConnectionModal(true)}
          isConnected={isConnected}
          dynamicChats={dynamicChatList as any}
          currentRole={currentAttendantRole}
          onChangeRole={setCurrentAttendantRole}
          onAddBroadcast={handleAddBroadcast}
        />
        
        <div className="flex-1 flex overflow-hidden">
          <ChatWindow 
            chatId={activeChatId} 
            messages={chatsMessages[activeChatId] || []}
            allChats={dynamicChatList}
            onUpdateMessages={(msgs) => handleUpdateMessages(activeChatId, msgs)}
            onOpenInfo={() => setShowContactInfo(!showContactInfo)}
            isBlocked={blockedContactIds.has(activeChatId)}
            onFinalizeChat={() => handleFinalizeChat(activeChatId)}
            isTransferred={!!assignedAttendants[activeChatId]}
            assignedTo={assignedAttendants[activeChatId]}
            currentRole={currentAttendantRole}
            botDeactivated={botDeactivatedChats.has(activeChatId)}
            isConnected={isConnected}
          />

          {showContactInfo && (
            <ContactInfoSidebar 
              chatId={activeChatId}
              messages={chatsMessages[activeChatId] || []}
              onClose={() => setShowContactInfo(false)}
              isBlocked={blockedContactIds.has(activeChatId)}
              onToggleBlock={() => {}}
              onReport={() => {}}
              onClearChat={() => {}}
              onFinalizeChat={() => handleFinalizeChat(activeChatId)}
              isTransferred={!!assignedAttendants[activeChatId]}
              assignedTo={assignedAttendants[activeChatId]}
            />
          )}
        </div>

        {showConnectionModal && (
          <ConnectionModal 
            isConnected={isConnected}
            onClose={() => setShowConnectionModal(false)}
            onConnect={() => { 
                setIsConnected(true); 
                setShowConnectionModal(false); 
            }}
            onDisconnect={() => { setIsConnected(false); setShowConnectionModal(false); }}
          />
        )}
      </div>
    </div>
  );
};

export default App;
