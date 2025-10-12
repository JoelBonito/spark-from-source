# 🚀 Guia de Migração - Lovable Cloud → Supabase

## 📋 Status da Migração

✅ **Estrutura do Banco de Dados**: Migrada  
✅ **Edge Function**: Deployada (v2.0 - Google Gemini)  
✅ **Variáveis de Ambiente**: Atualizadas  
✅ **Scripts de Migração**: Criados  
⏳ **Dados**: Aguardando execução dos scripts  
⏳ **Storage**: Aguardando execução dos scripts  

---

## 🎯 Próximos Passos

### 1️⃣ Configurar API do Google Gemini (OBRIGATÓRIO)

A Edge Function agora usa **Google Gemini diretamente** (sem depender do Lovable AI Gateway).

**Guia completo**: Veja o arquivo `CONFIGURAR_GEMINI.md`

**Resumo rápido:**

1. **Obter API Key do Google Gemini:**
   - Acesse: https://aistudio.google.com/app/apikey
   - Clique em "Create API key"
   - Copie a chave gerada

2. **Configurar Secret no Supabase:**
   - Acesse: https://supabase.com/dashboard/project/hqexulgmmtghwtgnqtfy/settings/functions
   - Vá em "Secrets"
   - Adicione:
     - **Nome**: `GEMINI_API_KEY`
     - **Valor**: Sua API key do Google Gemini

3. **Custos:**
   - Free tier: ~30-50 simulações/dia grátis
   - Pago: ~$0.04 por simulação (~R$ 0.21)
   - Veja detalhes completos em `CONFIGURAR_GEMINI.md`

### 2️⃣ Obter a Service Role Key (para migração de dados)

Para executar os scripts de migração, você precisa da **service_role key**:

1. Acesse: https://supabase.com/dashboard/project/hqexulgmmtghwtgnqtfy/settings/api
2. Na seção **"Project API keys"**, localize **"service_role"**
3. Clique em **"Reveal"** e copie a chave
4. **⚠️ IMPORTANTE**: Esta chave é secreta! Nunca a compartilhe ou commit no Git

### 3️⃣ Migrar os Dados (SE HOUVER DADOS NO LOVABLE)

Execute o script de migração de dados:

```bash
# 1. Instalar dependências (se ainda não fez)
npm install @supabase/supabase-js

# 2. Editar o arquivo migrate_data.js
# Substitua 'SUA_SERVICE_ROLE_KEY_AQUI' pela service_role key copiada

# 3. Executar a migração
node migrate_data.js
```

O script vai:
- ✅ Conectar ao Lovable Cloud (origem)
- ✅ Conectar ao Supabase (destino)
- ✅ Migrar todas as tabelas na ordem correta
- ✅ Exibir progresso e estatísticas

### 4️⃣ Migrar os Arquivos de Storage (SE HOUVER ARQUIVOS NO LOVABLE)

Execute o script de migração de storage:

```bash
# 1. Editar o arquivo migrate_storage.js
# Substitua 'SUA_SERVICE_ROLE_KEY_AQUI' pela service_role key copiada

# 2. Executar a migração
node migrate_storage.js
```

O script vai:
- ✅ Migrar bucket `budgets` (PDFs de orçamentos)
- ✅ Migrar bucket `technical-reports` (Relatórios técnicos)
- ✅ Migrar bucket `original-images` (Imagens originais)
- ✅ Migrar bucket `processed-images` (Imagens processadas)

### 5️⃣ Testar a Aplicação

Após a migração, teste todas as funcionalidades:

```bash
# Iniciar o servidor de desenvolvimento
npm run dev
```

**Checklist de Testes:**
- [ ] Login de usuário
- [ ] Cadastro de paciente
- [ ] Upload de imagem
- [ ] Simulação de facetas
- [ ] Simulação de clareamento (se habilitado)
- [ ] Geração de orçamento
- [ ] Geração de relatório técnico
- [ ] CRM (leads, atividades)
- [ ] Configurações do usuário

### 6️⃣ Configurar Autenticação

Configure os provedores de autenticação no Supabase:

1. Acesse: https://supabase.com/dashboard/project/hqexulgmmtghwtgnqtfy/auth/providers
2. Habilite os provedores necessários:
   - **Email** (autenticação por email/senha)
   - **Google** (se usar login social)
3. Configure as URLs:
   - **Site URL**: URL do seu site em produção
   - **Redirect URLs**: URLs permitidas após login

---

## 🔧 Configurações

### Variáveis de Ambiente

O arquivo `.env` já foi atualizado com as novas credenciais:

```env
VITE_SUPABASE_PROJECT_ID="hqexulgmmtghwtgnqtfy"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://hqexulgmmtghwtgnqtfy.supabase.co"
```

### Edge Function

A Edge Function `process-dental-facets` foi deployada em:
```
https://hqexulgmmtghwtgnqtfy.supabase.co/functions/v1/process-dental-facets
```

