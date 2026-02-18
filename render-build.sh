
#!/usr/bin/env bash
# exit on error
set -o errexit

echo "--- [BUILD] INSTALAÇÃO LEVE (BAILEYS) ---"

# Limpar rastros de tentativas anteriores com Puppeteer
rm -rf .chrome_stable
rm -rf .puppeteer_cache

# Instalação padrão
npm install --no-audit --no-fund

echo "--- [BUILD] CONCLUÍDO ---"
