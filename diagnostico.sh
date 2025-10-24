#!/bin/bash

# Script de Diagnóstico - Trusmile AI
# Detecta por que o código antigo ainda está sendo servido

echo "🔍 DIAGNÓSTICO - Trusmile AI"
echo "========================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Verificar código fonte
echo "1️⃣ Verificando código fonte..."
if grep -q "action: 'report'" src/services/technicalReportService.ts; then
    echo -e "${GREEN}✅ technicalReportService.ts está CORRETO (usa Edge Function)${NC}"
else
    echo -e "${RED}❌ technicalReportService.ts está ERRADO (código antigo)${NC}"
fi

if grep -q "VITE_GEMINI_API_KEY" src/pages/simulator/SimulatorPage.tsx; then
    echo -e "${RED}❌ SimulatorPage.tsx contém VITE_GEMINI_API_KEY (código antigo)${NC}"
else
    echo -e "${GREEN}✅ SimulatorPage.tsx está CORRETO (sem referência a API key)${NC}"
fi

echo ""

# 2. Verificar arquivos de build
echo "2️⃣ Verificando arquivos de build/cache..."
if [ -d "dist" ]; then
    echo -e "${YELLOW}⚠️  Pasta 'dist' existe (build de produção)${NC}"
    echo "   → Remova com: rm -rf dist"
else
    echo -e "${GREEN}✅ Pasta 'dist' não existe${NC}"
fi

if [ -d "node_modules/.vite" ]; then
    echo -e "${YELLOW}⚠️  Cache do Vite existe (node_modules/.vite)${NC}"
    echo "   → Remova com: rm -rf node_modules/.vite"
else
    echo -e "${GREEN}✅ Cache do Vite limpo${NC}"
fi

if [ -d ".vite" ]; then
    echo -e "${YELLOW}⚠️  Pasta .vite existe${NC}"
    echo "   → Remova com: rm -rf .vite"
else
    echo -e "${GREEN}✅ Pasta .vite não existe${NC}"
fi

echo ""

# 3. Verificar processos rodando
echo "3️⃣ Verificando processos Node/Vite rodando..."
if pgrep -f "vite" > /dev/null; then
    echo -e "${YELLOW}⚠️  Processo Vite está rodando:${NC}"
    ps aux | grep vite | grep -v grep
    echo "   → Pare com: pkill -f vite"
elif pgrep -f "node.*vite" > /dev/null; then
    echo -e "${YELLOW}⚠️  Processo Node (Vite) está rodando:${NC}"
    ps aux | grep "node.*vite" | grep -v grep
    echo "   → Pare com: pkill -f 'node.*vite'"
else
    echo -e "${GREEN}✅ Nenhum processo Vite rodando${NC}"
fi

echo ""

# 4. Verificar configuração do Vite
echo "4️⃣ Verificando vite.config.ts..."
if [ -f "vite.config.ts" ]; then
    echo -e "${GREEN}✅ vite.config.ts encontrado${NC}"
    if grep -q "server:" vite.config.ts; then
        echo "   Configurações de servidor:"
        grep -A 5 "server:" vite.config.ts | head -6
    fi
else
    echo -e "${RED}❌ vite.config.ts não encontrado${NC}"
fi

echo ""

# 5. Verificar .env
echo "5️⃣ Verificando arquivo .env..."
if grep -q "VITE_GEMINI_API_KEY" .env 2>/dev/null; then
    echo -e "${RED}❌ .env contém VITE_GEMINI_API_KEY (REMOVA!)${NC}"
    echo "   Valor encontrado:"
    grep "VITE_GEMINI_API_KEY" .env
else
    echo -e "${GREEN}✅ .env não contém VITE_GEMINI_API_KEY${NC}"
fi

echo ""

# 6. Verificar últimos commits
echo "6️⃣ Últimos commits (código foi atualizado?)..."
git log --oneline -3
echo ""

# 7. Verificar status do git
echo "7️⃣ Status do Git (há mudanças não commitadas?)..."
if git diff --quiet; then
    echo -e "${GREEN}✅ Nenhuma mudança não commitada${NC}"
else
    echo -e "${YELLOW}⚠️  Há mudanças não commitadas:${NC}"
    git diff --name-only
fi

echo ""

# 8. Recomendações
echo "========================================"
echo "📋 RECOMENDAÇÕES:"
echo ""

if [ -d "node_modules/.vite" ] || [ -d ".vite" ] || [ -d "dist" ]; then
    echo "1. Limpar cache e build:"
    echo "   ${YELLOW}rm -rf node_modules/.vite .vite dist${NC}"
    echo ""
fi

if pgrep -f "vite" > /dev/null || pgrep -f "node.*vite" > /dev/null; then
    echo "2. Parar servidor atual:"
    echo "   ${YELLOW}pkill -f vite${NC}"
    echo "   ou pressione Ctrl+C no terminal onde está rodando"
    echo ""
fi

echo "3. Reiniciar servidor dev:"
echo "   ${YELLOW}npm run dev${NC}"
echo ""

echo "4. No navegador (janela anônima):"
echo "   - Abra DevTools (F12)"
echo "   - Vá em Network"
echo "   - Marque 'Disable cache'"
echo "   - Hard reload (Ctrl+Shift+R)"
echo ""

echo "========================================"
echo "🔍 Fim do diagnóstico"
echo ""
