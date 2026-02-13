#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- INICIANDO BUILD CUSTOMIZADO ---"

# Instala as dependências do projeto
npm install

# Define o diretório de cache do puppeteer como uma pasta local no projeto
export PUPPETEER_CACHE_DIR="$(pwd)/.puppeteer_cache"
mkdir -p "$PUPPETEER_CACHE_DIR"

echo "Instalando Chromium no diretório: $PUPPETEER_CACHE_DIR"
npx puppeteer install

# Encontra o executável do Chrome de forma dinâmica no diretório de cache recém-criado
echo "Localizando binário do Chromium..."
CHROME_BIN=$(find "$PUPPETEER_CACHE_DIR" -name chrome -type f | head -n 1)

if [ -z "$CHROME_BIN" ]; then
    echo "ERRO: Binário do Chromium não encontrado em $PUPPETEER_CACHE_DIR"
    exit 1
else
    echo "Chromium encontrado em: $CHROME_BIN"
fi

# Cria um link simbólico estável para o servidor Node encontrar facilmente
mkdir -p "$(pwd)/.chrome_stable"
ln -sf "$CHROME_BIN" "$(pwd)/.chrome_stable/chrome"

echo "Link simbólico criado em: $(pwd)/.chrome_stable/chrome"
echo "--- BUILD FINALIZADO COM SUCESSO ---"