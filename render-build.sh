#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- [BUILD] INICIANDO INSTALAÇÃO OTIMIZADA ---"

# 1. Limpeza de ambiente para garantir espaço em disco
rm -rf .puppeteer_cache
rm -rf .chrome_stable
mkdir -p .puppeteer_cache
mkdir -p .chrome_stable

# 2. Instalação de dependências sem logs excessivos (economiza memória de log)
npm install --no-audit --no-fund --quiet

# 3. Instalação do Chrome via Puppeteer (apenas os binários necessários para Linux)
echo "--- [BUILD] Baixando binários do Chromium..."
npx puppeteer browsers install chrome --path ./.puppeteer_cache

# 4. Localização e Linkagem do Binário
# O caminho no Puppeteer 22+ é dinâmico, por isso usamos o find
CHROME_BIN=$(find ./.puppeteer_cache -type f -name "chrome" -executable | head -n 1)

if [ -z "$CHROME_BIN" ]; then
    echo "!!! ERRO: Binário do Chrome não encontrado."
    exit 1
fi

# Criamos um link fixo que o server.js conhece
ln -sf "$CHROME_BIN" ./.chrome_stable/chrome

echo "--- [BUILD] Sucesso! Chrome mapeado em ./.chrome_stable/chrome"
echo "--- [BUILD] Concluído com sucesso ---"
