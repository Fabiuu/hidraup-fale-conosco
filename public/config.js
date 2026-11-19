/**
 * Configuração do formulário "Fale com o Diretor"
 * 
 * PREVIEW MODE (padrão): preview = true
 * - Mensagens NÃO são enviadas nem armazenadas
 * - Endpoint é ignorado
 * 
 * LIVE MODE: preview = false
 * - Requer endpoint HTTPS válido (Google Apps Script Web App)
 * - POST com Content-Type: text/plain; JSON.stringify(payload)
 * - Exige response.ok E JSON { ok: true }
 * - Sem credenciais/token; CORS deve permitir origin do site
 * - Redirect destination deve ser allowlisted no CSP connect-src
 */

window.HIDRAUP_CONFIG = {
  // Modo prévia: true = não envia, false = envia para endpoint
  preview: true,
  
  // Endpoint HTTPS do Google Apps Script (Web App deployado como "Anyone with link")
  // Deve aceitar POST com Content-Type: text/plain
  // Resposta esperada: { "ok": true } com status 2xx
  endpoint: "",
  
  // Timeout da requisição em ms
  timeout: 15000,
  
  // Limite de caracteres da mensagem
  maxMessageLength: 10000,
  
  // Texto do modo prévia
  previewNotice: "Prévia para aprovação visual; mensagens não são enviadas nem armazenadas."
};
