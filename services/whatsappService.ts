
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

    // Detecta automaticamente o protocolo e o host
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    // Remove barras extras e garante o formato correto
    const url = `${protocol}//${host}`;

    this.addLog(`Conectando ao Socket em ${url}...`);
    this.status = 'CONNECTING';
    
    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.addLog("Conexão WebSocket aberta.");
        this.onStatusChange?.('CONNECTING');
      };

      this.socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            switch (data.type) {
              case 'qr':
                this.onQRReceived?.(data.payload);
                break;
              case 'authenticated':
                this.addLog("WhatsApp Autenticado!");
                this.status = 'CONNECTED';
                this.onStatusChange?.('CONNECTED');
                break;
              case 'message':
                this.handleIncomingMessage(data.payload);
                break;
            }
        } catch (e) {
            console.error("Erro ao processar mensagem do socket:", e);
        }
      };

      this.socket.onclose = () => {
        this.addLog("Conexão encerrada. Tentando reconectar...");
        this.status = 'DISCONNECTED';
        this.socket = null;
        this.onStatusChange?.('DISCONNECTED');
        // Reconecta automaticamente após 5 segundos
        setTimeout(() => this.initEngine(), 5000);
      };

      this.socket.onerror = (err) => {
        this.addLog("Erro no WebSocket.");
      };

    } catch (e) {
      this.addLog("Erro ao inicializar conexão.");
    }
  }

  private handleIncomingMessage(payload: any) {
    const msg: Message = {
      id: payload.id,
      text: payload.text,
      sender: 'user',
      timestamp: new Date(payload.timestamp),
      status: 'read'
    };
    this.onMessageReceived?.(msg, payload.from);
  }

  private addLog(msg: string) {
    const time = new Date().toLocaleTimeString();
    this.logs.push(`[${time}] ${msg}`);
    console.log(`[WPP] ${msg}`);
  }

  getLogs() { return this.logs; }

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
