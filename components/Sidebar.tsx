
import React, { useState } from 'react';
import { MOCK_CONTACTS, COLORS } from '../constants';
import BroadcastModal from './BroadcastModal';

interface DynamicChat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  online: boolean;
  timestamp: Date;
  responsible?: string;
  isBroadcast?: boolean;
}

interface SidebarProps {
  activeChatId: string;
  onSelectChat: (id: string) => void;
  onProfileClick: () => void;
  isConnected: boolean;
  dynamicChats: DynamicChat[];
  currentRole: string | null;
  onChangeRole: (role: string | null) => void;
  onAddBroadcast?: (name: string, memberIds: string[]) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeChatId, onSelectChat, onProfileClick, isConnected, dynamicChats, currentRole, onChangeRole, onAddBroadcast }) => {
  const [view, setView] = useState<'chats' | 'contacts'>('chats');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  const attendants = ["Patricia Athanazio", "Nathan Daniel", "Maria Fernanda", "João Victor"];

  const filteredChats = dynamicChats.filter(chat => 
    chat.name.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  const filteredContacts = MOCK_CONTACTS.filter(contact => 
    contact.name.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full md:w-[400px] h-full bg-white border-r border-gray-300 relative overflow-hidden">
      {showRoleSelector && (
        <div className="absolute inset-0 z-[100] bg-black/50 flex flex-col justify-end">
          <div className="bg-white rounded-t-2xl p-6 animate-in slide-in-from-bottom duration-300 shadow-2xl">
            <h3 className="text-gray-900 font-bold mb-4">Acessar como:</h3>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => { onChangeRole(null); setShowRoleSelector(false); }}
                className={`p-3 text-left rounded-lg transition-colors font-medium ${!currentRole ? 'bg-[#922c26] text-white' : 'hover:bg-gray-100 text-gray-700'}`}
              >
                Administrador (Ver Tudo)
              </button>
              {attendants.map(name => (
                <button 
                  key={name}
                  onClick={() => { onChangeRole(name); setShowRoleSelector(false); }}
                  className={`p-3 text-left rounded-lg transition-colors font-medium ${currentRole === name ? 'bg-[#922c26] text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                >
                  Atendente: {name}
                </button>
              ))}
              <button onClick={() => setShowRoleSelector(false)} className="mt-4 p-3 text-gray-500 font-bold w-full uppercase text-xs tracking-widest">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showBroadcastModal && onAddBroadcast && (
        <BroadcastModal 
          onClose={() => setShowBroadcastModal(false)} 
          onCreate={(name, ids) => {
            onAddBroadcast(name, ids);
            setShowBroadcastModal(false);
          }}
        />
      )}

      <div className={`flex flex-col h-full transition-transform duration-300 absolute inset-0 z-10 bg-white ${view === 'contacts' ? '-translate-x-full' : 'translate-x-0'}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-300" style={{ backgroundColor: COLORS.sidebarHeader }}>
          <div className="flex items-center gap-3">
            <div className="relative cursor-pointer" onClick={onProfileClick}>
              <img src="https://picsum.photos/seed/myprofile/200" alt="Profile" className="w-10 h-10 rounded-full border border-gray-300" />
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
            <div className="cursor-pointer group" onClick={() => setShowRoleSelector(true)}>
              <p className="text-[10px] text-[#922c26] font-bold uppercase tracking-wider">Acesso</p>
              <p className="text-sm font-bold text-gray-800 truncate max-w-[150px] group-hover:text-[#922c26]">
                {currentRole || 'Administrador'} <i className="fas fa-caret-down ml-1"></i>
              </p>
            </div>
          </div>
          <div className="flex gap-4 text-gray-500 text-xl items-center">
            <button onClick={() => setShowBroadcastModal(true)} title="Nova lista de transmissão" className="hover:text-gray-800 p-2"><i className="fas fa-bullhorn text-lg"></i></button>
            <button onClick={() => setView('contacts')} title="Nova conversa" className="hover:text-gray-800 p-2"><i className="fas fa-comment-alt text-lg"></i></button>
          </div>
        </div>

        <div className="p-2 bg-white border-b border-gray-100">
          <div className="flex items-center bg-[#f0f2f5] rounded-lg px-3 py-2 border border-transparent focus-within:bg-white focus-within:border-gray-200 transition-all">
            <i className="fas fa-search text-gray-400 text-sm mr-4"></i>
            <input 
              type="text" 
              placeholder="Pesquisar conversas..." 
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              style={{ color: '#000000' }}
              className="bg-transparent border-none outline-none text-sm w-full font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-white">
          {filteredChats.map((chat) => (
            <div 
              key={chat.id}
              onClick={() => onSelectChat(chat.id)}
              className={`flex items-center px-3 py-3 cursor-pointer hover:bg-[#f5f6f6] border-b border-gray-50 ${activeChatId === chat.id ? 'bg-[#ebebeb]' : ''}`}
            >
              <div className="relative mr-3">
                {chat.isBroadcast ? (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-[#922c26] border border-gray-100">
                    <i className="fas fa-bullhorn text-xl"></i>
                  </div>
                ) : (
                  <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full border border-gray-100" />
                )}
                {chat.online && !chat.isBroadcast && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h3 className="text-gray-900 font-bold text-[15px] truncate flex items-center gap-2">
                    {chat.isBroadcast && <i className="fas fa-bullhorn text-[10px] text-[#922c26]"></i>}
                    {chat.name}
                  </h3>
                  <span className={`text-[11px] font-medium ${chat.unreadCount > 0 ? 'text-[#922c26] font-bold' : 'text-gray-500'}`}>
                    {chat.lastMessageTime}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-0.5">
                  <p className="text-[13px] text-gray-500 truncate mr-2 flex items-center gap-1 font-medium">
                    {chat.responsible && <span className="text-[9px] bg-[#922c26] text-white px-1 rounded-sm font-bold uppercase">@{chat.responsible.split(' ')[0]}</span>}
                    {chat.lastMessage}
                  </p>
                  {chat.unreadCount > 0 && (
                    <div className="min-w-[20px] h-[20px] rounded-full flex items-center justify-center px-1 shadow-sm" style={{ backgroundColor: COLORS.primary }}>
                      <span className="text-[10px] text-white font-bold">{chat.unreadCount}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredChats.length === 0 && (
            <div className="p-12 text-center text-gray-400">
               <i className="fas fa-comments text-4xl mb-4 opacity-20"></i>
               <p className="text-sm font-medium">Nenhuma conversa encontrada.</p>
            </div>
          )}
        </div>
      </div>

      <div className={`flex flex-col h-full transition-transform duration-300 absolute inset-0 z-20 bg-white ${view === 'contacts' ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-end px-5 py-4 h-[108px] text-white" style={{ backgroundColor: COLORS.primary }}>
          <div className="flex items-center gap-6 w-full">
            <button onClick={() => setView('chats')} className="hover:opacity-80 transition-opacity"><i className="fas fa-arrow-left text-xl"></i></button>
            <h2 className="text-lg font-bold">Nova conversa</h2>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-white">
          {filteredContacts.map((contact) => (
            <div key={contact.id} onClick={() => { onSelectChat(contact.id); setView('chats'); }} className="flex items-center px-4 py-3 cursor-pointer hover:bg-[#f5f6f6] border-b border-gray-50">
              <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full mr-3 border border-gray-100" />
              <div className="flex-1 min-w-0">
                <h3 className="text-gray-900 font-bold truncate">{contact.name}</h3>
                <p className="text-xs text-gray-500 font-medium truncate">{contact.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
