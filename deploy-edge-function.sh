#!/bin/bash

# Script de Deploy da Edge Function - Trusmile AI
# Autor: Claude Code
# Data: 2025-10-24

set -e  # Para o script se houver erro

echo "🚀 Deploy da Edge Function: process-dental-facets"
echo "================================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI não está instalado!${NC}"
    echo ""
    echo "Instale com um dos seguintes comandos:"
    echo "  npm install -g supabase"
    echo "  brew install supabase/tap/supabase"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Supabase CLI instalado${NC}"

# Verificar se está logado
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠️  Você não está logado no Supabase${NC}"
    echo "Fazendo login..."
    supabase login
fi

echo -e "${GREEN}✓ Autenticado no Supabase${NC}"

# Verificar se o projeto está linkado
if [ ! -f ".supabase/config.toml" ]; then
    echo -e "${YELLOW}⚠️  Projeto não está linkado${NC}"
    echo "Linkando ao projeto..."
    supabase link --project-ref hqexulgmmtghwtgnqtfy
fi

echo -e "${GREEN}✓ Projeto linkado${NC}"

# Verificar se os arquivos da Edge Function existem
if [ ! -f "supabase/functions/process-dental-facets/index.ts" ]; then
    echo -e "${RED}❌ Arquivo index.ts não encontrado!${NC}"
    echo "Certifique-se de estar no diretório raiz do projeto."
    exit 1
fi

if [ ! -f "supabase/functions/process-dental-facets/reportPrompts.ts" ]; then
    echo -e "${RED}❌ Arquivo reportPrompts.ts não encontrado!${NC}"
    echo "Este arquivo é necessário para a nova funcionalidade de relatórios."
    exit 1
fi

echo -e "${GREEN}✓ Arquivos da Edge Function encontrados${NC}"
echo ""

# Fazer deploy
echo "📦 Fazendo deploy da Edge Function..."
echo ""

supabase functions deploy process-dental-facets

echo ""
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo ""
echo "📊 Próximos passos:"
echo "  1. Verifique os logs: https://supabase.com/dashboard/project/hqexulgmmtghwtgnqtfy/logs/edge-functions"
echo "  2. Teste a aplicação: npm run dev"
echo "  3. Certifique-se de que GEMINI_API_KEY está configurada como secret no Supabase"
echo ""
echo -e "${YELLOW}⚠️  Lembre-se de limpar o cache do navegador (Ctrl+Shift+Del) antes de testar!${NC}"
echo ""
