# Hidraup — Fale com o Diretor

Single-page estática, mobile-first, em português, para canal direto com a direção.  
**Sem dependências, sem build obrigatório, sem tracking, sem cookies, sem localStorage.**

---

## 📁 Estrutura

```
hidraup-fale-com-diretor/
├── public/                 # Arquivos servidos (source of truth)
│   ├── index.html          # HTML semântico, acessível
│   ├── styles.css          # CSS mobile-first, variáveis, reduced-motion
│   ├── app.js              # Lógica: validação, contador, honeypot, preview/live
│   ├── config.js           # Configuração (preview=true, endpoint vazio)
│   ├── assets/logo.png     # Brand icon (fornecido)
│   ├── vercel.json         # Headers CSP/segurança para Vercel (opcional)
│   ├── _headers            # Headers para Netlify/Cloudflare/Apache/Nginx
│   └── robots.txt          # noindex no modo prévia
├── build.py                # Copia public/ → dist/ (stdlib Python)
├── dist/                   # Gerado pelo build (não versionar)
└── README.md               # Este arquivo
```

---

## 🚀 Início Rápido

### Desenvolvimento local (sem build)
```bash
cd public
python3 -m http.server 8080
# Abra http://localhost:8080
```

### Build para produção
```bash
python3 build.py
# Gera ./dist/ pronto para deploy estático
```

### Testar build localmente
```bash
cd dist
python3 -m http.server 8080
```

---

## ⚙️ Configuração (`public/config.js`)

```js
window.HIDRAUP_CONFIG = {
  preview: true,              // true = prévia (não envia), false = live
  endpoint: "",               // HTTPS Google Apps Script Web App URL
  timeout: 15000,             // ms
  maxMessageLength: 10000,    // caracteres
  previewNotice: "Prévia para aprovação visual; mensagens não são enviadas nem armazenadas."
};
```

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `preview` | `true` | **Prévia**: não faz POST, mostra tela de sucesso simulada |
| `endpoint` | `""` | URL HTTPS do Apps Script (obrigatório se `preview: false`) |
| `timeout` | `15000` | Timeout do fetch em ms |
| `maxMessageLength` | `10000` | Limite de caracteres da mensagem |

---

## 🔧 Modo Live — Integração Google Apps Script

### Pré-requisitos no Apps Script
1. Crie um **Web App** (`Deploy > New deployment > Web App`)
2. **Execute as:** Me (seu usuário)
3. **Who has access:** Anyone with link
4. Código mínimo (`Code.gs`):

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    // Valide: data.mensagem obrigatória, etc.
    // Salve em Planilha, envie e-mail, etc.
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

### Requisitos técnicos (CORS + Response)
| Requisito | Detalhe |
|-----------|---------|
| **HTTPS** | Obrigatório |
| **Content-Type request** | `text/plain;charset=UTF-8` (evita preflight) |
| **Body** | `JSON.stringify(payload)` |
| **Response** | `2xx` + JSON `{ "ok": true }` |
| **CORS** | `Access-Control-Allow-Origin: <seu-domínio>` no `doOptions` ou no `doPost` |
| **Credentials** | **Não** enviar cookies/tokens (`credentials: 'omit'`) |
| **Redirects** | Se o Apps Script redirecionar (3xx), o destino final deve estar no `connect-src` |

### Ativar modo live
1. Edite `public/config.js`:
   ```js
   preview: false,
   endpoint: "https://script.google.com/macros/s/SEU_SCRIPT_ID/exec",
   ```
2. Atualize **CSP `connect-src`** em `vercel.json` e `_headers`:
   ```http
   Content-Security-Policy: ... connect-src 'self' https://script.google.com https://script.googleusercontent.com;
   ```
   (Ou o domínio exato do seu Web App)
3. Rode `python3 build.py` e faça deploy do `dist/`.

---

## 🛡️ Segurança & Privacidade

### O que **NÃO** há
- ❌ Cookies, localStorage, sessionStorage
- ❌ Analytics, tracking, pixels, beacons
- ❌ Fontes externas (Google Fonts, etc.)
- ❌ Scripts/CDNs de terceiros
- ❌ Service Workers
- ❌ Login, autenticação, tokens

### O que **EXISTE** (inevitável em hospedagem web)
- ✅ Logs de acesso do servidor/CDN (IP, User-Agent, timestamp, path)
- ✅ Cabeçalhos HTTP padrão

