
/**
 * BACKEND UNIFICADO - SUPORTE A BROWSER REMOTO
 * Esta versão permite rodar no Render sem Docker usando um serviço de Chromium externo.
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const { WebSocketServer } = require('ws');
const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;
const server = http.createServer(app);

app.use(express.static(__dirname));

const wss = new WebSocketServer({ server });

// Configuração flexível: Usa Navegador Remoto se a URL estiver presente nas variáveis de ambiente
const puppeteerOptions = {
    headless: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
    ]
};

// Se você usar o Browserless.io (recomendado para Render sem Docker), adicione a URL no painel do Render
if (process.env.BROWSER_WS_ENDPOINT) {
    puppeteerOptions.browserWSEndpoint = process.env.BROWSER_WS_ENDPOINT;
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: puppeteerOptions
});

console.log('--- INICIALIZANDO ENGINE WHATSAPP ---');

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
        } catch (e) {
            console.error('Erro no comando:', e);
        }
    });
});

client.initialize().catch(err => console.error('Falha ao iniciar WhatsApp:', err));

server.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
