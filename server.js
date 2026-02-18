
/**
 * BACKEND UNIFICADO - WHATSAPP + GEMINI
 * Otimizado para ambientes de baixa memória (Render Free - 512MB)
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

// Log de requisições simplificado para não poluir o console
app.use((req, res, next) => {
    if (req.url !== '/api/config') console.log(`[HTTP] ${req.method} ${req.url}`);
    next();
});

// Endpoint de configuração (Prioridade Máxima)
app.get('/api/config', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json({
        API_KEY: process.env.API_KEY || ""
    });
});

// Servir arquivos estáticos
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const wss = new WebSocketServer({ server });

// 2. INICIA O SERVIDOR HTTP
server.listen(port, "0.0.0.0", () => {
    console.log(`[HTTP] Servidor ONLINE na porta ${port}`);
    console.log('[WPP] Aguardando 45 segundos para estabilização de RAM antes de iniciar o Chrome...');
    // Aumentamos para 45s para garantir que o usuário carregue o site primeiro
    setTimeout(initWhatsApp, 45000);
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

    for (const p of pathsToTry) {
        if (p && fs.existsSync(p)) {
            try {
                fs.accessSync(p, fs.constants.X_OK);
                return p;
            } catch (e) {}
        }
    }
    return null;
}

function initWhatsApp() {
    console.log('--- [WPP] INICIALIZANDO ENGINE (MEMÓRIA REDUZIDA) ---');
    
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
            '--mute-audio',
            '--disable-software-rasterizer',
            '--disable-dev-tools',
            '--js-flags="--max-old-space-size=256"' // Limita memória interna do V8 no Chrome
        ]
    };

    if (chromePath) {
        puppeteerOptions.executablePath = chromePath;
    }

    try {
        const client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: puppeteerOptions
        });

        wss.on('connection', (ws) => {
            console.log('[WS] Cliente conectado');
            
            const sendToFrontend = (type, payload) => {
                if (ws.readyState === 1) ws.send(JSON.stringify({ type, payload }));
            };

            client.on('qr', (qr) => {
                console.log('[WPP] Novo QR Code gerado');
                sendToFrontend('qr', qr);
            });

            client.on('ready', () => {
                console.log('[WPP] Pronto!');
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
                } catch (e) { console.error('[WS] Erro:', e.message); }
            });
        });

        client.initialize().catch(err => {
            console.error('[WPP] Erro ao inicializar:', err.message);
        });
    } catch (err) {
        console.error('[WPP] Falha crítica:', err.message);
    }
}
