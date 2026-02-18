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

// 1. ENDPOINT DE CONFIGURAÇÃO (Usado pelo frontend para acordar o servidor e pegar a API_KEY)
app.get('/api/config', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json({
        API_KEY: process.env.API_KEY || ""
    });
});

app.use(express.static(__dirname));

const wss = new WebSocketServer({ server });

// 2. INICIA O SERVIDOR
server.listen(port, () => {
    console.log(`[HTTP] Servidor rodando na porta ${port}`);
    initWhatsApp();
});

function getChromiumExecutablePath() {
    // Caminho prioritário definido pelo script de build
    const stablePath = path.join(process.cwd(), '.chrome_stable/chrome');
    
    if (fs.existsSync(stablePath)) {
        console.log(`[WPP] Usando binário estável: ${stablePath}`);
        return stablePath;
    }

    // Fallbacks para ambiente local ou outros servidores
    const fallbacks = [
        process.env.PUPPETEER_EXECUTABLE_PATH,
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium'
    ];

    for (const p of fallbacks) {
        if (p && fs.existsSync(p)) {
            console.log(`[WPP] Usando fallback: ${p}`);
            return p;
        }
    }

    console.warn("[WPP] Aviso: Nenhum executável de Chrome/Chromium encontrado nos caminhos conhecidos.");
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
            '--disable-gpu',
            '--no-zygote',
            '--single-process'
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
        const sendToFrontend = (type, payload) => {
            if (ws.readyState === 1) ws.send(JSON.stringify({ type, payload }));
        };

        client.on('qr', (qr) => {
            console.log('[WPP] QR Code gerado');
            sendToFrontend('qr', qr);
        });

        client.on('ready', () => {
            console.log('[WPP] Cliente conectado e pronto!');
            sendToFrontend('authenticated', true);
        });

        client.on('message', async (msg) => {
            // Ignorar mensagens de grupo se desejar
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
                console.error('[WS] Erro ao processar mensagem:', e.message); 
            }
        });
    });

    client.initialize().catch(err => {
        console.error('[WPP] ERRO CRÍTICO NA INICIALIZAÇÃO:', err.message);
    });
}
