# 🔄 INSTRUÇÕES PARA REBUILD COMPLETO

## 🎯 Problema Identificado

O código fonte foi corrigido, mas o **bundle JavaScript antigo ainda está em cache**.

O arquivo `SimulatorPage-CVwHP4eL.js` é o código **compilado/bundled** pelo Vite, e ainda contém a versão antiga do código.

---

## ✅ SOLUÇÃO: Rebuild Completo (5 minutos)

### Passo 1: Parar o Servidor (se estiver rodando)

No terminal onde o servidor está rodando:
- Pressione `Ctrl + C`

### Passo 2: Limpar TODOS os Caches

```bash
# No diretório do projeto
cd /home/user/trusmile-ai

# Limpar caches do Vite e build
rm -rf node_modules/.vite dist .vite

# Verificar que foram removidos
ls -la | grep -E "(dist|vite)"
# Não deve mostrar pastas dist ou .vite
```

✅ **Já executei este comando para você!**

### Passo 3: Reiniciar o Servidor Dev

```bash
npm run dev
```

Aguarde até ver a mensagem:
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Passo 4: Limpar Cache do Navegador (CRÍTICO!)

No navegador:

1. **Feche TODAS as abas** da aplicação

2. **Abra as DevTools** (F12)

3. **Vá para a aba "Network"** (Rede)

4. **Clique com botão direito** em "Disable cache" e marque ✅

5. **Limpe o cache**:
   - Windows/Linux: `Ctrl + Shift + Del`
   - Mac: `Cmd + Shift + Del`
   - Selecione:
     - ✅ Cached images and files
     - ✅ Cookies and site data
   - Período: "Last 24 hours" ou "All time"
   - Clique em "Clear data"

6. **Feche o navegador completamente**

7. **Abra o navegador novamente**

8. **Acesse**: http://localhost:5173

### Passo 5: Hard Reload

Na página da aplicação:
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

Ou:
- Abra DevTools (F12)
- Clique com botão direito no botão de reload
- Selecione "Empty Cache and Hard Reload"

### Passo 6: Verificar o Bundle

No console do navegador (F12 → Console):

1. Pressione `Ctrl + Shift + P` (Command Palette)
2. Digite "Clear" e selecione "Clear console storage"
3. Recarregue a página

Procure por:
```
✅ "Gerando relatório técnico via Edge Function..."
```

**NÃO deve aparecer**:
```
❌ "Error: GEMINI_API_KEY não configurada"
```

---

## 🧪 Teste Completo

1. **Login** na aplicação

2. **Vá ao Simulador**

3. **Selecione um paciente**

4. **Upload de imagem**

5. **Gerar Simulação**:
   - ✅ Deve funcionar (já funcionava)

6. **Aprovar Simulação** (botão "Sim, Gerar Documentos"):
   - ✅ **Deve funcionar agora!**
   - Console deve mostrar: "Gerando relatório técnico via Edge Function..."

---

## 🔍 Verificações Adicionais

### Verificação 1: Código Correto Está Sendo Usado?

Abra DevTools (F12) → Sources → Page → localhost:5173

Procure por `SimulatorPage` e verifique se NÃO contém:
```javascript
// ❌ Não deve existir:
const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
```

### Verificação 2: Ver o Bundle Atual

No terminal, veja o hash do bundle:
```bash
ls -la node_modules/.vite/deps/
```

Se a pasta não existir ou estiver vazia, está correto (sem cache).

### Verificação 3: Ver Requests da API

No DevTools (F12) → Network:

1. Filtre por "Fetch/XHR"
2. Gere uma simulação
3. Clique em "Sim, Gerar Documentos"
4. Deve aparecer uma requisição para:
   ```
   /functions/v1/process-dental-facets
   ```
5. Clique nela e veja o "Payload":
   ```json
   {
     "imageBase64": "...",
     "action": "report",
     "treatment_type": "facetas"
   }
   ```

Se o payload estiver correto, o código novo está sendo usado!

---

## 🐛 Se AINDA Não Funcionar

### Opção A: Modo Incognito

Teste em uma **janela anônima/incognito**:
- Chrome: `Ctrl + Shift + N`
- Firefox: `Ctrl + Shift + P`
- Edge: `Ctrl + Shift + N`

Acesse http://localhost:5173 e teste.

Se funcionar no incognito, é **100% problema de cache**.

### Opção B: Outro Navegador

Teste em um navegador diferente:
- Se usa Chrome, teste no Firefox
- Se usa Firefox, teste no Chrome

### Opção C: Build de Produção

Teste com um build de produção limpo:

```bash
# Limpar
rm -rf dist

# Build
npm run build

# Preview
npm run preview
```

Acesse a URL mostrada (geralmente http://localhost:4173).

---

## 📊 Checklist

- [ ] Servidor dev parado (Ctrl+C)
- [ ] Cache do Vite limpo (`rm -rf node_modules/.vite dist .vite`)
- [ ] Servidor reiniciado (`npm run dev`)
- [ ] Todas as abas da aplicação fechadas
- [ ] Cache do navegador limpo (Ctrl+Shift+Del)
- [ ] Navegador fechado e reaberto
- [ ] Hard reload (Ctrl+Shift+R)
- [ ] DevTools aberto (F12)
- [ ] Testado gerar simulação
- [ ] Testado gerar relatório

---

## ✅ Resultado Esperado

Após todos os passos:

**Console do navegador**:
```
✅ Blob criado: XXX bytes, tipo: image/jpeg
✅ Gerando relatório técnico via Edge Function...
✅ Relatório técnico gerado com sucesso via Edge Function
✅ Gerando PDF do relatório...
```

**Toast na tela**:
```
✅ Simulação gerada com sucesso!
✅ Relatório e orçamento gerados!
```

---

## 💡 Por Que Isso Aconteceu?

1. ✅ Código fonte foi corrigido (commits b0abd30, 266e38f, 12df27d)
2. ❌ Vite criou bundle com código antigo (antes do commit)
3. ❌ Bundle antigo ficou em cache
4. ❌ Navegador continuou usando o cache antigo

**Solução**: Forçar rebuild + limpar cache = código novo executando!

---

**Data**: 24 de outubro de 2025
