# 🔑 SOLUÇÃO RÁPIDA: Configurar GEMINI_API_KEY

## ⚠️ ERRO ATUAL

```
Error: GEMINI_API_KEY não configurada
```

**Causa**: O secret `GEMINI_API_KEY` não está configurado no Supabase.

---

## ✅ SOLUÇÃO (3 minutos)

### Passo 1: Obter Chave do Google Gemini

1. Acesse: https://aistudio.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em **"Create API key"** (ou "Get API key")
4. Selecione um projeto do Google Cloud (ou crie um novo)
5. **COPIE** a API key gerada (ex: `AIzaSy...`)

💡 **Dica**: Guarde esta chave em um local seguro!

---

### Passo 2: Configurar Secret no Supabase

1. **Abra este link**:
   👉 https://supabase.com/dashboard/project/hqexulgmmtghwtgnqtfy/settings/functions

2. **Clique na aba "Secrets"** (pode estar como "Environment Variables")

3. **Clique em "Add Secret"** ou "+ New Secret"

4. **Preencha**:
   ```
   Name:  GEMINI_API_KEY
   Value: [Cole aqui a chave que você copiou do Google]
   ```

   ⚠️ **IMPORTANTE**:
   - O nome deve ser EXATAMENTE `GEMINI_API_KEY` (sem VITE_)
   - Cole a chave SEM espaços ou aspas

5. **Clique em "Save"** ou "Add"

---

### Passo 3: Aguarde e Teste

1. **Aguarde 10-30 segundos** (para o Supabase propagar o secret)

2. **No navegador**:
   - Pressione `Ctrl + Shift + R` (hard refresh)
   - Ou limpe o cache: `Ctrl + Shift + Del`

3. **Teste novamente**:
   - Faça upload de uma imagem
   - Clique em "Gerar Simulação"
   - Depois clique em "Sim, Gerar Documentos"

---

## ✅ Resultado Esperado

Você deve ver no console:

```
✅ Gerando relatório técnico via Edge Function...
✅ Gerando PDF do relatório...
✅ Relatório e orçamento gerados!
```

**NÃO deve mais aparecer**:
```
❌ Error: GEMINI_API_KEY não configurada
```

---

## 🐛 Se Ainda Não Funcionar

### Verificação 1: Secret está correto?

No Supabase, verifique se o secret aparece assim:

```
GEMINI_API_KEY = AIzaSy... (oculto)
```

Se aparecer como `VITE_GEMINI_API_KEY`, está errado! Renomeie para `GEMINI_API_KEY`.

### Verificação 2: Chave é válida?

Teste sua chave diretamente:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=SUA_CHAVE_AQUI" \
  -H 'Content-Type: application/json' \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

Se retornar erro 400/403, a chave está inválida. Gere uma nova no Google AI Studio.

### Verificação 3: Edge Function foi deployada?

A Edge Function precisa estar deployada para reconhecer o secret.

Se você modificou o código da Edge Function, faça deploy:

```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref hqexulgmmtghwtgnqtfy

# Deploy
supabase functions deploy process-dental-facets
```

---

## 📊 Checklist Rápido

- [ ] Chave do Google Gemini criada
- [ ] Secret `GEMINI_API_KEY` adicionado no Supabase
- [ ] Nome do secret é exatamente `GEMINI_API_KEY` (sem VITE_)
- [ ] Aguardei 30 segundos após salvar
- [ ] Dei hard refresh no navegador (Ctrl+Shift+R)
- [ ] Testei fazer uma nova simulação

---

## 💡 Por Que Esse Erro Aconteceu?

A Edge Function `process-dental-facets` tenta ler a chave da API assim:

```typescript
const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
if (!geminiApiKey) {
  throw new Error('GEMINI_API_KEY não configurada.');
}
```

Se o secret não existir no Supabase, `geminiApiKey` será `undefined` e o erro é lançado.

---

## 🎯 Resumo

**Problema**: Secret não configurado no Supabase
**Solução**: Adicionar `GEMINI_API_KEY` como secret
**Tempo**: ~3 minutos
**Resultado**: Geração de relatórios funcionando! ✅

---

**Data**: 24 de outubro de 2025
