#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- [BUILD] INICIANDO INSTALAÇÃO OTIMIZADA ---"

# 1. Limpeza de ambiente
rm -rf .chrome_stable
mkdir -p .chrome_stable

# 2. Instalação de dependências sem logs excessivos
# Forçar o download do Chromium pelo Puppeteer durante o npm install
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
npm install --no-audit --no-fund --quiet

# 3. Localização do binário nativo do Puppeteer
echo "--- [BUILD] Localizando binário do Chrome instalado via NPM..."
# O Puppeteer instala o chrome dentro de node_modules/.cache/puppeteer
CHROME_BIN=$(find node_modules/.cache/puppeteer -type f -name "chrome" -executable | head -n 1)

if [ -z "$CHROME_BIN" ]; then
    # Fallback se não encontrar no cache
    echo "--- [BUILD] Binário não encontrado no cache. Tentando instalação manual..."
    ABS_PATH=$(pwd)
    npx puppeteer browsers install chrome --path "$ABS_PATH/.chrome_stable"
    CHROME_BIN=$(find "$ABS_PATH/.chrome_stable" -type f -name "chrome" -executable | head -n 1)
fi

if [ -z "$CHROME_BIN" ]; then
    echo "!!! ERRO CRÍTICO: Não foi possível instalar o Chrome."
    exit 1
fi

# 4. Linkagem e permissões
ln -sf "$(realpath "$CHROME_BIN")" .chrome_stable/chrome
chmod +x .chrome_stable/chrome

echo "--- [BUILD] Chrome pronto em: .chrome_stable/chrome"
echo "--- [BUILD] Concluído! ---"
