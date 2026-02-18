
/**
 * BACKEND LEVE - WHATSAPP VIA BAILEYS (SEM CHROME)
 * Consumo de RAM aproximado: 100MB-150MB
 */

const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason,
    fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');

const app = express();
const port = process.env.PORT || 3001;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Configuração básica do Express
app.get('/api/config', (req, res) => {
    res.json({ API_KEY: process.env.API_KEY || "" });
});

app.use(express.static(__dirname));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Inicialização do WhatsApp (Baileys)
async function connectToWhatsApp() {
    console.log('[WPP] Iniciando conexão via Protocolo (Baileys)...');
    
    // Pasta para salvar a sessão e não precisar de QR Code toda hora
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }), // Log silencioso para economizar processamento
        browser: ["Chatbot Gemini", "MacOS", "3.0.0"]
    });

    // Gerenciamento de WebSockets para o Frontend
    wss.on('connection', (ws) => {
        console.log('[WS] Frontend conectado.');

        const sendToFrontend = (type, payload) => {
            if (ws.readyState === 1) ws.send(JSON.stringify({ type, payload }));
        };

        // Eventos do Socket do WhatsApp
        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log('[WPP] Novo QR Code disponível.');
                sendToFrontend('qr', qr);
            }

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('[WPP] Conexão fechada. Motivo:', lastDisconnect.error, 'Reconectando:', shouldReconnect);
                if (shouldReconnect) connectToWhatsApp();
            } else if (connection === 'open') {
                console.log('[WPP] WhatsApp CONECTADO!');
                sendToFrontend('authenticated', true);
            }
        });

        // Salvar credenciais quando atualizadas
        sock.ev.on('creds.update', saveCreds);

        // Receber Mensagens
        sock.ev.on('messages.upsert', async m => {
            const msg = m.messages[0];
            if (!msg.key.fromMe && m.type === 'notify') {
                const sender = msg.key.remoteJid;
                const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

                if (text && !sender.includes('@g.us')) {
                    console.log(`[MSG] De: ${sender} -> ${text}`);
                    sendToFrontend('message', {
                        id: msg.key.id,
                        from: sender,
                        text: text,
                        timestamp: new Date()
                    });
                }
            }
        });

        // Enviar Mensagens vindas do Frontend
        ws.on('message', async (data) => {
            try {
                const { type, payload } = JSON.parse(data);
                if (type === 'send_message') {
                    await sock.sendMessage(payload.to, { text: payload.text });
                    console.log(`[MSG] Enviada para: ${payload.to}`);
                }
            } catch (e) { console.error('[WS Error]', e.message); }
        });
    });
}

// Inicia o servidor e a conexão
server.listen(port, "0.0.0.0", () => {
    console.log(`[SERVER] Rodando em http://localhost:${port}`);
    connectToWhatsApp();
});
