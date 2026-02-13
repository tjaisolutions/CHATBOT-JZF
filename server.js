/**
 * BACKEND UNIFICADO - COM DETECÇÃO DINÂMICA DE BROWSER (FIX RENDER BUILD)
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

// 1. ENDPOINT DE CONFIGURAÇÃO
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
    initWhatsApp();
});

function getChromiumExecutablePath() {
    // Lista de caminhos possíveis (Relativos ao root do projeto e absolutos do sistema)
    const paths = [
        process.env.PUPPETEER_EXECUTABLE_PATH,
        path.join(process.cwd(), '.chrome_stable/chrome'),
        path.join(process.cwd(), '.puppeteer_cache/chrome'),
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser'
    ];

    for (const p of paths) {
        if (p && fs.existsSync(p)) {
            console.log(`[BROWSER] Verificado e encontrado em: ${p}`);
            return p;
        }
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
    } else {
        console.warn("[WPP] Aviso: Nenhum executável customizado encontrado. Tentando padrão do sistema.");
    }

    const client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: puppeteerOptions
    });

    wss.on('connection', (ws) => {
        const sendToFrontend = (type, payload) => {
            if (ws.readyState === 1) ws.send(JSON.stringify({ type, payload }));
        };

        client.on('qr', (qr) => {
            console.log('[WPP] Novo QR Code gerado');
            sendToFrontend('qr', qr);
        });

        client.on('ready', () => {
            console.log('[WPP] Cliente está pronto!');
            sendToFrontend('authenticated', true);
        });

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