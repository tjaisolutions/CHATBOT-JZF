
import React, { useState, useRef, useEffect } from 'react';
import { COLORS } from '../constants';
import EmojiPicker from './EmojiPicker';

interface FilePreviewOverlayProps {
  file: File;
  onSend: (base64Data: string, caption: string, fileName: string, fileType: string) => void;
  onCancel: () => void;
}

const FilePreviewOverlay: React.FC<FilePreviewOverlayProps> = ({ file, onSend, onCancel }) => {
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isImage, setIsImage] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const captionInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsImage(file.type.startsWith('image/'));
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleSend = () => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      onSend(base64, caption, file.name, file.type);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-[#0b141a] text-white select-none">
      <div className="flex items-center justify-between p-4 bg-[#0b141a] z-10 border-b border-white/5">
        <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <i className="fas fa-times text-xl"></i>
        </button>
        <div className="flex gap-2">
           <span className="text-sm font-medium opacity-80">{file.name}</span>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden relative">
        {isImage ? (
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="max-w-full max-h-[65vh] object-contain shadow-2xl rounded-sm"
          />
        ) : (
          <div className="flex flex-col items-center bg-white/5 p-16 rounded-xl border border-white/10">
            <i className="fas fa-file-alt text-8xl mb-6 text-gray-500"></i>
            <p className="text-xl font-bold">{file.name}</p>
          </div>
        )}
      </div>

      <div className="p-6 bg-[#0b141a] flex flex-col gap-4 border-t border-white/5">
        <div className="max-w-3xl mx-auto w-full flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 relative shadow-lg">
          <button 
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-gray-500 hover:text-gray-800 transition-colors"
          >
            <i className="far fa-smile text-xl"></i>
          </button>
          <div className="relative">
            {showEmojiPicker && <EmojiPicker onEmojiSelect={(emoji) => setCaption(prev => prev + emoji)} onClose={() => setShowEmojiPicker(false)} />}
          </div>
          <input 
            ref={captionInputRef}
            type="text" 
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Adicionar uma legenda..."
            style={{ color: '#000000' }}
            className="flex-1 bg-transparent border-none outline-none text-[15px] py-1 font-medium placeholder-gray-500"
            autoFocus
          />
        </div>

        <div className="flex justify-between items-center max-w-3xl mx-auto w-full mt-2">
           <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-xs text-white/70">
             <span className="font-bold text-white truncate max-w-[150px]">{file.name}</span>
             <span>({(file.size / 1024).toFixed(0)} KB)</span>
           </div>
           
           <button 
            onClick={handleSend}
            className="w-14 h-14 flex items-center justify-center rounded-full text-white shadow-2xl active:scale-90 transition-transform"
            style={{ backgroundColor: COLORS.primary }}
          >
            <i className="fas fa-paper-plane text-2xl ml-1"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilePreviewOverlay;
