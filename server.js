/**
 * BACKEND UNIFICADO - WHATSAPP + GEMINI
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const { WebSocketServer } = require('ws');
const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;
const server = http.createServer(app);

// 1. ENDPOINTS DE SAÚDE E CONFIGURAÇÃO
// O Render precisa que o '/' responda rápido para não dar timeout
app.get('/', (req, res) => {
    res.send('WhatsApp Bot Engine is Running');
});

app.get('/api/config', (req, res) => {
    res.json({
        API_KEY: process.env.API_KEY || ""
    });
});

app.use(express.static(__dirname));

const wss = new WebSocketServer({ server });

// 2. INICIA O SERVIDOR HTTP IMEDIATAMENTE
server.listen(port, "0.0.0.0", () => {
    console.log(`[HTTP] Servidor rodando na porta ${port}`);
    // Inicializa o WhatsApp em background para não bloquear o boot do servidor
    setTimeout(initWhatsApp, 1000);
});

function getChromiumExecutablePath() {
    const stablePath = path.join(process.cwd(), '.chrome_stable/chrome');
    if (fs.existsSync(stablePath)) return stablePath;

    const fallbacks = [
        process.env.PUPPETEER_EXECUTABLE_PATH,
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser'
    ];

    for (const p of fallbacks) {
        if (p && fs.existsSync(p)) return p;
    }
    return null;
}

function initWhatsApp() {
    console.log('--- [WPP] INICIALIZANDO ENGINE ---');
    
    const chromePath = getChromiumExecutablePath();
    
    // Flags cruciais para rodar em ambientes com pouca RAM (Render Free)
    const puppeteerOptions = {
        headless: "new",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--single-process', // Reduz drasticamente o uso de RAM
            '--disable-extensions'
        ]
    };

    if (chromePath) {
        puppeteerOptions.executablePath = chromePath;
        console.log(`[WPP] Executável: ${chromePath}`);
    }

    const client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: puppeteerOptions
    });

    wss.on('connection', (ws) => {
        console.log('[WS] Cliente UI conectado');
        
        const sendToFrontend = (type, payload) => {
            if (ws.readyState === 1) ws.send(JSON.stringify({ type, payload }));
        };

        client.on('qr', (qr) => {
            console.log('[WPP] QR Code gerado');
            sendToFrontend('qr', qr);
        });

        client.on('ready', () => {
            console.log('[WPP] WhatsApp pronto!');
            sendToFrontend('authenticated', true);
        });

        client.on('message', async (msg) => {
            if (msg.from.includes('@g.us')) return;
            sendToFrontend('message', {
                id: msg.id.id,
                from: msg.from,
                text: msg.body,
                timestamp: new Date()
            });
        });

        ws.on('message', async (data) => {
            try {
                const { type, payload } = JSON.parse(data);
                if (type === 'send_message') {
                    await client.sendMessage(payload.to, payload.text);
                }
            } catch (e) { 
                console.error('[WS] Erro:', e.message); 
            }
        });
    });

    client.initialize().catch(err => {
        console.error('[WPP] FALHA NA INICIALIZAÇÃO:', err.message);
    });
}