> **Nota honesta:** Este app não rastreia você. Seu provedor de hospedagem/CDN **pode** registrar endereço IP e metadados de requisição HTTP (logs de acesso padrão). Não prometemos anonimato absoluto de IP.

### Anti-spam: Honeypot
Campo invisível `website_url` (fora de tab order, `autocomplete=off`, `tabindex=-1`, `aria-hidden=true`).  
Se preenchido → **bloqueia silenciosamente** (não faz POST, não mostra erro).

---

## ♿ Acessibilidade

- Labels explícitos, `aria-describedby` para ajuda/erro/contador
- `aria-invalid` dinâmico, `role="alert"` para erros
- Foco visível (`:focus-visible`), ordem lógica de tab
- Touch targets ≥ 44px
- Contador de caracteres `aria-live="polite"`
- `prefers-reduced-motion` respeitado
- Sem overflow em 320px
- Contraste WCAG AA+

---

## 🧪 Testes Offline (sem `npm install`, sem `pytest`)

```bash
# 1. Validação HTML (requer Node.js)
node --check public/index.html 2>&1 || true

# 2. Sintaxe JS (Node built-in)
node --check public/app.js && echo "app.js OK"
node --check public/config.js && echo "config.js OK"

# 3. Sintaxe CSS (via Node - básico)
node -e "require('fs').readFileSync('public/styles.css','utf8')" && echo "styles.css legível"

# 4. Build
python3 build.py

# 5. Verifica arquivos essenciais em dist/
ls -la dist/
test -f dist/index.html && echo "index.html ✓"
test -f dist/styles.css && echo "styles.css ✓"
test -f dist/app.js && echo "app.js ✓"
test -f dist/config.js && echo "config.js ✓"
test -f dist/assets/logo.png && echo "logo.png ✓"
test -f dist/robots.txt && echo "robots.txt ✓"
test -f dist/_headers && echo "_headers ✓"
test -f dist/vercel.json && echo "vercel.json ✓"

# 6. Teste de servidor local (manual)
# cd dist && python3 -m http.server 8080
# Abra http://localhost:8080 e teste:
# - Contador de caracteres
# - Validação mensagem obrigatória
# - Honeypot (inspecione console)
# - Botão Voltar limpa formulário
# - Privacy details abre/fecha
# - Reduced motion (DevTools > Rendering > Emulate reduced motion)
# - 320px width (DevTools device toolbar)
```

---

## 📦 Deploy Portátil

### Vercel
```bash
# vercel.json já incluso
npx vercel deploy dist --prod
```

### Netlify / Cloudflare Pages / GitHub Pages / Firebase Hosting / Apache / Nginx
- Aponte a raiz do site para `dist/`
- `_headers` funciona no Netlify/Cloudflare
- Para Apache/Nginx, converta `_headers` para config nativa

### Cabeçalhos essenciais (qualquer servidor)
```
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'
robots.txt: User-agent: * / Disallow: /
```

---

## 🔒 CSP — Detalhamento

| Diretiva | Valor (preview) | Valor (live c/ Apps Script) |
|----------|-----------------|----------------------------|
| `default-src` | `'self'` | `'self'` |
| `script-src` | `'self'` | `'self'` |
| `style-src` | `'self'` | `'self'` |
| `img-src` | `'self' data:` | `'self' data:` |
| `font-src` | `'self'` | `'self'` |
| `connect-src` | `'self'` | `'self' https://script.google.com https://script.googleusercontent.com` |
| `frame-ancestors` | `'none'` | `'none'` |
| `base-uri` | `'self'` | `'self'` |
| `form-action` | `'self'` | `'self'` |

> **Importante:** No modo live, adicione **exatamente** o(s) domínio(s) do Apps Script no `connect-src`. Se houver redirect (3xx), inclua o destino final.

---

## 📝 Checklist de Produção

- [ ] `config.js`: `preview: false`, `endpoint` preenchido com HTTPS válido
- [ ] CSP `connect-src` atualizado com domínio do Apps Script
- [ ] Apps Script deployado como "Anyone with link", `doPost` retorna `{ok:true}`
- [ ] Apps Script CORS configurado (`Access-Control-Allow-Origin`)
- [ ] `robots.txt` atualizado se quiser indexar (remova `Disallow: /`)
- [ ] Build: `python3 build.py`
- [ ] Deploy `dist/`
- [ ] Teste end-to-end: envio real chega na planilha/e-mail do diretor

---

## 📄 Licença

Uso interno Hidraup. Código-fonte proprietário.
