
import React, { useState } from 'react';
import { Message } from '../types';
import { COLORS, MOCK_CONTACTS } from '../constants';

interface ContactInfoSidebarProps {
  chatId: string;
  messages: Message[];
  onClose: () => void;
  isBlocked: boolean;
  onToggleBlock: () => void;
  onReport: () => void;
  onClearChat?: () => void;
  onFinalizeChat?: () => void;
  isTransferred?: boolean;
  assignedTo?: string;
  onSetTransfer?: (attendantName: string | null) => void;
}

const ContactInfoSidebar: React.FC<ContactInfoSidebarProps> = ({ chatId, messages, onClose, isBlocked, onToggleBlock, onReport, onClearChat, onFinalizeChat, isTransferred, assignedTo, onSetTransfer }) => {
  const [showTransferList, setShowTransferList] = useState(false);
  const attendants = ["Patricia Athanazio", "Nathan Daniel", "Maria Fernanda", "João Victor"];

  const contact = MOCK_CONTACTS.find(c => c.id === chatId) || {
    name: 'Desconhecido',
    avatar: `https://picsum.photos/seed/${chatId}/200`,
    status: 'online'
  };

  return (
    <div className="w-full md:w-[400px] h-full bg-[#f0f2f5] border-l border-gray-300 flex flex-col z-[80] animate-in slide-in-from-right duration-300">
      <div className="flex items-center px-4 h-[60px] bg-white border-b border-gray-200">
        <button onClick={onClose} className="p-2 mr-6 text-gray-500 hover:text-gray-700 transition-colors"><i className="fas fa-times text-xl"></i></button>
        <h2 className="text-gray-900 font-bold">Dados do contato</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-white mb-2 p-7 flex flex-col items-center shadow-sm">
          <img src={contact.avatar} alt={contact.name} className="w-48 h-48 rounded-full mb-4 shadow-sm border-2 border-gray-50" />
          <h2 className="text-2xl text-gray-900 font-light text-center">{contact.name}</h2>
          <p className="text-gray-500 mt-1 font-medium">{chatId === 'gemini-ai' ? 'IA Assistant' : '+55 11 99999-9999'}</p>
        </div>

        {isTransferred && (
          <div className="bg-white mb-2 p-5 px-6 shadow-sm border-l-4 border-[#922c26]">
            <p className="text-[10px] text-[#922c26] font-bold uppercase tracking-widest mb-1">Responsável Atual</p>
            <p className="text-gray-900 font-bold text-lg">{assignedTo}</p>
            <div className="flex gap-4 mt-3">
              <button 
                onClick={() => setShowTransferList(!showTransferList)}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                ALTERAR ATENDENTE
              </button>
              <button 
                onClick={() => onSetTransfer?.(null)}
                className="text-xs text-red-600 font-bold hover:underline"
              >
                REMOVER ATRIBUIÇÃO
              </button>
            </div>
            
            {showTransferList && (
              <div className="mt-4 border-t border-gray-100 pt-3 flex flex-col gap-1">
                {attendants.map(name => (
                  <button 
                    key={name}
                    onClick={() => { onSetTransfer?.(name); setShowTransferList(false); }}
                    className="text-left py-2 px-3 hover:bg-gray-50 rounded text-sm text-gray-700 font-medium flex items-center gap-2"
                  >
                    <i className="fas fa-user-circle opacity-30"></i> {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!isTransferred && (
           <div className="bg-white mb-2 p-4 px-6 shadow-sm">
             <button 
               onClick={() => setShowTransferList(!showTransferList)}
               className="w-full py-2 bg-[#922c26] text-white rounded-lg font-bold text-sm hover:bg-[#7a241f] transition-colors"
             >
               ATRIBUIR ATENDENTE
             </button>
             {showTransferList && (
              <div className="mt-4 border-t border-gray-100 pt-3 flex flex-col gap-1">
                {attendants.map(name => (
                  <button 
                    key={name}
                    onClick={() => { onSetTransfer?.(name); setShowTransferList(false); }}
                    className="text-left py-2 px-3 hover:bg-gray-50 rounded text-sm text-gray-700 font-medium flex items-center gap-2"
                  >
                    <i className="fas fa-user-circle opacity-30"></i> {name}
                  </button>
                ))}
              </div>
            )}
           </div>
        )}

        <div className="bg-white p-2 shadow-sm flex flex-col mb-4">
           <button onClick={onFinalizeChat} className="flex items-center gap-6 p-4 px-6 text-[#922c26] hover:bg-red-50 transition-colors">
              <i className="fas fa-check-circle w-5 text-center text-lg"></i>
              <span className="font-bold">Finalizar Atendimento</span>
           </button>
           <button onClick={onToggleBlock} className="flex items-center gap-6 p-4 px-6 text-red-600 hover:bg-gray-50 transition-colors">
              <i className={`fas ${isBlocked ? 'fa-check' : 'fa-ban'} w-5 text-center`}></i>
              <span className="font-bold">{isBlocked ? `Desbloquear Contato` : `Bloquear Contato`}</span>
           </button>
           <button onClick={onClearChat} className="flex items-center gap-6 p-4 px-6 text-red-600 hover:bg-gray-50 transition-colors">
              <i className="fas fa-trash w-5 text-center"></i>
              <span className="font-bold">Limpar mensagens</span>
           </button>
        </div>
      </div>
    </div>
  );
};

export default ContactInfoSidebar;
