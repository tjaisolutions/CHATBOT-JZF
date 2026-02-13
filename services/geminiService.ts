
import { GoogleGenAI, Chat } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: Chat | null = null;

  constructor() {
    // API key must be used directly from process.env.API_KEY as per guidelines
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private initChat() {
    if (!this.chatSession) {
      this.chatSession = this.ai.chats.create({
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
          - Se o usuário enviar uma imagem, analise-a e depois lembre-o de escolher um atendente caso ainda não tenha feito.
          - Mantenha o tom profissional mas amigável.`,
        },
      });
    }
    return this.chatSession;
  }

  async sendMessage(message: string, attachment?: { data: string, mimeType: string }): Promise<string> {
    try {
      const chat = this.initChat();
      
      if (attachment && attachment.mimeType.startsWith('image/')) {
        const response = await this.ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              { text: message || "Analise esta imagem e depois me apresente a lista de atendentes para eu escolher." },
              { inlineData: { data: attachment.data, mimeType: attachment.mimeType } }
            ]
          }
        });
        return response.text || "Recebi sua imagem. Com qual de nossos atendentes você deseja falar? (Patricia, Nathan, Maria Fernanda ou João Victor)";
      }

      const response = await chat.sendMessage({ message: message || "Olá" });
      return response.text || "Desculpe, não consegui processar sua mensagem.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Houve um erro ao conectar com o servidor. Tente novamente mais tarde.";
    }
  }
}

export const geminiService = new GeminiService();
