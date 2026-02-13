
import React, { useState } from 'react';
import { MOCK_CONTACTS, COLORS } from '../constants';

interface BroadcastModalProps {
  onClose: () => void;
  onCreate: (name: string, contactIds: string[]) => void;
}

const BroadcastModal: React.FC<BroadcastModalProps> = ({ onClose, onCreate }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');

  const filteredContacts = MOCK_CONTACTS.filter(c => 
    c.id !== 'gemini-ai' && c.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleContact = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleCreate = () => {
    if (selectedIds.size < 2) {
      alert("Selecione pelo menos 2 contatos para criar uma lista de transmissão.");
      return;
    }
    onCreate(name || `Lista de Transmissão (${selectedIds.size})`, Array.from(selectedIds));
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between" style={{ backgroundColor: COLORS.sidebarHeader }}>
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <i className="fas fa-times text-xl"></i>
            </button>
            <h3 className="font-bold text-gray-800">Nova lista de transmissão</h3>
          </div>
          <button 
            disabled={selectedIds.size < 2}
            onClick={handleCreate}
            className={`text-sm font-bold uppercase tracking-wider ${selectedIds.size < 2 ? 'text-gray-300' : 'text-[#922c26]'}`}
          >
            CRIAR
          </button>
        </div>

        <div className="p-4 bg-white space-y-4">
          <div>
            <label className="text-[11px] font-bold text-[#922c26] uppercase tracking-widest mb-1 block">Nome da Lista</label>
            <input 
              type="text" 
              placeholder="Digite o nome (opcional)" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg py-2.5 px-3 outline-none focus:border-[#922c26] text-black font-medium transition-colors bg-white shadow-sm placeholder-gray-400"
            />
          </div>
          
          <div className="flex items-center bg-[#f0f2f5] rounded-lg px-3 py-2.5 border border-transparent focus-within:bg-white focus-within:border-gray-200 transition-all shadow-inner">
            <i className="fas fa-search text-gray-400 text-sm mr-4"></i>
            <input 
              type="text" 
              placeholder="Pesquisar contatos para adicionar" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full font-medium text-black placeholder-gray-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          <p className="px-4 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">Contatos Disponíveis</p>
          {filteredContacts.map(contact => (
            <div 
              key={contact.id}
              onClick={() => toggleContact(contact.id)}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors border-b border-gray-50"
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedIds.has(contact.id) ? 'bg-[#922c26] border-[#922c26]' : 'border-gray-300'}`}>
                {selectedIds.has(contact.id) && <i className="fas fa-check text-[10px] text-white"></i>}
              </div>
              <img src={contact.avatar} className="w-10 h-10 rounded-full border border-gray-100" />
              <div className="flex-1">
                <p className="font-bold text-gray-800 text-sm">{contact.name}</p>
                <p className="text-xs text-gray-500">{contact.status}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
           <p className="text-xs text-gray-600 font-bold">
             {selectedIds.size} de {MOCK_CONTACTS.length - 1} selecionados
           </p>
        </div>
      </div>
    </div>
  );
};

export default BroadcastModal;
