
/**
 * BACKEND UNIFICADO - COM INICIALIZAÇÃO OTIMIZADA PARA RENDER
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const { WebSocketServer } = require('ws');
const express = require('express');
const http = require('http');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3001;
const server = http.createServer(app);

// 1. ENDPOINT DE CONFIGURAÇÃO (Deve responder o mais rápido possível)
app.get('/api/config', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json({
        API_KEY: process.env.API_KEY || ""
    });
});

app.use(express.static(__dirname));

const wss = new WebSocketServer({ server });

// 2. INICIA O SERVIDOR HTTP PRIMEIRO
server.listen(port, () => {
    console.log(`[HTTP] Servidor ouvindo na porta ${port}`);
    console.log(`[HTTP] Endpoint de configuração pronto em /api/config`);
    
    // Inicia o motor do WhatsApp APÓS o servidor estar online
    initWhatsApp();
});

function getChromiumExecutablePath() {
    const paths = [
        process.env.PUPPETEER_EXECUTABLE_PATH,
        '/opt/render/project/src/.cache/stable/chrome',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser'
    ];
    for (const p of paths) {
        if (p && fs.existsSync(p)) return p;
    }
    return null;
}

function initWhatsApp() {
    console.log('--- INICIALIZANDO ENGINE WHATSAPP ---');
    
    const puppeteerOptions = {
        headless: "new",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-zygote',
            '--single-process'
        ]
    };

    const chromePath = getChromiumExecutablePath();
    if (chromePath) {
        puppeteerOptions.executablePath = chromePath;
        console.log(`[WPP] Usando Chrome em: ${chromePath}`);
    }

    const client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: puppeteerOptions
    });

    wss.on('connection', (ws) => {
        const sendToFrontend = (type, payload) => {
            if (ws.readyState === 1) ws.send(JSON.stringify({ type, payload }));
        };

        client.on('qr', (qr) => sendToFrontend('qr', qr));
        client.on('ready', () => sendToFrontend('authenticated', true));
        client.on('message', async (msg) => {
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
                if (type === 'send_message') await client.sendMessage(payload.to, payload.text);
            } catch (e) { console.error('Erro WebSocket:', e); }
        });
    });

    client.initialize().catch(err => {
        console.error('ERRO CRÍTICO WHATSAPP:', err.message);
    });
}
