
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
const port = process.env.PORT || 10000; // Porta padrão do Render
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Middleware para corrigir MIME types de arquivos TypeScript para o navegador
app.use((req, res, next) => {
    if (req.url.endsWith('.ts') || req.url.endsWith('.tsx')) {
        res.type('application/javascript');
    }
    next();
});

// Configuração básica do Express
app.get('/api/config', (req, res) => {
    res.json({ 
        API_KEY: process.env.API_KEY || "",
        status: "online"
    });
});

app.use(express.static(__dirname));
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Inicialização do WhatsApp (Baileys)
async function connectToWhatsApp() {
    console.log('[WPP] Iniciando conexão via Protocolo (Baileys)...');
    
    try {
        const { state, saveCreds } = await useMultiFileAuthState('auth_info');
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: true,
            logger: pino({ level: 'silent' }),
            browser: ["Chatbot Gemini", "Chrome", "1.0.0"]
        });

        sock.ev.on('creds.update', saveCreds);

        wss.on('connection', (ws) => {
            console.log('[WS] Novo cliente conectado ao Socket');

            const sendToFrontend = (type, payload) => {
                if (ws.readyState === 1) ws.send(JSON.stringify({ type, payload }));
            };

            sock.ev.on('connection.update', (update) => {
                const { connection, lastDisconnect, qr } = update;
                if (qr) sendToFrontend('qr', qr);
                if (connection === 'close') {
                    const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
                    if (shouldReconnect) connectToWhatsApp();
                } else if (connection === 'open') {
                    sendToFrontend('authenticated', true);
                }
            });

            sock.ev.on('messages.upsert', async m => {
                const msg = m.messages[0];
                if (!msg.key.fromMe && m.type === 'notify') {
                    const sender = msg.key.remoteJid;
                    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
                    if (text && !sender.includes('@g.us')) {
                        sendToFrontend('message', {
                            id: msg.key.id,
                            from: sender,
                            text: text,
                            timestamp: new Date()
                        });
                    }
                }
            });

            ws.on('message', async (data) => {
                try {
                    const { type, payload } = JSON.parse(data);
                    if (type === 'send_message') {
                        await sock.sendMessage(payload.to, { text: payload.text });
                    }
                } catch (e) { console.error('[WS Error]', e.message); }
            });
        });

    } catch (err) {
        console.error('[WPP Error] Falha ao iniciar Baileys:', err.message);
        setTimeout(connectToWhatsApp, 5000);
    }
}

server.listen(port, "0.0.0.0", () => {
    console.log(`[SERVER] Rodando em porta ${port}`);
    connectToWhatsApp();
});