**Versão:** 2.0 (Google Gemini Direct)

**Secrets necessários:**
- `GEMINI_API_KEY`: Chave da API do Google Gemini (configure manualmente)

**Modelos usados:**
- Análise: `gemini-2.0-flash-exp`
- Geração de imagem: `gemini-2.0-flash-exp`

---

## 📊 Estrutura Migrada

### Tabelas (10)
- `activities` - Atividades do CRM
- `budgets` - Orçamentos
- `crm_leads` - Leads do CRM
- `leads` - Leads principais
- `patients` - Pacientes
- `reports` - Relatórios técnicos
- `services` - Serviços oferecidos
- `simulations` - Simulações realizadas
- `user_configs` - Configurações dos usuários
- `user_roles` - Roles dos usuários

### Storage Buckets (4)
- `budgets` - PDFs de orçamentos
- `technical-reports` - Relatórios técnicos em PDF
- `original-images` - Imagens originais das simulações
- `processed-images` - Imagens processadas/editadas

### Funções (3)
- `has_role()` - Verificação de roles
- `update_updated_at_column()` - Atualização automática de timestamps
- `create_lead_from_simulation()` - Criação automática de leads

### Triggers (6)
- Atualização automática de `updated_at` em várias tabelas
- Criação automática de lead após simulação

---

## 🚨 Troubleshooting

### Erro: "GEMINI_API_KEY não configurada"
**Solução**: Configure o secret no painel do Supabase. Veja `CONFIGURAR_GEMINI.md`.

### Erro: "API key not valid"
**Solução**: 
1. Verifique se a API key do Gemini está correta
2. Confirme que a API do Gemini está habilitada no Google Cloud
3. Tente gerar uma nova API key

### Erro: "Invalid API key" (scripts de migração)
**Solução**: Verifique se a service_role key está correta nos scripts de migração.

### Erro: "Bucket not found"
**Solução**: Os buckets foram criados automaticamente. Verifique no painel do Supabase.

### Dados não aparecem após migração
**Solução**: 
1. Verifique se os scripts de migração foram executados com sucesso
2. Verifique se as políticas RLS estão corretas
3. Verifique se o usuário está autenticado

### Erro: "Quota exceeded" (Gemini)
**Solução**: 
1. Você atingiu o limite do free tier do Google Gemini
2. Aguarde o reset diário (meia-noite UTC)
3. Ou habilite billing no Google Cloud

---

## 💰 Comparação de Custos

### Lovable Cloud
- **Free Tier**: Limitado
- **Pro**: ~$25-50/mês
- **Inclui**: Banco, Storage, Edge Functions, AI Gateway

### Supabase + Google Gemini
- **Supabase Free**: Generoso (500MB DB, 1GB storage)
- **Supabase Pro**: $25/mês (8GB DB, 100GB storage)
- **Gemini Free**: ~30-50 simulações/dia grátis
- **Gemini Pago**: ~$0.04/simulação (~R$ 0.21)

**Exemplo mensal:**
- 100 simulações: Supabase Free + Gemini Free = **$0/mês**
- 500 simulações: Supabase Free + Gemini = **~$20/mês**
- 1000 simulações: Supabase Pro + Gemini = **~$66/mês**

---

## 📞 Suporte

Se encontrar problemas:

1. **Documentação Supabase**: https://supabase.com/docs
2. **Discord Supabase**: https://discord.supabase.com
3. **Google AI Studio**: https://aistudio.google.com/
4. **Stack Overflow**: https://stackoverflow.com/questions/tagged/supabase

---

## 📝 Notas Importantes

### ⚠️ Service Role Key
- **NUNCA** commit a service_role key no Git
- Use apenas em scripts locais ou variáveis de ambiente seguras
- Esta chave tem acesso total ao banco de dados

### ⚠️ Gemini API Key
- Configure apenas como secret no Supabase
- **NUNCA** use no código frontend
- Monitore o uso no Google Cloud Console

### ⚠️ Migração de Dados
- Execute os scripts de migração **apenas uma vez**
- Faça backup antes de executar
- Teste em ambiente de desenvolvimento primeiro

### ⚠️ Lovable Cloud
- Não delete o projeto Lovable imediatamente
- Mantenha por 7-30 dias como backup
- Veja `INSTRUCOES_LOVABLE.md` para mais detalhes

---

## 📚 Documentação Adicional

- **CONFIGURAR_GEMINI.md** - Guia completo de configuração da API do Google Gemini
- **INSTRUCOES_LOVABLE.md** - O que fazer com o projeto Lovable Cloud
- **migrate_data.js** - Script de migração de dados
- **migrate_storage.js** - Script de migração de storage

---

**Data da Migração:** 12 de outubro de 2025  
**Projeto Origem:** Lovable Cloud  
**Projeto Destino:** Supabase (trusmile)  
**Edge Function:** v2.0 (Google Gemini Direct)  
**Status:** ✅ Estrutura migrada, aguardando migração de dados e configuração do Gemini

