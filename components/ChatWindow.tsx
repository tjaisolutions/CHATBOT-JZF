
import React, { useState, useRef, useEffect } from 'react';
import { Message, Attachment } from '../types';
import { COLORS, MOCK_CONTACTS } from '../constants';
import { geminiService } from '../services/geminiService';
import FilePreviewOverlay from './FilePreviewOverlay';
import EmojiPicker from './EmojiPicker';

interface ChatWindowProps {
  chatId: string;
  messages: Message[];
  allChats?: any[];
  onUpdateMessages: (messages: Message[]) => void;
  onOpenInfo?: () => void;
  isBlocked?: boolean;
  onFinalizeChat?: () => void;
  isTransferred?: boolean;
  assignedTo?: string;
  onSetTransfer?: (attendantName: string | null) => void;
  currentRole?: string | null;
  botDeactivated?: boolean;
  isConnected?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  chatId, messages, allChats, onUpdateMessages, onOpenInfo, isBlocked,
  onFinalizeChat, isTransferred, assignedTo, botDeactivated, isConnected
}) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentChatInfo = allChats?.find(c => c.id === chatId) || MOCK_CONTACTS.find(c => c.id === chatId) || {
    name: 'Contato',
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${chatId}`,
    online: true
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping, chatId]);

  const handleSendMessage = async (text: string, attachment?: Attachment) => {
    if (!isConnected || isBlocked || (!text.trim() && !attachment)) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: new Date(),
      status: 'sent',
      attachment: attachment
    };

    const updatedMessages = [...messages, userMsg];
    onUpdateMessages(updatedMessages);
    setInputText('');

    if (chatId === 'gemini-ai') {
      setIsTyping(true);
      const responseText = await geminiService.sendMessage(text, attachment ? { data: attachment.data || '', mimeType: attachment.type } : undefined);
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'bot',
        timestamp: new Date(),
        status: 'read'
      };
      
      onUpdateMessages([...updatedMessages, botMsg]);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden whatsapp-bg">
      {pendingFile && (
        <FilePreviewOverlay 
          file={pendingFile} 
          onCancel={() => setPendingFile(null)} 
          onSend={(b, c, n, t) => {
            handleSendMessage(c, { name: n, type: t, size: 'Anexo', url: `data:${t};base64,${b}`, data: b });
            setPendingFile(null);
          }} 
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-300 z-30 shadow-sm" style={{ backgroundColor: COLORS.chatHeader }}>
        <div className="flex items-center cursor-pointer flex-1" onClick={onOpenInfo}>
          <img src={currentChatInfo.avatar} alt={currentChatInfo.name} className="w-10 h-10 rounded-full mr-3 border border-gray-200" />
          <div className="flex flex-col">
            <h3 className="text-[#111b21] font-bold text-[15px] flex items-center gap-2">
              {currentChatInfo.name}
              {isTransferred && <span className="text-[10px] bg-[#922c26] text-white px-2 py-0.5 rounded-full font-bold uppercase">@{assignedTo?.split(' ')[0]}</span>}
            </h3>
            <p className="text-[12px] text-gray-500">
              {isTyping ? 'digitando...' : (currentChatInfo.online ? 'online' : 'visto por último')}
            </p>
          </div>
        </div>
        
        <div className="flex gap-4 items-center text-[#54656f]">
          <button className="p-2 hover:bg-black/5 rounded-full"><i className="fas fa-search text-sm"></i></button>
          <button className="p-2 hover:bg-black/5 rounded-full"><i className="fas fa-ellipsis-v text-sm"></i></button>
        </div>
      </div>

      {/* Area de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 md:px-20 flex flex-col gap-1 z-10 pt-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full mb-1 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-2.5 py-1.5 shadow-sm msg-shadow relative ${msg.sender === 'user' ? 'rounded-tr-none' : 'rounded-tl-none'}`} 
                 style={{ backgroundColor: msg.sender === 'user' ? COLORS.userBubble : COLORS.botBubble }}>
               <p className="text-[14.2px] text-[#111b21] leading-tight pr-10 whitespace-pre-wrap">{msg.text}</p>
               <div className="flex items-center justify-end gap-1 mt-1">
                 <span className="text-[10px] text-[#667781]">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                 {msg.sender === 'user' && (
                   <i className={`fas fa-check-double text-[10px] ${msg.status === 'read' ? 'text-[#53bdeb]' : 'text-[#667781]'}`}></i>
                 )}
               </div>
            </div>
          </div>
        ))}
        {isTyping && <div className="text-xs text-gray-500 italic ml-4">Bot está digitando...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`z-20 border-t border-gray-300 relative flex flex-col`} style={{ backgroundColor: COLORS.inputArea }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); }} className="px-4 py-3 flex items-center gap-3">
          <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-[#54656f] text-2xl hover:text-gray-700"><i className="far fa-smile"></i></button>
          <button type="button" className="text-[#54656f] text-2xl hover:text-gray-700" onClick={() => fileInputRef.current?.click()}><i className="fas fa-plus"></i></button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setPendingFile(e.target.files?.[0] || null)} />
          
          <div className="relative flex-1">
            {showEmojiPicker && <EmojiPicker onEmojiSelect={(emoji) => setInputText(prev => prev + emoji)} onClose={() => setShowEmojiPicker(false)} />}
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Digite uma mensagem"
              className="w-full rounded-lg px-4 py-2.5 outline-none text-[15px] bg-white border-none text-[#111b21] placeholder-gray-500"
            />
          </div>
          
          <button 
            type="submit" 
            className="w-11 h-11 flex items-center justify-center rounded-full text-white shadow-md active:scale-95 transition-all"
            style={{ backgroundColor: inputText.trim() ? COLORS.primary : '#54656f' }}
          >
            <i className={`fas ${inputText.trim() ? 'fa-paper-plane' : 'fa-microphone'}`}></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
