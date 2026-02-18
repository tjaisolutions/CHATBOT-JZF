#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- [BUILD] INICIANDO BUILD OTIMIZADO ---"

# 1. Configurações de Ambiente
export PUPPETEER_CACHE_DIR="$(pwd)/.puppeteer_cache"
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false

# Limpeza profunda inicial
rm -rf "$PUPPETEER_CACHE_DIR"
rm -rf .chrome_stable
mkdir -p "$PUPPETEER_CACHE_DIR"
mkdir -p .chrome_stable

# 2. Instalação rápida
echo "--- [BUILD] Instalando pacotes (npm install)..."
npm install --no-audit --no-fund

# 3. Instalação do Chrome (Versão específica estável)
echo "--- [BUILD] Baixando Chromium..."
npx puppeteer browsers install chrome --path "$PUPPETEER_CACHE_DIR"

# 4. Localização precisa
echo "--- [BUILD] Criando links de execução..."
# Busca o binário instalado na estrutura de pastas do Puppeteer 22+
# O caminho costuma ser .puppeteer_cache/chrome/linux-<id>/chrome-linux64/chrome
CHROME_PATH=$(find "$PUPPETEER_CACHE_DIR" -type f -name "chrome" -executable | head -n 1)

if [ -z "$CHROME_PATH" ]; then
    echo "!!! ERRO CRÍTICO: Binário não encontrado após instalação."
    exit 1
fi

ln -sf "$CHROME_PATH" "$(pwd)/.chrome_stable/chrome"

echo "--- [BUILD] Sucesso! Binário em: $CHROME_PATH"
echo "--- [BUILD] FINALIZADO ---"