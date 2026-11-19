# Hidraup | Fale com o Diretor

Prévia visual em HTML/CSS/JS puro. Sem dependências de execução, sem login, sem analytics, sem cookies ou armazenamento local. Apenas mensagem é obrigatória. Tipo oferece Sugestão, Reclamação e Denúncia. Identificação é opcional.

## Estado atual
`public/config.js`: `preview: true`, endpoint vazio. O envio apenas mostra agradecimento. Nenhuma mensagem é enviada ou salva. E-mail do diretor, Apps Script, planilha privada, domínio e QR ainda não foram configurados.

## Arquivos e publicação
- `public/`: HTML, CSS, JS, logo local e robots noindex.
- `vercel.json` na raiz: outputDirectory public, CSP self e Referrer-Policy no-referrer.
- `build.py`: cópia opcional de public para dist usando Python padrão.
- `_headers`: referência portátil para servidores compatíveis, não usado pela Vercel.

GitHub privado conectado à Vercel existente, sem compra ou upgrade. A Vercel publica a pasta public a partir do commit em main. Não há build Node obrigatório.

## Testes
Sintaxe: `node --check public/app.js` e `node --check public/config.js`.
Build opcional: `python3 build.py`.
Validar em navegador limpo: 320/390/1440px; mensagem vazia, espaços e acima de10000 bloqueados; honeypot; envio só com mensagem; agradecimento/reset; nenhuma requisição externa ou POST; cookies/localStorage/sessionStorage vazios. Conferir cabeçalhos HTTPS após cada publicação. JS de teste de desenvolvimento pode usar Playwright, sem adicioná-lo ao site publicado.

## Integração futura
A base tem um ponto de configuração para POST text/plain. O modo real não está ativado nem validado ponta a ponta. Antes de ativar, definir destinatário e acesso à planilha, implementar e revisar backend, validar CORS/redirecionamentos/resposta de sucesso, ajustar CSP para destinos exatos e testar erros e anti-spam também no servidor. Honeypot e limite de caracteres no navegador não substituem proteção no backend.

## Identidade visual
Logo local e detalhes de marca/contato obtidos do site oficial. Arial local, navy #111827, azul #2563eb, botões10px e rodapé #030712. Links sociais são âncoras, sem embeds ou bibliotecas externas. Fontes: https://www.hidraup.com.br/ e https://www.hidraup.com.br/empresa.html, consultadas em19/11/2026.
