
#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- INICIANDO BUILD ---"

# Instala as dependências do projeto
npm install

# Baixa o Chromium para o diretório de cache local do projeto
echo "Instalando Chromium via Puppeteer..."
npx puppeteer install

# Encontra o executável do Chrome e cria um link simbólico estável
echo "Verificando local de instalação do Chromium..."
CHROME_BIN=$(find /opt/render/project/src/.cache/puppeteer -name chrome -type f | head -n 1)

if [ -z "$CHROME_BIN" ]; then
    echo "ERRO: Binário do Chromium não encontrado após a instalação!"
    exit 1
else
    echo "Chromium encontrado em: $CHROME_BIN"
fi

mkdir -p /opt/render/project/src/.cache/stable
ln -sf "$CHROME_BIN" /opt/render/project/src/.cache/stable/chrome
echo "Link simbólico criado em: /opt/render/project/src/.cache/stable/chrome"

echo "--- BUILD FINALIZADO COM SUCESSO ---"
