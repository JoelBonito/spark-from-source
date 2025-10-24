# 🚀 Como Fazer Deploy da Edge Function

## 📋 Situação Atual

✅ **Código corrigido e commitado** (commit b0abd30)
⚠️ **Edge Function precisa ser deployada no Supabase**

---

## 🎯 O Que Precisa Ser Feito

A Edge Function `process-dental-facets` foi atualizada com a nova action `'report'` que permite gerar relatórios técnicos de forma segura usando a API key do backend.

**Antes de usar a aplicação, você DEVE fazer deploy desta função atualizada.**

---

## 🔧 MÉTODO 1: Via Supabase CLI (Recomendado)

### Passo 1: Instalar Supabase CLI

```bash
npm install -g supabase
```

Ou via Homebrew (macOS):
```bash
brew install supabase/tap/supabase
```

### Passo 2: Login no Supabase

```bash
supabase login
```

Isso abrirá um navegador para você fazer login.

### Passo 3: Link ao Projeto

```bash
supabase link --project-ref hqexulgmmtghwtgnqtfy
```

Quando solicitado, forneça:
- **Database password**: (senha do banco de dados do Supabase)

### Passo 4: Deploy da Edge Function

```bash
supabase functions deploy process-dental-facets
```

Aguarde a mensagem de sucesso:
```
Deployed Function process-dental-facets to Supabase.
```

### Passo 5: Verificar o Deploy

```bash
supabase functions list
```

Você deve ver `process-dental-facets` na lista com status "Active".

---

## 🌐 MÉTODO 2: Via Supabase Dashboard (Manual)

Se você não conseguir usar o CLI, pode fazer deploy manual:

### Opção A: Push para GitHub e Deploy Automático

1. **Verifique se o GitHub está integrado**:
   - Acesse: https://supabase.com/dashboard/project/hqexulgmmtghwtgnqtfy/settings/integrations
   - Procure por "GitHub"

2. **Se integrado**:
   - Faça push do código para o GitHub (já feito)
   - O Supabase detectará as mudanças automaticamente
   - Vá em https://supabase.com/dashboard/project/hqexulgmmtghwtgnqtfy/functions
   - Clique em "Deploy" se solicitado

### Opção B: Upload Manual dos Arquivos

1. **Acesse o Dashboard**:
   - https://supabase.com/dashboard/project/hqexulgmmtghwtgnqtfy/functions

2. **Edite a função**:
   - Clique em `process-dental-facets`
   - Clique em "Edit Function"

3. **Cole os arquivos atualizados**:
   - `index.ts` (arquivo principal)
   - `reportPrompts.ts` (novo arquivo com prompts)
   - `prompts.ts` (arquivo existente)

4. **Clique em "Deploy"**

---

## 🧪 MÉTODO 3: Testar Localmente Primeiro

Você pode rodar a Edge Function localmente antes de fazer deploy:

### Passo 1: Iniciar Supabase Local

```bash
supabase start
```

### Passo 2: Servir a Edge Function Localmente

```bash
supabase functions serve process-dental-facets --env-file .env
```

