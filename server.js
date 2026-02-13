
/**
 * BACKEND + FRONTEND UNIFICADO
 * Este servidor serve o app React e gerencia o WhatsApp Engine.
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const { WebSocketServer } = require('ws');
const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Cria o servidor HTTP que será compartilhado pelo Express e pelo WebSocket
const server = http.createServer(app);

// Serve os arquivos estáticos da raiz (Frontend)
app.use(express.static(__dirname));

// Configuração do servidor WebSocket acoplado ao servidor HTTP
const wss = new WebSocketServer({ server });

// Inicialização do cliente WhatsApp com flags para o Render/Docker
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

console.log('--- INICIALIZANDO ENGINE UNIFICADA ---');

wss.on('connection', (ws) => {
    console.log('Frontend conectado via WebSocket.');

    const sendToFrontend = (type, payload) => {
        if (ws.readyState === 1) { // OPEN
            ws.send(JSON.stringify({ type, payload }));
        }
    };

    client.on('qr', (qr) => {
        console.log('Novo QR Code gerado.');
        sendToFrontend('qr', qr);
    });

    client.on('ready', () => {
        console.log('WhatsApp Engine está PRONTO!');
        sendToFrontend('authenticated', true);
    });

    client.on('message', async (msg) => {
        console.log(`Mensagem de ${msg.from}: ${msg.body}`);
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
            console.error('Erro no comando:', e);
        }
    });
});

client.initialize().catch(err => console.error('Erro ao inicializar WhatsApp:', err));

// Inicia o servidor unificado
server.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
