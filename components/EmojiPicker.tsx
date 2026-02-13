
import React, { useState, useMemo } from 'react';
import { COLORS } from '../constants';

interface EmojiItem {
  char: string;
  name: string;
}

interface Category {
  name: string;
  icon: string;
  emojis: EmojiItem[];
}

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_DATA: Category[] = [
  { 
    name: 'Smileys', 
    icon: 'far fa-smile', 
    emojis: [
      { char: '😀', name: 'sorriso feliz alegre' }, { char: '😃', name: 'sorriso boca aberta' }, { char: '😄', name: 'sorriso olhos fechados' },
      { char: '😁', name: 'sorriso dentes' }, { char: '😅', name: 'suor frio risada' }, { char: '🤣', name: 'rolando de rir' },
      { char: '😂', name: 'chorando de rir' }, { char: '🙂', name: 'sorriso leve' }, { char: '🙃', name: 'rosto invertido' },
      { char: '😉', name: 'piscada' }, { char: '😊', name: 'sorriso corado' }, { char: '😇', name: 'anjo inocente' },
      { char: '🥰', name: 'apaixonado coracoes' }, { char: '😍', name: 'olhos de coracao' }, { char: '🤩', name: 'estrela nos olhos' },
      { char: '😘', name: 'beijo coracao' }, { char: '😗', name: 'beijo' }, { char: '😚', name: 'beijo olhos fechados' },
      { char: '😋', name: 'delicia lingua' }, { char: '😛', name: 'lingua para fora' }, { char: '😜', name: 'piscada lingua' },
      { char: '🤪', name: 'rosto doido' }, { char: '😝', name: 'lingua apertada' }, { char: '🤑', name: 'dinheiro cifrao' },
      { char: '🤗', name: 'abraco' }, { char: '🤭', name: 'mao na boca' }, { char: '🤫', name: 'silencio shh' },
      { char: '🤔', name: 'pensando' }, { char: '🤐', name: 'boca fechada' }, { char: '🤨', name: 'sobrancelha levantada' },
      { char: '😐', name: 'neutro' }, { char: '😑', name: 'sem expressao' }, { char: '😶', name: 'sem boca' },
      { char: '😏', name: 'sorriso de lado' }, { char: '😒', name: 'descontente' }, { char: '🙄', name: 'olhos rolando' },
      { char: '😬', name: 'careta' }, { char: '🤥', name: 'mentira pinocquio' }, { char: '😌', name: 'aliviado' },
      { char: '😔', name: 'pensativo triste' }, { char: '😪', name: 'sono babando' }, { char: '😴', name: 'dormindo' },
      { char: '😷', name: 'mascara doenca' }, { char: '🤒', name: 'termometro febre' }, { char: '🤕', name: 'curativo cabeca' },
      { char: '🤢', name: 'enjoado verde' }, { char: '🤮', name: 'vomitando' }, { char: '🤧', name: 'espirrando' },
      { char: '🥵', name: 'quente calor' }, { char: '🥶', name: 'frio gelado' }, { char: '🥴', name: 'tonto' },
      { char: '😵', name: 'morto tonto' }, { char: '🤯', name: 'cabeca explodindo' }, { char: '😎', name: 'oculos escuros' },
      { char: '🥳', name: 'festa comemoracao' }, { char: '🥺', name: 'pidao carinha triste' }, { char: '😡', name: 'bravo raiva' },
      { char: '🤬', name: 'xingando palavrao' }, { char: '😱', name: 'medo grito' }, { char: '😭', name: 'chorando muito' },
      { char: '🔥', name: 'fogo quente' }, { char: '✨', name: 'brilho estrelas' }, { char: '⭐', name: 'estrela' },
    ] 
  },
  { 
    name: 'People', 
    icon: 'far fa-user', 
    emojis: [
      { char: '👋', name: 'tchau aceno ola' }, { char: '🤚', name: 'mao levantada' }, { char: '✋', name: 'pare stop' },
      { char: '👌', name: 'ok entendi' }, { char: '✌️', name: 'paz vitoria' }, { char: '🤞', name: 'dedos cruzados sorte' },
      { char: '🤟', name: 'te amo love' }, { char: '🤘', name: 'rock metal' }, { char: '🤙', name: 'liga nois' },
      { char: '👍', name: 'legal joinha sim' }, { char: '👎', name: 'ruim nao' }, { char: '👊', name: 'soco' },
      { char: '👏', name: 'palmas parabens' }, { char: '🙌', name: 'celebracao' }, { char: '🙏', name: 'por favor obrigado rezar' },
      { char: '🤝', name: 'acordo maos' }, { char: '💪', name: 'forca bicep' }, { char: '🧠', name: 'cerebro mente' },
      { char: '👀', name: 'olhos vendo' }, { char: '❤️', name: 'coracao vermelho amor' }, { char: '💔', name: 'coracao partido' },
    ] 
  },
  { 
    name: 'Animals', 
    icon: 'fas fa-dog', 
    emojis: [
      { char: '🐶', name: 'cachorro cao' }, { char: '🐱', name: 'gato' }, { char: '🐭', name: 'rato' },
      { char: '🐰', name: 'coelho' }, { char: '🦊', name: 'raposa' }, { char: '🐻', name: 'urso' },
      { char: '🦁', name: 'leao' }, { char: '🐮', name: 'vaca' }, { char: '🐷', name: 'porco' },
      { char: '🐸', name: 'sapo' }, { char: '🐵', name: 'macaco' }, { char: '🐔', name: 'galinha' },
      { char: '🐧', name: 'pinguim' }, { char: '🐦', name: 'passaro' }, { char: '🦄', name: 'unicornio' },
      { char: '🦋', name: 'borboleta' }, { char: '🐍', name: 'cobra' }, { char: '🐙', name: 'polvo' },
      { char: '🐳', name: 'baleia' }, { char: '🐬', name: 'golfinho' }, { char: '🦈', name: 'tubarao' },
    ] 
  },
  { 
    name: 'Food', 
    icon: 'fas fa-hamburger', 
    emojis: [
      { char: '🍎', name: 'maca' }, { char: '🍌', name: 'banana' }, { char: '🍉', name: 'melancia' },
      { char: '🍓', name: 'morango' }, { char: '🍒', name: 'cereja' }, { char: '🥑', name: 'abacate' },
      { char: '🍕', name: 'pizza' }, { char: '🍔', name: 'hamburguer' }, { char: '🍟', name: 'batata frita' },
      { char: '🌮', name: 'taco' }, { char: '🍿', name: 'pipoca' }, { char: '🍩', name: 'donut' },
      { char: '🍪', name: 'biscoito cookie' }, { char: '🍰', name: 'bolo fatia' }, { char: '🍫', name: 'chocolate' },
      { char: '☕', name: 'cafe' }, { char: '🍺', name: 'cerveja' }, { char: '🍷', name: 'vinho' },
    ] 
  },
  { 
    name: 'Travel', 
    icon: 'fas fa-plane', 
    emojis: [
      { char: '🌍', name: 'terra mundo' }, { char: '🗺️', name: 'mapa' }, { char: '🏠', name: 'casa' },
      { char: '🏢', name: 'predio escritorio' }, { char: '🗼', name: 'torre eiffel' }, { char: '🗽', name: 'estatua liberdade' },
      { char: '⛪', name: 'igreja' }, { char: '🏖️', name: 'praia' }, { char: '🌋', name: 'vulcao' },
      { char: '🚗', name: 'carro' }, { char: '🚀', name: 'foguete' }, { char: '✈️', name: 'aviao' },
      { char: '🚁', name: 'helicoptero' }, { char: '⛵', name: 'barco vela' }, { char: '🚆', name: 'trem' },
      { char: '🚲', name: 'bicicleta' }, { char: '🗽', name: 'estatua liberdade' }, { char: '🗼', name: 'torre' },
    ] 
  },
  { 
    name: 'Objects', 
    icon: 'fas fa-lightbulb', 
    emojis: [
      { char: '💻', name: 'computador notebook' }, { char: '📱', name: 'celular iphone' }, { char: '📷', name: 'camera' },
      { char: '📺', name: 'televisao' }, { char: '⏰', name: 'relogio alarme' }, { char: '💡', name: 'ideia lampada' },
      { char: '💰', name: 'dinheiro saco' }, { char: '🎁', name: 'presente' }, { char: '🎈', name: 'balao' },
      { char: '🖊️', name: 'caneta' }, { char: '📚', name: 'livros' }, { char: '🔑', name: 'chave' },
      { char: '🔨', name: 'martelo ferramenta' }, { char: '🔫', name: 'arma' }, { char: '🛡️', name: 'escudo' },
      { char: '💎', name: 'diamante joia' }, { char: '⚽', name: 'bola futebol' }, { char: '🎮', name: 'videogame' },
    ] 
  },
];

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState(EMOJI_DATA[0].name);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEmojis = useMemo(() => {
    if (!searchTerm.trim()) return null;
    const term = searchTerm.toLowerCase();
    const results: EmojiItem[] = [];
    EMOJI_DATA.forEach(cat => {
      cat.emojis.forEach(emoji => {
        if (emoji.name.toLowerCase().includes(term)) {
          results.push(emoji);
        }
      });
    });
    return results;
  }, [searchTerm]);

  return (
    <div className="absolute bottom-[110%] left-0 w-[340px] h-[400px] bg-white shadow-xl rounded-lg flex flex-col z-50 animate-in fade-in slide-in-from-bottom-4 overflow-hidden border border-gray-200">
      {/* Search Header */}
      <div className="bg-[#f0f2f5] p-3 border-b border-gray-200 flex items-center">
         <div className="flex-1 bg-white rounded-full flex items-center px-3 py-1.5 border border-gray-200 focus-within:border-[#922c26] transition-colors">
            <i className="fas fa-search text-gray-400 text-sm mr-2"></i>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar emoji" 
              className="bg-transparent border-none outline-none text-sm w-full text-gray-900"
              autoFocus
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm('')} className="ml-1">
                <i className="fas fa-times text-gray-400 hover:text-gray-600"></i>
              </button>
            )}
         </div>
      </div>

      {/* Categories Navigation (Hidden during search) */}
      {!searchTerm && (
        <div className="flex bg-white border-b border-gray-100 overflow-x-auto no-scrollbar">
          {EMOJI_DATA.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => setActiveCategory(cat.name)}
              className={`flex-1 py-3 text-lg transition-colors border-b-2 flex justify-center items-center ${
                activeCategory === cat.name 
                  ? 'text-[#922c26] border-[#922c26]' 
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
              title={cat.name}
            >
              <i className={cat.icon}></i>
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        {searchTerm ? (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Resultados</h4>
            {filteredEmojis && filteredEmojis.length > 0 ? (
              <div className="grid grid-cols-8 gap-2">
                {filteredEmojis.map((emoji, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      onEmojiSelect(emoji.char);
                    }}
                    className="text-2xl hover:bg-gray-100 p-1 rounded transition-colors text-center"
                    title={emoji.name}
                  >
                    {emoji.char}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <i className="fas fa-search-minus text-3xl mb-2"></i>
                <p className="text-sm">Nenhum emoji encontrado</p>
              </div>
            )}
          </div>
        ) : (
          EMOJI_DATA.map((cat) => (
            <div key={cat.name} style={{ display: activeCategory === cat.name ? 'block' : 'none' }}>
              <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">{cat.name}</h4>
              <div className="grid grid-cols-8 gap-2">
                {cat.emojis.map((emoji, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      onEmojiSelect(emoji.char);
                    }}
                    className="text-2xl hover:bg-gray-100 p-1 rounded transition-colors text-center"
                    title={emoji.name}
                  >
                    {emoji.char}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Close Button */}
      <div className="bg-white p-2 border-t border-gray-100 flex justify-end">
         <button 
           type="button" 
           onClick={onClose} 
           className="text-[#922c26] text-xs font-bold uppercase p-2 hover:bg-gray-50 rounded"
         >
           Fechar
         </button>
      </div>
    </div>
  );
};

export default EmojiPicker;
