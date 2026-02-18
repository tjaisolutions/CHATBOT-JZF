#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- [BUILD] INICIANDO LIMPEZA E INSTALAÇÃO ---"

# 1. Limpeza profunda
rm -rf .chrome_stable
rm -rf .puppeteer_cache
rm -rf node_modules/.cache/puppeteer

# 2. Configurações de ambiente para o instalador
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
export PUPPETEER_CACHE_DIR=$(pwd)/.puppeteer_cache

# 3. Instalação de dependências
echo "--- [BUILD] Instalando dependências do projeto..."
npm install --no-audit --no-fund --quiet

# 4. Forçar instalação do Chrome caso o npm install não o faça
echo "--- [BUILD] Garantindo instalação do Chrome..."
npx puppeteer browsers install chrome --path "$(pwd)/.puppeteer_cache"

# 5. Localização e Preparação do Binário
echo "--- [BUILD] Localizando executáveis..."
RAW_CHROME_BIN=$(find "$(pwd)/.puppeteer_cache" -type f -name "chrome" -executable | head -n 1)

if [ -z "$RAW_CHROME_BIN" ]; then
    echo "!!! ERRO: Binário do Chrome não encontrado!"
    exit 1
fi

CHROME_DIR=$(dirname "$RAW_CHROME_BIN")
mkdir -p .chrome_stable
echo "--- [BUILD] Movendo arquivos para pasta de produção..."
cp -r "$CHROME_DIR"/* .chrome_stable/

# 6. CORREÇÃO CRÍTICA DE PERMISSÕES (EACCES)
# No Render, às vezes precisamos dar permissão em toda a pasta, não só no executável
echo "--- [BUILD] Aplicando permissões de execução (chmod 755)..."
chmod -R 755 .chrome_stable/
find .chrome_stable/ -type f -exec chmod +x {} \;

echo "--- [BUILD] Verificando executável final..."
if [ -x ".chrome_stable/chrome" ]; then
    echo "--- [BUILD] SUCESSO: O Chrome está pronto e é executável."
    ls -l .chrome_stable/chrome
else
    echo "!!! ERRO: Falha ao conceder permissões ao binário."
    exit 1
fi

echo "--- [BUILD] PROCESSO CONCLUÍDO COM SUCESSO ---"
