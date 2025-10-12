# 🔑 Como Configurar a API do Google Gemini

## 📋 Visão Geral

A Edge Function agora usa **diretamente a API do Google Gemini**, eliminando a dependência do gateway Lovable AI. Você terá controle total sobre as chaves API e os custos.

---

## 🚀 Passo a Passo

### 1️⃣ Criar Conta no Google AI Studio

1. Acesse: https://aistudio.google.com/
2. Faça login com sua conta Google
3. Aceite os termos de serviço

### 2️⃣ Obter a API Key do Gemini

1. No Google AI Studio, clique em **"Get API key"** no menu lateral
2. Clique em **"Create API key"**
3. Selecione um projeto do Google Cloud (ou crie um novo)
4. Copie a API key gerada
5. **⚠️ IMPORTANTE**: Guarde esta chave em local seguro!

**Link direto**: https://aistudio.google.com/app/apikey

### 3️⃣ Configurar o Secret no Supabase

1. Acesse o painel do Supabase:
   ```
   https://supabase.com/dashboard/project/hqexulgmmtghwtgnqtfy/settings/functions
   ```

2. Vá na aba **"Secrets"**

3. Clique em **"Add Secret"**

4. Configure:
   - **Nome**: `GEMINI_API_KEY`
   - **Valor**: Cole a API key do Google Gemini

5. Clique em **"Save"**

### 4️⃣ Testar a Edge Function

Teste se a configuração está funcionando:

```bash
# No seu projeto local
npm run dev
```

Faça uma simulação de teste:
1. Faça login na aplicação
2. Faça upload de uma imagem dental
3. Execute uma simulação
4. Verifique se a análise e geração funcionam

---

## 💰 Custos da API do Google Gemini

### Modelo: Gemini 2.0 Flash (Usado na Edge Function)

**Preços (a partir de outubro de 2025):**

| Operação | Preço | Detalhes |
|----------|-------|----------|
| **Análise de Texto** | $0.075 / 1M tokens | Entrada de texto |
| **Análise de Imagem** | $0.30 / 1M tokens | Entrada de imagem |
| **Geração de Texto** | $0.30 / 1M tokens | Saída de texto |
| **Geração de Imagem** | $0.04 / imagem | Saída de imagem |

### Estimativa de Custo por Simulação

**Simulação Completa (Análise + Geração):**
- Análise de imagem: ~$0.001
- Geração de imagem: ~$0.04
- **Total por simulação**: ~$0.041 (aproximadamente R$ 0.21)

**Exemplo de uso mensal:**
- 100 simulações/mês: ~$4.10 (R$ 21)
- 500 simulações/mês: ~$20.50 (R$ 105)
- 1000 simulações/mês: ~$41.00 (R$ 210)

### Free Tier do Google Gemini

O Google oferece um **free tier generoso**:
- ✅ 15 requisições por minuto (RPM)
- ✅ 1 milhão de tokens por dia
- ✅ 1.500 requisições por dia

**Isso é suficiente para:**
- ~30-50 simulações por dia gratuitamente
- Ideal para testes e desenvolvimento
- Bom para clínicas pequenas/médias

---

## 🔒 Segurança da API Key

### ⚠️ NUNCA faça isso:
- ❌ Commit a API key no Git
- ❌ Compartilhe a API key publicamente
- ❌ Use a API key no código frontend

### ✅ Boas práticas:
- ✅ Use apenas em Edge Functions (backend)
- ✅ Configure como secret no Supabase
- ✅ Rotacione a chave periodicamente
- ✅ Monitore o uso no Google Cloud Console

---

## 📊 Monitorar Uso da API

### No Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Selecione seu projeto
3. Vá em **"APIs & Services"** → **"Dashboard"**
4. Clique em **"Generative Language API"**
5. Veja estatísticas de uso, quotas e custos

### Configurar Alertas de Custo

1. No Google Cloud Console, vá em **"Billing"**
2. Clique em **"Budgets & alerts"**
3. Crie um alerta para ser notificado quando atingir um limite
4. Exemplo: Alerta quando custo mensal > $10

---

## 🚨 Troubleshooting

### Erro: "GEMINI_API_KEY não configurada"

**Solução:**
1. Verifique se o secret foi criado no Supabase
2. Confirme que o nome é exatamente `GEMINI_API_KEY`
3. Aguarde ~30 segundos após criar o secret
4. Teste novamente

### Erro: "API key not valid"

**Solução:**
1. Verifique se a API key está correta
2. Confirme que a API do Gemini está habilitada no projeto
3. Verifique se não há espaços extras na chave
4. Tente gerar uma nova API key

### Erro: "Quota exceeded"

**Solução:**
1. Você atingiu o limite do free tier
2. Opções:
   - Aguarde o reset diário (meia-noite UTC)
   - Habilite billing no Google Cloud
   - Otimize o uso (cache, rate limiting)

### Erro: "Failed to generate image"

**Solução:**
1. Verifique se a imagem de entrada está no formato correto
2. Confirme que a imagem não é muito grande (max 4MB)
3. Tente com uma imagem diferente
4. Verifique os logs da Edge Function no Supabase

---

## 🔄 Migração do Lovable AI Gateway

### O que mudou?

**Antes (Lovable AI Gateway):**
```typescript
const apiKey = Deno.env.get('LOVABLE_API_KEY');
fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  headers: { Authorization: `Bearer ${apiKey}` }
});
```

**Agora (Google Gemini Direto):**
```typescript
const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
  // ...
});
```

### Vantagens da mudança:

✅ **Controle total**: Você gerencia suas próprias chaves  
✅ **Sem dependências**: Não depende do gateway Lovable  
✅ **Transparência**: Custos diretos do Google  
✅ **Flexibilidade**: Pode trocar de modelo facilmente  
✅ **Confiabilidade**: API oficial do Google  

---

## 📚 Recursos Úteis

- **Google AI Studio**: https://aistudio.google.com/
- **Documentação Gemini**: https://ai.google.dev/docs
- **Preços**: https://ai.google.dev/pricing
- **API Reference**: https://ai.google.dev/api
- **Google Cloud Console**: https://console.cloud.google.com/

---

## ✅ Checklist de Configuração

Antes de usar em produção:

- [ ] API key do Google Gemini criada
- [ ] Secret `GEMINI_API_KEY` configurado no Supabase
- [ ] Teste de simulação realizado com sucesso
- [ ] Alertas de custo configurados no Google Cloud
- [ ] Monitoramento de uso ativado
- [ ] Backup da API key guardado em local seguro
- [ ] Documentação atualizada para a equipe

---

**Data desta documentação:** 12 de outubro de 2025  
**Versão da Edge Function:** 2.0 (Google Gemini Direct)

