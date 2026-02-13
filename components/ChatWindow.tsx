
import React, { useState, useRef, useEffect } from 'react';
import { Message, Attachment } from '../types';
import { COLORS, MOCK_CONTACTS } from '../constants';
import { geminiService } from '../services/geminiService';
import { formatWhatsAppDate } from '../App';
import FilePreviewOverlay from './FilePreviewOverlay';
import EmojiPicker from './EmojiPicker';

interface ChatWindowProps {
  chatId: string;
  messages: Message[];
  allChats?: any[];
  onUpdateMessages: (messages: Message[]) => void;
  onEditMessage?: (msgId: string, text: string) => void;
  onDeleteMessage?: (msgId: string, forEveryone: boolean) => void;
  onForwardMessage?: (targetChatId: string, message: Message) => void;
  onForwardMessages?: (targetChatId: string, messages: Message[]) => void;
  onOpenInfo?: () => void;
  isBlocked?: boolean;
  onToggleBlock?: () => void;
  onClearChat?: () => void;
  onFinalizeChat?: () => void;
  isTransferred?: boolean;
  assignedTo?: string;
  onSetTransfer?: (attendantName: string | null) => void;
  currentRole?: string | null;
  botDeactivated?: boolean;
  isConnected?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  chatId, messages, allChats, onUpdateMessages, onEditMessage, onDeleteMessage, 
  onForwardMessage, onOpenInfo, isBlocked, onToggleBlock, onClearChat, onFinalizeChat, 
  isTransferred, assignedTo, onSetTransfer, currentRole, botDeactivated, isConnected
}) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const attendants = ["Patricia Athanazio", "Nathan Daniel", "Maria Fernanda", "João Victor"];

  const currentChatInfo = allChats?.find(c => c.id === chatId) || MOCK_CONTACTS.find(c => c.id === chatId) || {
    name: 'Desconhecido',
    avatar: `https://picsum.photos/seed/${chatId}/200`,
    status: 'online',
    isBroadcast: false
  };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping, chatId]);

  const handleSendMessage = async (text: string, attachment?: Attachment) => {
    if (isBlocked || !isConnected) return;
    if (!text.trim() && !attachment) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: new Date(),
      status: 'sent',
      attachment: attachment,
      replyTo: replyingTo || undefined
    };

    const updatedMessages = [...messages, userMsg];
    onUpdateMessages(updatedMessages);
    setInputText('');
    setReplyingTo(null);

    if (botDeactivated || isTransferred || currentChatInfo.isBroadcast || currentRole !== null) return;

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

      const lowerResp = responseText.toLowerCase();
      if (lowerResp.includes("transferindo")) {
        const selected = attendants.find(name => lowerResp.includes(name.toLowerCase()));
        if (selected) onSetTransfer?.(selected);
      }
    }
  };

  const placeholderText = !isConnected 
    ? "Conecte seu WhatsApp para enviar mensagens" 
    : (currentChatInfo.isBroadcast ? "Mensagem de transmissão..." : (botDeactivated ? "Modo Manual..." : "Mensagem"));

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden" style={{ backgroundColor: COLORS.secondary }}>
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

      {/* Aviso de Desconexão */}
      {!isConnected && (
        <div className="absolute top-[60px] left-0 w-full bg-yellow-100 border-b border-yellow-200 px-4 py-2 flex items-center justify-center gap-2 z-40 text-yellow-800 text-xs font-bold animate-in slide-in-from-top duration-300">
           <i className="fas fa-exclamation-triangle"></i>
           <span>INSTÂNCIA DESCONECTADA. CONECTE SEU WHATSAPP NO PERFIL PARA USAR O CHATBOT.</span>
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-300 z-30 shadow-sm" style={{ backgroundColor: COLORS.chatHeader }}>
        <div className="flex items-center cursor-pointer flex-1" onClick={onOpenInfo}>
          {currentChatInfo.isBroadcast ? (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-[#922c26] mr-3 border border-gray-200">
              <i className="fas fa-bullhorn text-lg"></i>
            </div>
          ) : (
            <img src={currentChatInfo.avatar} alt={currentChatInfo.name} className="w-10 h-10 rounded-full mr-3 border border-gray-200" />
          )}
          <div className="flex flex-col">
            <h3 className="text-gray-900 font-bold text-sm flex items-center gap-2">
              {currentChatInfo.name}
              {isTransferred && <span className="text-[10px] bg-[#922c26] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">@{assignedTo?.split(' ')[0]}</span>}
            </h3>
            <p className="text-[11px] text-gray-500 font-medium">
              {!isConnected ? 'Desconectado' : (isTyping ? 'digitando...' : (isTransferred ? `Em atendimento com ${assignedTo}` : 'online'))}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 items-center text-gray-500 text-lg relative">
          {!currentChatInfo.isBroadcast && isConnected && (
            <button onClick={onFinalizeChat} className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#922c26] text-white rounded-full text-xs font-bold hover:bg-[#7a241f] transition-colors"><i className="fas fa-check-circle"></i><span>FINALIZAR</span></button>
          )}
          <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:text-gray-700"><i className="fas fa-ellipsis-v text-sm"></i></button>
          {showMenu && (
            <div ref={menuRef} className="absolute top-full right-0 mt-1 w-48 bg-white shadow-xl rounded-md py-2 z-50 border border-gray-100">
              <button onClick={() => { onOpenInfo?.(); setShowMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-gray-100">Dados do contato</button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:px-16 flex flex-col gap-1 z-10 pt-20">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full mb-1 group/msg ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`max-w-[85%] rounded-lg px-2.5 py-1.5 shadow-sm relative ${msg.sender === 'user' ? 'rounded-tr-none' : 'rounded-tl-none'}`} style={{ backgroundColor: msg.sender === 'user' ? COLORS.userBubble : COLORS.botBubble }}>
               <p className="text-[14.2px] text-[#111b21] leading-relaxed pr-12 whitespace-pre-wrap">{msg.text}</p>
               <div className="absolute bottom-1 right-1.5 flex items-center gap-1">
                 <span className="text-[10px] text-gray-500">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
               </div>
            </div>
          </div>
        ))}
        {isTyping && <div className="flex justify-start mb-2"><div className="bg-white rounded-lg px-4 py-2 shadow-sm text-xs text-gray-400 font-medium animate-pulse">Digitando...</div></div>}
        <div ref={messagesEndRef} />
      </div>

      <div className={`z-20 border-t border-gray-300 relative flex flex-col ${!isConnected ? 'grayscale opacity-60 pointer-events-none' : ''}`} style={{ backgroundColor: COLORS.inputArea }}>
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); }} className="px-4 py-3 flex items-center gap-3">
          <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-gray-500 text-xl hover:text-gray-700"><i className="far fa-smile"></i></button>
          <div className="relative">
             {showEmojiPicker && <EmojiPicker onEmojiSelect={(emoji) => setInputText(prev => prev + emoji)} onClose={() => setShowEmojiPicker(false)} />}
          </div>
          <button type="button" className="text-gray-500 text-xl hover:text-gray-700" onClick={() => fileInputRef.current?.click()}><i className="fas fa-plus"></i></button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setPendingFile(e.target.files?.[0] || null)} />
          <input 
            type="text" 
            value={inputText}
            disabled={!isConnected}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={placeholderText}
            className="flex-1 rounded-lg px-4 py-2.5 outline-none text-[15px] shadow-sm bg-white font-medium border border-gray-200 text-black placeholder-gray-400 focus:ring-1 focus:ring-[#922c26]"
            style={{ color: '#000000', backgroundColor: '#ffffff' }}
          />
          <button 
            type="submit" 
            disabled={!inputText.trim() || !isConnected}
            className={`w-11 h-11 flex items-center justify-center rounded-full text-white transition-all shadow-md ${!inputText.trim() ? 'opacity-50 grayscale' : 'active:scale-90 hover:opacity-90'}`}
            style={{ backgroundColor: COLORS.primary }}
          >
            <i className={`fas fa-paper-plane`}></i>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
