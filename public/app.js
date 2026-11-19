/**
 * Hidraup — Ouvidoria: Fale Conosco
 * Lógica do formulário: validação, contador, prévia/live, honeypot
 * Sem dependências, sem tracking, sem armazenamento local
 */

(function() {
  'use strict';

  // ---- Configuração (carregada de config.js) ----
  const config = window.HIDRAUP_CONFIG || {
    preview: true,
    endpoint: '',
    timeout: 15000,
    maxMessageLength: 10000,
    previewNotice: 'Prévia para aprovação visual; mensagens não são enviadas nem armazenadas.'
  };

  // ---- Elementos DOM ----
  const form = document.getElementById('contact-form');
  const successScreen = document.getElementById('success-screen');
  const backBtn = document.getElementById('back-btn');
  const submitBtn = document.getElementById('submit-btn');
  const previewBanner = document.getElementById('preview-banner');
  const previewText = document.getElementById('preview-text');
  
  // Campos
  const fields = {
    tipo: document.getElementById('tipo'),
    identificacao: document.getElementById('identificacao'),
    nome: document.getElementById('nome'),
    setor: document.getElementById('setor'),
    contato: document.getElementById('contato'),
    mensagem: document.getElementById('mensagem')
  };
  
  // Honeypot
  const honeypot = document.getElementById('website-url');
  
  // Contador de caracteres
  const charCurrent = document.getElementById('char-current');
  const charCountEl = document.getElementById('mensagem-count');
  const mensagemError = document.getElementById('mensagem-error');

  // ---- Inicialização ----
  function init() {
    // Banner de prévia
    if (previewText && config.previewNotice) {
      previewText.textContent = config.previewNotice;
    }
    
    // Esconder banner se não for prévia
    if (!config.preview && previewBanner) {
      previewBanner.hidden = true;
    }
    
    // Event listeners
    setupEventListeners();
    
    // Contador inicial
    updateCharCount();
    
    // Foco inicial no primeiro campo (mobile friendly)

  }

  // ---- Event Listeners ----
  function setupEventListeners() {
    // Contador de caracteres em tempo real
    fields.mensagem.addEventListener('input', updateCharCount);
    
    // Validação ao blur (menos intrusivo)
    Object.values(fields).forEach(field => {
      field.addEventListener('blur', () => validateField(field), { passive: true });
    });
    
    // Submit do formulário
    form.addEventListener('submit', handleSubmit);
    
    // Botão voltar
    backBtn.addEventListener('click', resetForm);
    
    // Prevenir autocomplete no honeypot
    if (honeypot) {
      honeypot.setAttribute('autocomplete', 'off');
      honeypot.setAttribute('tabindex', '-1');
    }
  }

  // ---- Contador de caracteres ----
  function updateCharCount() {
    const length = fields.mensagem.value.length;
    const max = config.maxMessageLength;
    
    if (charCurrent) charCurrent.textContent = length;
    
    // Classes visuais
    charCountEl.classList.remove('warning', 'error');
    if (length > max * 0.9) charCountEl.classList.add('warning');
    if (length > max) charCountEl.classList.add('error');
    
    // Atualiza aria-describedby se necessário
    if (length > max) {
      fields.mensagem.setAttribute('aria-invalid', 'true');
    } else {
      fields.mensagem.removeAttribute('aria-invalid');
    }
  }

  // ---- Validação de campo individual ----
  function validateField(field) {
    if (!field) return true;
    
    const isRequired = field.hasAttribute('required') || field === fields.mensagem;
    const value = field.value.trim();
    let isValid = true;
    let errorMsg = '';
    
    if (field === fields.mensagem) {
      if (!value) {
        isValid = false;
        errorMsg = 'A mensagem é obrigatória.';
      } else if (value.length > config.maxMessageLength) {
        isValid = false;
        errorMsg = `A mensagem excede o limite de ${config.maxMessageLength.toLocaleString('pt-BR')} caracteres.`;
      }
    }
    
    // Aplica estado visual
    field.setAttribute('aria-invalid', isValid ? 'false' : 'true');
    
    // Mostra/esconde erro específico da mensagem
    if (field === fields.mensagem && mensagemError) {
      if (!isValid) {
        mensagemError.textContent = errorMsg;
        mensagemError.hidden = false;
      } else {
        mensagemError.hidden = true;
        mensagemError.textContent = '';
      }
    }
    
    return isValid;
  }

  // ---- Validação completa do formulário ----
  function validateForm() {
    let isValid = true;
    let firstInvalidField = null;
    
    // Honeypot: se preenchido, bloqueia silenciosamente (não faz POST)
    if (honeypot && honeypot.value.trim() !== '') {

      return false;
    }
    
    Object.values(fields).forEach(field => {
      if (!validateField(field)) {
        isValid = false;
        if (!firstInvalidField) firstInvalidField = field;
      }
    });
    
    // Foca no primeiro campo inválido
    if (firstInvalidField) {
      firstInvalidField.focus({ preventScroll: true });
      firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    return isValid;
  }

  // ---- Coleta dados do formulário ----
  function collectFormData() {
    return {
      tipo: fields.tipo.value.trim() || 'melhoria',
      vinculo: fields.identificacao.value.trim() || null,
      website: honeypot.value.trim(),
      nome: fields.nome.value.trim() || null,
      setor: fields.setor.value.trim() || null,
      contato: fields.contato.value.trim() || null,
      mensagem: fields.mensagem.value.trim(),
      timestamp: new Date().toISOString()
    };
  }

  // ---- Handler de submit ----
  async function handleSubmit(event) {
    event.preventDefault();
    
    // Validação
    if (!validateForm()) return;
    
    // Honeypot check (dupla checagem)
    if (honeypot && honeypot.value.trim() !== '') {

      return;
    }
    
    const formData = collectFormData();
    
    // Modo prévia: simula sucesso sem enviar
    if (config.preview) {
      handlePreviewSuccess(formData);
      return;
    }
    
    // Modo live: envio real
    await handleLiveSubmit(formData);
  }

  // ---- Modo prévia: feedback visual apenas ----
  function handlePreviewSuccess(data) {

    
    // Esconde formulário, mostra sucesso
    form.hidden = true;
    successScreen.hidden = false;
    
    // Foco acessível no botão voltar
    backBtn.focus({ preventScroll: true });
    
    // Scroll suave ao topo
    successScreen.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---- Modo live: POST real para endpoint ----
  async function handleLiveSubmit(data) {
    // Validações de pré-condição
    if (!config.endpoint || !config.endpoint.startsWith('https://')) {
      showError('Endpoint não configurado ou inválido (HTTPS obrigatório).');
      return;
    }
    
    // Prepara UI de loading
    setLoadingState(true);
    
    try {
      // Cria AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);
      
      // POST com Content-Type: text/plain para evitar preflight CORS
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data),
        signal: controller.signal,
        // Sem credentials - endpoint público do Apps Script
        credentials: 'omit',
        // Não usa no-cors - precisamos ler a resposta
        mode: 'cors'
      });
      
      clearTimeout(timeoutId);
      
      // Verifica response.ok (status 2xx)
      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Parse JSON e verifica ok === true
      let result;
      try {
        result = await response.json();
      } catch (e) {
        throw new Error('Resposta do servidor inválida (JSON esperado).');
      }
      
      if (result.ok !== true) {
        throw new Error('Envio não confirmado.');
      }
      
      // Sucesso real
      handleLiveSuccess(data, result);
      
    } catch (error) {
      // Tratamento de erros acessível, mantém valores do formulário
      let message = 'Não foi possível enviar. ';
      
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        message += 'Tempo de conexão esgotado.';
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        message += 'Erro de rede ou CORS. Verifique se o endpoint permite seu domínio.';
      } else {
        message += 'Tente novamente em alguns instantes.';
      }
      
      showError(message);
      setLoadingState(false);
    }
  }

  // ---- Sucesso no modo live ----
  function handleLiveSuccess(data, result) {
    const panel = document.getElementById('protocol-panel');
    const code = document.getElementById('protocol-code');
    code.textContent = result.protocol || '';
    panel.hidden = !result.protocol;

    form.hidden = true;
    successScreen.hidden = false;
    
    // Atualiza texto de sucesso para modo live
    const notice = successScreen.querySelector('.success-notice');
    if (notice) {
      notice.textContent = 'Sua mensagem foi enviada ao destinatário configurado do canal.';
    }
    
    backBtn.focus({ preventScroll: true });
    successScreen.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setLoadingState(false);
  }

  // ---- Estado de loading do botão ----
  function setLoadingState(loading) {
    submitBtn.disabled = loading;
    const btnText = submitBtn.querySelector('.btn__text');
    const btnLoading = submitBtn.querySelector('.btn__loading');
    
    if (loading) {
      btnText.hidden = true;
      btnLoading.hidden = false;
    } else {
      btnText.hidden = false;
      btnLoading.hidden = true;
    }
  }

  // ---- Mostra erro acessível ----
  function showError(message) {
    // Usa o erro da mensagem como ponto de ancoragem
    if (mensagemError) {
      mensagemError.textContent = message;
      mensagemError.hidden = false;
      fields.mensagem.setAttribute('aria-invalid', 'true');
      fields.mensagem.focus({ preventScroll: true });
      fields.mensagem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      // Fallback: alert acessível
      alert(message);
    }
  }

  // ---- Reset do formulário (botão Voltar) ----
  function resetForm() {
    // Limpa todos os campos
    form.reset();
    
    // Limpa honeypot
    if (honeypot) honeypot.value = '';
    
    // Reseta estados de validação
    Object.values(fields).forEach(field => {
      field.removeAttribute('aria-invalid');
    });
    
    if (mensagemError) {
      mensagemError.hidden = true;
      mensagemError.textContent = '';
    }
    
    // Reseta contador
    updateCharCount();
    
    // Mostra formulário, esconde sucesso
    successScreen.hidden = true;
    form.hidden = false;
    
    // Foco no primeiro campo
    fields.tipo.focus({ preventScroll: true });
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---- Inicializa quando DOM pronto ----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

(function() {
  'use strict';
  const config = window.HIDRAUP_CONFIG;
  const form = document.getElementById('lookup-form'), button=document.getElementById('lookup-submit'), status=document.getElementById('lookup-status'), output=document.getElementById('lookup-response');
  const bytes=new Uint8Array(16); crypto.getRandomValues(bytes); const client=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
  let attempts=0, windowStart=Date.now();
  document.getElementById('copy-protocol').addEventListener('click',async()=>{
    const code=document.getElementById('protocol-code').textContent;
    try {await navigator.clipboard.writeText(code);document.getElementById('copy-status').textContent='Protocolo copiado.';}
    catch(e){document.getElementById('copy-status').textContent='Selecione e copie o protocolo acima.';}
  });
  form.addEventListener('submit',async e=>{
    e.preventDefault(); output.hidden=true;output.textContent='';
    if(Date.now()-windowStart>=60000){attempts=0;windowStart=Date.now();}
    if(attempts>=5){status.textContent='Limite de consultas. Aguarde um minuto e tente novamente.';return;}
    const protocol=document.getElementById('lookup-code').value.trim().toUpperCase();
    if(!/^HDP-[A-F0-9]{32}$/.test(protocol)){status.textContent='Digite o protocolo completo, incluindo HDP- e os 32 caracteres.';return;}
    attempts++;button.disabled=true;status.textContent='Consultando…';
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),config.timeout||30000);
    try {
      const r=await fetch(config.endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8','Accept':'application/json'},credentials:'omit',mode:'cors',signal:controller.signal,body:JSON.stringify({action:'lookup',protocol,client})});
      if(!r.ok)throw Error('HTTP');const data=await r.json();
      if(data.ok!==true){status.textContent=data.error||'Consulta indisponível. Tente mais tarde.';return;}
      if(typeof data.response==='string' && data.response.trim()){output.textContent=data.response;output.hidden=false;status.textContent='Resposta da direção:';}
      else status.textContent='Ainda não há resposta disponível para este protocolo. Confira o código e consulte mais tarde.';
    } catch(err){status.textContent='Não foi possível consultar. Tente mais tarde.';}
    finally{clearTimeout(timer);button.disabled=false;}
  });
})();
