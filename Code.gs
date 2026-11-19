var SHEET_ID = '1DhiHgPzBC1AQBPhKcS5tfaZPdysXykKxdm5THGdD51w';
function response_(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
function publicPhone_(value) {
  var raw=String(value || '').trim();
  if (!raw || !/^\+?[1-9][0-9]{7,14}$/.test(raw)) return '';
  return raw.replace(/^\+/, '');
}
function doGet() {
  try {
    var rows=SpreadsheetApp.openById(SHEET_ID).getSheetByName('Config').getRange('B3:B4').getValues();
    return response_({ok:true,contacts:{whatsapp:publicPhone_(rows[0][0]),phone:publicPhone_(rows[1][0])}});
  } catch (err) { return response_({ok:false,contacts:{whatsapp:'',phone:''}}); }
}
function authorize() { SpreadsheetApp.openById(SHEET_ID).getSheetByName('Config').getRange('B1:B2').getValues(); MailApp.getRemainingDailyQuota(); }
function clean_(v, max) { if (v === undefined || v === null) return ''; if (typeof v !== 'string') throw new Error('INVALID'); if(v.length>max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)) throw new Error('INVALID'); return v.trim(); }
function cell_(v) { return /^[\s]*[=+\-@]/.test(v) ? "'"+v : v; }
function email_(v) { return typeof v==='string' && /^[^\s@,;\r\n]+@[^\s@,;\r\n]+\.[^\s@,;\r\n]+$/.test(v.trim()); }
function html_(v) { return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function doPost(e) {
  var lock, row=0, sheet;
  try {
    if (!e || !e.postData || e.postData.contents.length>20000) return response_({ok:false,error:'Dados inválidos.'});
    var d=JSON.parse(e.postData.contents);
    if (!d || typeof d!=='object' || Array.isArray(d)) return response_({ok:false,error:'Dados inválidos.'});
    if (clean_(d.website,200)) return response_({ok:false,error:'Envio recusado.'});
    var tipos={melhoria:'Melhoria',sugestao:'Melhoria','Sugestão':'Melhoria',reclamacao:'Reclamação',denuncia:'Denúncia'}; var rawTipo=clean_(d.tipo,30); var tipo=tipos[rawTipo]||rawTipo, vinculo=clean_(d.vinculo || d.identificacao,80), nome=clean_(d.nome,120), setor=clean_(d.setor,120), contato=clean_(d.contato,200), mensagem=clean_(d.mensagem,10000);
    if (['Melhoria','Reclamação','Denúncia'].indexOf(tipo)<0 || !mensagem) return response_({ok:false,error:'Confira o tipo e a mensagem.'});
    lock=LockService.getScriptLock(); if(!lock.tryLock(10000)) return response_({ok:false,error:'Canal ocupado. Tente novamente.'});
    var ss=SpreadsheetApp.openById(SHEET_ID), config=ss.getSheetByName('Config').getRange('B1:B2').getValues(), to=String(config[0][0]).trim(), cc=String(config[1][0]||'').trim();
    if(!email_(to) || (cc && !email_(cc)) || MailApp.getRemainingDailyQuota()<(cc?2:1)) return response_({ok:false,error:'Canal temporariamente indisponível. Tente mais tarde.'});
    var now=new Date(), body='Hidraup - Fale com o Diretor\n\nData: '+Utilities.formatDate(now,'America/Sao_Paulo','dd/MM/yyyy HH:mm:ss')+'\nTipo: '+tipo+'\nVínculo: '+(vinculo||'Não informado')+'\nNome: '+(nome||'Não informado')+'\nSetor: '+(setor||'Não informado')+'\nContato: '+(contato||'Não informado')+'\n\nMensagem:\n'+mensagem;
    sheet=ss.getSheetByName('Mensagens'); row=sheet.getLastRow()+1;
    sheet.getRange(row,1,1,7).setValues([[now,cell_(tipo),cell_(vinculo),cell_(nome),cell_(setor),cell_(contato),cell_(mensagem)]]); SpreadsheetApp.flush();
    var subjectType=tipo==='Melhoria'?'Melhoria':'Contato';
    var htmlBody='<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#17243b"><h2>Fale com o Diretor - Hidraup</h2><div style="white-space:pre-wrap">'+html_(body).replace(/\n/g,'<br>')+'</div></div>';
    var mail={to:to,subject:'Nova mensagem - Fale com o Diretor ('+subjectType+')',body:body,htmlBody:htmlBody,name:'Fale com o Diretor - Hidraup'}; if(cc)mail.cc=cc;
    try { MailApp.sendEmail(mail); } catch(mailError) { sheet.getRange(row,1,1,7).clearContent(); SpreadsheetApp.flush(); return response_({ok:false,error:'Não foi possível enviar. Tente mais tarde.'}); }
    return response_({ok:true,message:'Mensagem enviada com sucesso.'});
  } catch(err) { return response_({ok:false,error:'Não foi possível enviar. Confira os campos ou tente mais tarde.'}); }
  finally { if(lock && lock.hasLock())lock.releaseLock(); }
}
