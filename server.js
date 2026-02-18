
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

// Servir arquivos estáticos
app.use(express.static(__dirname));

// 1. ENDPOINTS DE SAÚDE E CONFIGURAÇÃO
app.get('/api/config', (req, res) => {
    res.json({
        API_KEY: process.env.API_KEY || ""
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const wss = new WebSocketServer({ server });

// 2. INICIA O SERVIDOR HTTP IMEDIATAMENTE
server.listen(port, "0.0.0.0", () => {
    console.log(`[HTTP] Servidor ONLINE na porta ${port}`);
    // Pequeno delay para garantir que o sistema de arquivos esteja estável no Render
    setTimeout(initWhatsApp, 5000);
});

function getChromiumExecutablePath() {
    const projectRoot = process.cwd();
    const pathsToTry = [
        path.join(projectRoot, '.chrome_stable', 'chrome'),
        path.join(projectRoot, '.chrome_stable', 'chrome-linux', 'chrome'),
        process.env.PUPPETEER_EXECUTABLE_PATH,
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser'
    ];

    console.log('[DEBUG] Buscando Chrome nos seguintes caminhos:');
    for (const p of pathsToTry) {
        if (p && fs.existsSync(p)) {
            try {
                fs.accessSync(p, fs.constants.X_OK);
                console.log(`[DEBUG] ENCONTRADO E EXECUTÁVEL: ${p}`);
                return p;
            } catch (e) {
                console.warn(`[DEBUG] Encontrado mas SEM PERMISSÃO: ${p}`);
            }
        }
    }
    return null;
}

function initWhatsApp() {
    console.log('--- [WPP] INICIALIZANDO ENGINE ---');
    
    const chromePath = getChromiumExecutablePath();
    
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
            '--single-process',
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
        console.error('#########################################');
        console.error('[WPP] ERRO CRÍTICO NA ENGINE:');
        console.error(err.message);
        console.error('Path utilizado:', chromePath);
        console.error('#########################################');
    });
}
