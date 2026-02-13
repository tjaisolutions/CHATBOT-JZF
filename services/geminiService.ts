
import { GoogleGenAI, Chat } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private chatSession: Chat | null = null;

  private getAI() {
    if (!this.ai) {
      // Prioriza a chave do window (injetada pelo index.html) ou process.env
      const apiKey = (window as any).process?.env?.API_KEY || process.env.API_KEY;
      
      if (!apiKey) {
        console.error("GeminiService: API_KEY não encontrada!");
        return null;
      }
      
      this.ai = new GoogleGenAI({ apiKey });
    }
    return this.ai;
  }

  private initChat() {
    const ai = this.getAI();
    if (!ai) return null;

    if (!this.chatSession) {
      this.chatSession = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: `Você é um assistente virtual de triagem ágil e cordial em um chat do WhatsApp. 
          
          SUA MISSÃO PRINCIPAL:
          Sempre que o usuário enviar a primeira mensagem ou demonstrar interesse em iniciar um atendimento, você deve obrigatoriamente apresentar a lista de atendentes disponíveis para que ele escolha:
          
          1. Patricia Athanazio
          2. Nathan Daniel
          3. Maria Fernanda
          4. João Victor
          
          REGRAS DE COMPORTAMENTO:
          - Seja conciso e use emojis.
          - Pergunte educadamente com qual deles o usuário deseja conversar.
          - Se o usuário escolher um nome da lista, confirme a escolha e diga que está "transferindo o atendimento".
          - Mantenha o tom profissional mas amigável.`,
        },
      });
    }
    return this.chatSession;
  }

  async sendMessage(message: string, attachment?: { data: string, mimeType: string }): Promise<string> {
    try {
      const ai = this.getAI();
      if (!ai) return "Erro: Chave de API não configurada.";

      const chat = this.initChat();
      if (!chat) return "Erro ao inicializar chat.";
      
      if (attachment && attachment.mimeType.startsWith('image/')) {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { text: message || "Analise esta imagem." },
              { inlineData: { data: attachment.data, mimeType: attachment.mimeType } }
            ]
          }
        });
        return response.text || "Recebi sua imagem.";
      }

      const response = await chat.sendMessage({ message: message || "Olá" });
      return response.text || "Desculpe, não consegui processar sua mensagem.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Erro na comunicação com a IA. Verifique se a sua API_KEY é válida.";
    }
  }
}

export const geminiService = new GeminiService();
