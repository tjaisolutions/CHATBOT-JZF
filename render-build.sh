#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- [BUILD] INICIANDO INSTALAÇÃO CORRIGIDA ---"

# 1. Definir caminhos ABSOLUTOS (Obrigatório para o Puppeteer no Render)
ABS_PATH=$(pwd)
CACHE_DIR="$ABS_PATH/.puppeteer_cache"
STABLE_DIR="$ABS_PATH/.chrome_stable"

echo "--- [BUILD] Caminho base: $ABS_PATH"

# Limpeza inicial
rm -rf "$CACHE_DIR"
rm -rf "$STABLE_DIR"
mkdir -p "$CACHE_DIR"
mkdir -p "$STABLE_DIR"

# 2. Instalação de dependências
npm install --no-audit --no-fund --quiet

# 3. Instalação do Chrome usando caminho ABSOLUTO
echo "--- [BUILD] Baixando Chromium em $CACHE_DIR..."
# Importante: o comando 'install' agora recebe o caminho absoluto via $(pwd)
npx puppeteer browsers install chrome --path "$CACHE_DIR"

# 4. Localização do binário
echo "--- [BUILD] Localizando executável..."
# O Puppeteer instala em subpastas complexas. O 'find' resolve isso.
CHROME_BIN=$(find "$CACHE_DIR" -type f -name "chrome" -executable | head -n 1)

if [ -z "$CHROME_BIN" ]; then
    echo "!!! ERRO: Falha ao localizar o binário do Chrome após instalação."
    ls -R "$CACHE_DIR"
    exit 1
fi

# Cria o link simbólico para o caminho que o servidor espera
ln -sf "$CHROME_BIN" "$STABLE_DIR/chrome"

echo "--- [BUILD] Sucesso! Chrome mapeado em: $STABLE_DIR/chrome"
echo "--- [BUILD] Verificando permissões..."
chmod +x "$STABLE_DIR/chrome"

echo "--- [BUILD] CONCLUÍDO ---"
