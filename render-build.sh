
#!/usr/bin/env bash
# exit on error
set -o errexit

# Instala as dependências do projeto
npm install

# Baixa o Chromium para o diretório de cache local do projeto
# Isso evita a necessidade de um navegador externo (Browserless)
echo "Baixando Chromium para o ambiente nativo..."
npx puppeteer install
