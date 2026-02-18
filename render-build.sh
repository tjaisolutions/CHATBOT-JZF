#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- [BUILD] INICIANDO PROCESSO DE COMPILAÇÃO ---"

# 1. Limpeza e Preparação
export PUPPETEER_CACHE_DIR="$(pwd)/.puppeteer_cache"
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false

echo "--- [BUILD] Limpando caches antigos..."
rm -rf "$PUPPETEER_CACHE_DIR"
rm -rf .chrome_stable
mkdir -p "$PUPPETEER_CACHE_DIR"
mkdir -p .chrome_stable

# 2. Instalação de dependências
echo "--- [BUILD] Instalando dependências do projeto..."
npm install

# 3. Instalação forçada do Chrome via Puppeteer
echo "--- [BUILD] Baixando Chromium (Puppeteer CLI)..."
# Usamos o comando direto para garantir a instalação na pasta definida
npx puppeteer browsers install chrome --path "$PUPPETEER_CACHE_DIR"

# 4. Localização exaustiva do binário
echo "--- [BUILD] Localizando executável do Chrome..."
# O Puppeteer 21+ instala em caminhos como: .puppeteer_cache/chrome/linux-116.0.5845.96/chrome-linux/chrome
# Procuramos por qualquer arquivo chamado 'chrome' que seja executável
CHROME_BIN=$(find "$PUPPETEER_CACHE_DIR" -type f -name "chrome" -executable | head -n 1)

if [ -z "$CHROME_BIN" ]; then
    echo "!!! [ERRO] Binário do Chrome não encontrado em $PUPPETEER_CACHE_DIR"
    echo "--- [DEBUG] Listando estrutura de pastas para diagnóstico:"
    ls -R "$PUPPETEER_CACHE_DIR"
    exit 1
fi

echo "--- [BUILD] Sucesso! Chrome encontrado em: $CHROME_BIN"

# 5. Criação do link simbólico estável
# O servidor (server.js) vai procurar especificamente neste caminho
ln -sf "$CHROME_BIN" "$(pwd)/.chrome_stable/chrome"

echo "--- [BUILD] Link simbólico criado em: $(pwd)/.chrome_stable/chrome"
echo "--- [BUILD] Verificando link simbólico..."
ls -la .chrome_stable/chrome

echo "--- [BUILD] PROCESSO CONCLUÍDO COM SUCESSO ---"