### Passo 3: Testar com curl

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/process-dental-facets' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"imageBase64":"data:image/jpeg;base64,...","action":"report","treatment_type":"facetas"}'
```

---

## ✅ Verificar se o Deploy Funcionou

### Teste 1: Via Dashboard

1. Acesse: https://supabase.com/dashboard/project/hqexulgmmtghwtgnqtfy/functions
2. Clique em `process-dental-facets`
3. Veja se a data de "Last deployed" é recente
4. Verifique se não há erros

### Teste 2: Via Aplicação

1. Reinicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Limpe o cache do navegador: `Ctrl + Shift + Del`

3. Faça login na aplicação

4. Crie uma nova simulação:
   - Selecione um paciente
   - Faça upload de uma imagem
   - Clique em "Gerar Simulação"
   - **Foto deve ser gerada** ✅

5. Aprove a simulação:
   - Clique em "Sim, Gerar Documentos"
   - **Relatório técnico deve ser gerado sem erros** ✅
   - Não deve aparecer erro de "GEMINI_API_KEY não configurada"

### Teste 3: Ver Logs da Edge Function

1. Acesse: https://supabase.com/dashboard/project/hqexulgmmtghwtgnqtfy/logs/edge-functions

2. Filtre por `process-dental-facets`

3. Procure por logs recentes como:
   ```
   [abc12345] ℹ️  RELATÓRIO TÉCNICO - Tipo: facetas
   [abc12345] ✓ Relatório técnico gerado com sucesso
   ```

---

## 🐛 Troubleshooting

### Erro: "supabase: command not found"

**Solução**: Instale o Supabase CLI:
```bash
npm install -g supabase
```

### Erro: "Function not found"

**Solução**: Verifique se você está no diretório correto:
```bash
cd /home/user/trusmile-ai
supabase functions list
```

### Erro: "Invalid access token"

**Solução**: Faça login novamente:
```bash
supabase logout
supabase login
```

### Erro: "GEMINI_API_KEY not configured" (na Edge Function)

**Solução**: Configure o secret no Supabase:

1. Acesse: https://supabase.com/dashboard/project/hqexulgmmtghwtgnqtfy/settings/functions
2. Vá em "Secrets"
3. Adicione:
   - Nome: `GEMINI_API_KEY`
   - Valor: Sua chave do Google Gemini
4. Clique em "Save"
5. Faça deploy novamente da função

### Erro: "GEMINI_API_KEY not configured" (no frontend)

**Solução**: Isso significa que o código antigo ainda está rodando.

1. **Pare o servidor de desenvolvimento**: `Ctrl + C`

2. **Limpe o cache do npm**:
   ```bash
   rm -rf node_modules/.vite
   ```

3. **Reinicie o servidor**:
   ```bash
   npm run dev
   ```

4. **Limpe o cache do navegador**: `Ctrl + Shift + Del` → Limpar cache

5. **Teste novamente**

---

## 📦 Verificar Arquivos da Edge Function

Para garantir que os arquivos corretos estão no projeto:

```bash
# Ver estrutura de arquivos
ls -la supabase/functions/process-dental-facets/

# Deve mostrar:
# - index.ts
# - prompts.ts
# - reportPrompts.ts
```

Verifique se `reportPrompts.ts` existe:
```bash
cat supabase/functions/process-dental-facets/reportPrompts.ts | head -20
```

Deve mostrar os prompts de relatório (FACETAS_REPORT_PROMPT e CLAREAMENTO_REPORT_PROMPT).

---

## 🎯 Checklist Final

Antes de testar na aplicação:

- [ ] Edge Function deployada no Supabase
- [ ] Secret `GEMINI_API_KEY` configurado no Supabase
- [ ] Servidor de desenvolvimento reiniciado
- [ ] Cache do navegador limpo
- [ ] Logs da Edge Function sem erros
- [ ] Arquivo `.env` NÃO contém `VITE_GEMINI_API_KEY`

---

## 📞 Se Precisar de Ajuda

1. **Verifique os logs da Edge Function**:
   https://supabase.com/dashboard/project/hqexulgmmtghwtgnqtfy/logs/edge-functions

2. **Verifique o console do navegador** (F12):
   - Procure por erros relacionados a "supabase.functions.invoke"
   - Verifique se a requisição está sendo feita com `action: 'report'`

3. **Teste a Edge Function diretamente**:
   - Use o "Test" no Dashboard do Supabase
   - Envie um payload de teste com `action: 'report'`

---

## ✅ Resultado Esperado

Após o deploy bem-sucedido:

1. **Geração de foto simulada**: ✅ Funciona (já funcionava)
2. **Geração de relatório técnico**: ✅ Funciona via Edge Function
3. **Segurança**: ✅ API key protegida no backend
4. **Logs**: ✅ Todos os processos logados no Supabase

**Nenhum erro de "GEMINI_API_KEY não configurada" deve aparecer.**

---

**Data deste guia:** 24 de outubro de 2025
**Commit de referência:** b0abd30
