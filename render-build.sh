#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- [BUILD] INICIANDO INSTALAÇÃO ROBUSTA ---"

# 1. Limpeza total de caches e diretórios anteriores
rm -rf .chrome_stable
rm -rf node_modules/.cache/puppeteer
mkdir -p .chrome_stable

# 2. Instalação de dependências
# Forçamos o download do Chrome pelo Puppeteer
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
npm install --no-audit --no-fund --quiet

# 3. Localização do binário nativo
echo "--- [BUILD] Localizando binário do Chrome..."
# O Puppeteer 22+ instala em subdiretórios específicos dentro de .cache
RAW_CHROME_BIN=$(find node_modules/.cache/puppeteer -type f -name "chrome" -executable | head -n 1)

if [ -z "$RAW_CHROME_BIN" ]; then
    echo "--- [BUILD] Binário não encontrado no cache local. Tentando npx puppeteer..."
    ABS_PATH=$(pwd)
    npx puppeteer browsers install chrome --path "$ABS_PATH/.puppeteer_cache"
    RAW_CHROME_BIN=$(find "$ABS_PATH/.puppeteer_cache" -type f -name "chrome" -executable | head -n 1)
fi

if [ -z "$RAW_CHROME_BIN" ]; then
    echo "!!! ERRO CRÍTICO: Binário do Chrome não encontrado após todas as tentativas."
    exit 1
fi

echo "--- [BUILD] Binário encontrado em: $RAW_CHROME_BIN"

# 4. Copiar o binário em vez de linkar (evita erros EACCES de symlinks no Render)
# Copiamos o binário e os recursos necessários da pasta do Chrome
CHROME_DIR=$(dirname "$RAW_CHROME_BIN")
echo "--- [BUILD] Copiando arquivos do Chrome para pasta estável..."
cp -r "$CHROME_DIR/." .chrome_stable/

# 5. Garantir permissões de execução RECURSIVAMENTE
echo "--- [BUILD] Aplicando permissões de execução..."
chmod -R 755 .chrome_stable/
chmod +x .chrome_stable/chrome

# 6. Verificação final
if [ -x ".chrome_stable/chrome" ]; then
    echo "--- [BUILD] SUCESSO: .chrome_stable/chrome é executável."
else
    echo "!!! ERRO: .chrome_stable/chrome NÃO tem permissão de execução."
    exit 1
fi

echo "--- [BUILD] CONCLUÍDO ---"
