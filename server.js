
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

// Servir arquivos estáticos (colocado antes das rotas para evitar conflitos)
app.use(express.static(__dirname));

// 1. ENDPOINTS DE SAÚDE E CONFIGURAÇÃO
app.get('/api/config', (req, res) => {
    res.json({
        API_KEY: process.env.API_KEY || ""
    });
});

// Endpoint principal explicitamente servindo index.html se nada mais bater
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const wss = new WebSocketServer({ server });

// 2. INICIA O SERVIDOR HTTP IMEDIATAMENTE
server.listen(port, "0.0.0.0", () => {
    console.log(`[HTTP] Servidor ONLINE na porta ${port}`);
    // Inicializa o WhatsApp em background
    setTimeout(initWhatsApp, 2000);
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
    console.log(`[WPP] Usando executável do Chrome: ${chromePath || 'Padrão'}`);
    
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
            '--single-process', // Crucial para o Render Free
            '--disable-extensions',
            '--disable-default-apps',
            '--mute-audio'
        ]
    };

    if (chromePath) {
        puppeteerOptions.executablePath = chromePath;
    }

    const client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: puppeteerOptions
    });

    wss.on('connection', (ws) => {
        console.log('[WS] Novo cliente conectado');
        
        const sendToFrontend = (type, payload) => {
            if (ws.readyState === 1) ws.send(JSON.stringify({ type, payload }));
        };

        client.on('qr', (qr) => {
            console.log('[WPP] QR Code gerado');
            sendToFrontend('qr', qr);
        });

        client.on('ready', () => {
            console.log('[WPP] WhatsApp autenticado e pronto!');
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
                console.error('[WS] Erro ao enviar:', e.message); 
            }
        });
    });

    client.initialize().catch(err => {
        console.error('[WPP] ERRO FATAL NA ENGINE:', err.message);
    });
}
