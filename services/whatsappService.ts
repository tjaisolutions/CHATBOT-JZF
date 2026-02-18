
import { Message } from '../types';

class WhatsAppService {
  private socket: WebSocket | null = null;
  private status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' = 'DISCONNECTED';
  private onMessageReceived: ((msg: Message, chatId: string) => void) | null = null;
  private onQRReceived: ((qr: string) => void) | null = null;
  private onStatusChange: ((status: string) => void) | null = null;
  private logs: string[] = [];

  async initEngine(): Promise<void> {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) return;

    // Construção robusta da URL de WebSocket baseada na origem atual
    // Converte http://... para ws://... e https://... para wss://...
    const wsUrl = window.location.origin.replace(/^http/, 'ws') + '/';

    this.addLog(`Iniciando conexão WebSocket em: ${wsUrl}`);
    this.status = 'CONNECTING';
    
    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.addLog("Canal de sinalização aberto com sucesso.");
        this.onStatusChange?.('CONNECTING');
      };

      this.socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            switch (data.type) {
              case 'qr':
                if (data.payload) {
                    this.onQRReceived?.(data.payload);
                }
                break;
              case 'authenticated':
                this.addLog("WhatsApp Autenticado com Sucesso!");
                this.status = 'CONNECTED';
                this.onStatusChange?.('CONNECTED');
                break;
              case 'message':
                this.handleIncomingMessage(data.payload);
                break;
            }
        } catch (e) {
            console.error("Erro ao decodificar pacote do servidor:", e);
        }
      };

      this.socket.onclose = (event) => {
        this.addLog(`Conexão perdida (Código: ${event.code}). Reconectando em 5s...`);
        this.status = 'DISCONNECTED';
        this.socket = null;
        this.onStatusChange?.('DISCONNECTED');
        setTimeout(() => this.initEngine(), 5000);
      };

      this.socket.onerror = (err) => {
        this.addLog("Falha crítica no WebSocket. Verifique o console.");
        console.error("WebSocket Error Details:", err);
      };

    } catch (e) {
      this.addLog("Erro de sintaxe na URL ou falha de inicialização.");
      console.error("Erro ao instanciar WebSocket:", e);
    }
  }

  private handleIncomingMessage(payload: any) {
    const msg: Message = {
      id: payload.id || Date.now().toString(),
      text: payload.text,
      sender: 'user',
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      status: 'read'
    };
    this.onMessageReceived?.(msg, payload.from);
  }

  private addLog(msg: string) {
    const time = new Date().toLocaleTimeString();
    const entry = `[${time}] ${msg}`;
    this.logs.push(entry);
    // Manter apenas os últimos 50 logs para evitar consumo excessivo de memória
    if (this.logs.length > 50) this.logs.shift();
    console.log(`[WPP_SERVICE] ${msg}`);
  }

  getLogs() { return [...this.logs]; }

  async sendMessage(chatId: string, text: string): Promise<boolean> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'send_message',
        payload: { to: chatId, text }
      }));
      return true;
    }
    return false;
  }

  setCallbacks(callbacks: {
    onMessage?: (msg: Message, chatId: string) => void,
    onQR?: (qr: string) => void,
    onStatus?: (status: string) => void
  }) {
    if (callbacks.onMessage) this.onMessageReceived = callbacks.onMessage;
    if (callbacks.onQR) this.onQRReceived = callbacks.onQR;
    if (callbacks.onStatus) this.onStatusChange = callbacks.onStatus;
  }

  getStatus() { return this.status; }
}

export const whatsappService = new WhatsAppService();
