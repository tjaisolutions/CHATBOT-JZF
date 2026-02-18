
import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { COLORS } from '../constants';
import { whatsappService } from '../services/whatsappService';

interface ConnectionModalProps {
  onClose: () => void;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

const ConnectionModal: React.FC<ConnectionModalProps> = ({ onClose, isConnected, onConnect, onDisconnect }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    whatsappService.setCallbacks({
      onQR: async (qrString) => {
        if (!qrString || typeof qrString !== 'string' || qrString.trim() === '') {
            console.warn("Recebido QR Code vazio ou inválido.");
            return;
        }
        try {
          // A função toDataURL pode lançar erro se a string não for um padrão de QR válido
          const url = await QRCode.toDataURL(qrString, {
            margin: 2,
            scale: 10,
            color: {
              dark: '#111b21',
              light: '#ffffff'
            }
          });
          setQrDataUrl(url);
        } catch (err) {
          console.error("Erro ao converter string de QR em imagem:", err);
        }
        setLogs(whatsappService.getLogs());
      },
      onStatus: (status) => {
        if (status === 'CONNECTED') {
          onConnect();
        }
        setLogs(whatsappService.getLogs());
      }
    });

    if (!isConnected && !isConnecting) {
      setIsConnecting(true);
      whatsappService.initEngine().catch(err => {
          console.error("Falha ao iniciar motor de conexão:", err);
      });
    }
  }, [isConnected, onConnect, isConnecting]);

  // Atualiza logs periodicamente para o console visual
  useEffect(() => {
    const interval = setInterval(() => {
      const currentLogs = whatsappService.getLogs();
      setLogs(currentLogs);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[500] flex flex-col bg-[#f0f2f5] animate-in fade-in duration-300">
      <div className="w-full h-[220px] shrink-0" style={{ backgroundColor: COLORS.primary }}>
        <div className="max-w-[1000px] mx-auto px-6 h-full flex items-center gap-4">
          <i className="fab fa-whatsapp text-4xl text-white"></i>
          <h1 className="text-white font-bold text-lg uppercase tracking-wider">WhatsApp Chatbot Engine</h1>
        </div>
      </div>

      <div className="flex-1 -mt-24 px-4 pb-10 flex flex-col items-center overflow-y-auto">
        <div className="bg-white rounded-sm shadow-xl w-full max-w-[1000px] min-h-[600px] flex flex-col md:flex-row overflow-hidden border border-gray-200">
          
          <div className="flex-1 p-12 md:p-16">
            {!isConnected ? (
              <div className="space-y-10">
                <h2 className="text-3xl font-light text-gray-700">Para usar o Chatbot com seu WhatsApp Real:</h2>
                <ol className="space-y-6 text-gray-500 text-[18px] leading-relaxed list-decimal list-inside">
                  <li>Abra o <strong>WhatsApp</strong> no seu celular</li>
                  <li>Selecione <strong>Aparelhos conectados</strong> no menu</li>
                  <li>Toque em <strong>Conectar um aparelho</strong></li>
                  <li>Aponte seu celular para o código ao lado</li>
                </ol>
                
                <div className="pt-8 border-t border-gray-100 flex flex-col gap-4">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 text-sm text-[#922c26] font-bold">
                       <i className="fas fa-terminal"></i>
                       <span>Console do Sistema:</span>
                     </div>
                     <span className="text-[10px] text-gray-400 font-mono">Status: {whatsappService.getStatus()}</span>
                   </div>
                   <div className="bg-gray-900 rounded p-4 h-48 overflow-y-auto font-mono text-[10px] text-green-400 scroll-smooth shadow-inner">
                      {logs.length > 0 ? logs.map((log, i) => (
                        <div key={i} className="mb-1">{log}</div>
                      )) : (
                        <div className="opacity-50 italic">Aguardando logs do sistema...</div>
                      )}
                      <div className="animate-pulse">_</div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-center space-y-6">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-[#922c26] mb-4">
                  <i className="fas fa-check-double text-5xl"></i>
                </div>
                <h2 className="text-3xl font-bold text-gray-800">Sessão Ativa</h2>
                <p className="text-gray-500 max-w-md">Seu WhatsApp está pareado e pronto. A IA Gemini responderá automaticamente aos seus clientes.</p>
                <div className="flex flex-wrap justify-center gap-4 pt-6">
                  <button onClick={onClose} className="px-10 py-3 bg-[#922c26] text-white rounded-full font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all">IR PARA O CHAT</button>
                  <button onClick={onDisconnect} className="px-10 py-3 border border-gray-200 text-red-500 rounded-full font-bold hover:bg-red-50 active:scale-95 transition-all">ENCERRAR SESSÃO</button>
                </div>
              </div>
            )}
          </div>

          {!isConnected && (
            <div className="w-full md:w-[420px] bg-white p-8 md:p-16 flex flex-col items-center justify-center border-l border-gray-50">
              <div className="relative">
                <div className="p-4 bg-white border shadow-inner rounded-sm relative">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR Code WhatsApp" className="w-[264px] h-[264px]" />
                  ) : (
                    <div className="w-[264px] h-[264px] bg-gray-50 flex flex-col items-center justify-center text-center p-6">
                       <div className="w-10 h-10 border-2 border-[#922c26] border-t-transparent rounded-full animate-spin mb-4"></div>
                       <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-tight">
                         Gerando QR Code...<br/>isso pode levar 10-20s
                       </span>
                    </div>
                  )}
                  {qrDataUrl && (
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-[#922c26]/40 shadow-[0_0_8px_#922c26] animate-[scan_3s_linear_infinite] pointer-events-none"></div>
                  )}
                </div>
              </div>
              <p className="mt-8 text-[11px] text-gray-400 text-center leading-relaxed max-w-[280px]">
                O código é gerado automaticamente. Se ele expirar, o sistema solicitará um novo ao motor Baileys.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default ConnectionModal;
