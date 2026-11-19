var SHEET_ID = '1G705kppWeaCwUmA7o6g6O8ONz7rQrtV_OBKOBGRs80U';
var LEGACY_SHEET_ID = '1DhiHgPzBC1AQBPhKcS5tfaZPdysXykKxdm5THGdD51w';
function activeSheetId_() { return PropertiesService.getScriptProperties().getProperty('activeSheetId') || SHEET_ID; }
function response_(data) { return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON); }
function publicPhone_(value) {
  var raw=String(value || '').trim();
  if (!raw || !/^\+?[1-9][0-9]{7,14}$/.test(raw)) return '';
  return raw.replace(/^\+/, '');
}
function doGet() {
  try {
    var rows=SpreadsheetApp.openById(activeSheetId_()).getSheetByName('Config').getRange('B3:B4').getValues();
    return response_({ok:true,contacts:{whatsapp:publicPhone_(rows[0][0]),phone:publicPhone_(rows[1][0])}});
  } catch (err) { return response_({ok:false,contacts:{whatsapp:'',phone:''}}); }
}
function authorize() { SpreadsheetApp.openById(activeSheetId_()).getSheetByName('Config').getRange('B1:B2').getValues(); MailApp.getRemainingDailyQuota(); }
function clean_(v, max) { if (v === undefined || v === null) return ''; if (typeof v !== 'string') throw new Error('INVALID'); if(v.length>max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v)) throw new Error('INVALID'); return v.trim(); }
function cell_(v) { return /^[\s]*[=+\-@]/.test(v) ? "'"+v : v; }
function email_(v) { return typeof v==='string' && /^[^\s@,;\r\n]+@[^\s@,;\r\n]+\.[^\s@,;\r\n]+$/.test(v.trim()); }
function html_(v) { return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function rateLookup_(client) {
  var cache=CacheService.getScriptCache(), stamp=Utilities.formatDate(new Date(),'UTC','yyyyMMddHHmm');
  var key='lookup:'+stamp, ck=key+':'+client, globalCount=Number(cache.get(key)||0), count=Number(cache.get(ck)||0);
  if(globalCount>=120 || count>=5) return false;
  cache.put(key,String(globalCount+1),120); cache.put(ck,String(count+1),120); return true;
}
function lookup_(d) {
  var lock=LockService.getScriptLock();
  try {
    if(!lock.tryLock(3000)) return response_({ok:false,error:'Aguarde um momento e tente novamente.'});
    var client=String(d.client||'');
    if(!/^[a-f0-9]{32}$/.test(client) || !rateLookup_(client)) return response_({ok:false,error:'Limite de consultas. Aguarde um minuto e tente novamente.'});
    var token=String(d.protocol||'').trim().toUpperCase();
    if(!/^HDP-[A-F0-9]{32}$/.test(token)) return response_({ok:true,response:''});
    var sheet=SpreadsheetApp.openById(activeSheetId_()).getSheetByName('Mensagens'), last=sheet.getLastRow();
    if(last<2) return response_({ok:true,response:''});
    var values=sheet.getRange(2,8,last-1,2).getDisplayValues();
    for(var i=0;i<values.length;i++) if(values[i][0]===token) return response_({ok:true,response:String(values[i][1]||'').slice(0,10000)});
    return response_({ok:true,response:''});
  } catch(err) { return response_({ok:false,error:'Consulta indisponível. Tente mais tarde.'}); }
  finally { if(lock.hasLock()) lock.releaseLock(); }
}
function protocol_() { return 'HDP-'+Utilities.getUuid().replace(/-/g,'').toUpperCase(); }
function doPost(e) {
  var lock, row=0, sheet;
  try {
    if (!e || !e.postData || e.postData.contents.length>20000) return response_({ok:false,error:'Dados inválidos.'});
    var d=JSON.parse(e.postData.contents);
    if (!d || typeof d!=='object' || Array.isArray(d)) return response_({ok:false,error:'Dados inválidos.'});
    if(d.action==='lookup') return lookup_(d);
    if (clean_(d.website,200)) return response_({ok:false,error:'Envio recusado.'});
    var tipos={melhoria:'Melhoria',sugestao:'Melhoria','Sugestão':'Melhoria',reclamacao:'Reclamação',denuncia:'Denúncia'}; var rawTipo=clean_(d.tipo,30); var tipo=tipos[rawTipo]||rawTipo, vinculo=clean_(d.vinculo || d.identificacao,80), nome=clean_(d.nome,120), setor=clean_(d.setor,120), contato=clean_(d.contato,200), mensagem=clean_(d.mensagem,10000);
    if (['Melhoria','Reclamação','Denúncia'].indexOf(tipo)<0 || !mensagem) return response_({ok:false,error:'Confira o tipo e a mensagem.'});
    lock=LockService.getScriptLock(); if(!lock.tryLock(10000)) return response_({ok:false,error:'Canal ocupado. Tente novamente.'});
    var ss=SpreadsheetApp.openById(activeSheetId_()), config=ss.getSheetByName('Config').getRange('B1:B2').getValues(), to=String(config[0][0]).trim(), cc=String(config[1][0]||'').trim();
    if(!email_(to) || (cc && !email_(cc)) || MailApp.getRemainingDailyQuota()<(cc?2:1)) return response_({ok:false,error:'Canal temporariamente indisponível. Tente mais tarde.'});
    var protocol=protocol_();
    var now=new Date(), body='Hidraup - Ouvidoria: Fale Conosco\nProtocolo: '+protocol+'\n\nData: '+Utilities.formatDate(now,'America/Sao_Paulo','dd/MM/yyyy HH:mm:ss')+'\nTipo: '+tipo+'\nVínculo: '+(vinculo||'Não informado')+'\nNome: '+(nome||'Não informado')+'\nSetor: '+(setor||'Não informado')+'\nContato: '+(contato||'Não informado')+'\n\nMensagem:\n'+mensagem;
    sheet=ss.getSheetByName('Mensagens'); row=sheet.getLastRow()+1;
    sheet.getRange(row,1,1,9).setValues([[now,cell_(tipo),cell_(vinculo),cell_(nome),cell_(setor),cell_(contato),cell_(mensagem),protocol,'']]); SpreadsheetApp.flush();
    var subjectType=tipo==='Melhoria'?'Melhoria':'Contato';
    var htmlBody='<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#17243b"><h2>Ouvidoria: Fale Conosco - Hidraup</h2><div style="white-space:pre-wrap">'+html_(body).replace(/\n/g,'<br>')+'</div></div>';
    var mail={to:to,subject:'Nova mensagem - Ouvidoria: Fale Conosco ('+subjectType+') - '+protocol,body:body,htmlBody:htmlBody,name:'Ouvidoria: Fale Conosco - Hidraup'}; if(cc)mail.cc=cc;
    try { MailApp.sendEmail(mail); } catch(mailError) { sheet.getRange(row,1,1,9).clearContent(); SpreadsheetApp.flush(); return response_({ok:false,error:'Não foi possível enviar. Tente mais tarde.'}); }
    return response_({ok:true,message:'Mensagem enviada com sucesso.',protocol:protocol});
  } catch(err) { return response_({ok:false,error:'Não foi possível enviar. Confira os campos ou tente mais tarde.'}); }
  finally { if(lock && lock.hasLock())lock.releaseLock(); }
}

function setupChannel() {
  var sheet=SpreadsheetApp.openById(activeSheetId_()).getSheetByName('Mensagens');
  var headers=sheet.getRange(1,8,1,2).getValues()[0];
  if((headers[0] && headers[0]!=='Protocolo') || (headers[1] && headers[1]!=='Resposta')) throw new Error('Colunas H/I ocupadas.');
  sheet.getRange(1,8,1,2).setValues([['Protocolo','Resposta']]);
  var triggers=ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='monthlySummary';});
  if(triggers.length===0) ScriptApp.newTrigger('monthlySummary').timeBased().onMonthDay(1).atHour(8).nearMinute(0).inTimezone('America/Sao_Paulo').create();
  else if(triggers.length!==1) throw new Error('Gatilhos duplicados.');
  console.log('Canal configurado: Protocolo/Resposta; um resumo mensal dia 1 por volta das 08h, America/Sao_Paulo.');
}
function previousMonthStats_(values, now) {
  var current=Utilities.formatDate(now,'America/Sao_Paulo','yyyy-MM'), year=Number(current.slice(0,4)), month=Number(current.slice(5,7))-1;
  if(month===0){month=12;year--;}
  var key=year+'-'+('0'+month).slice(-2), counts={'Melhoria':0,'Reclamação':0,'Denúncia':0}, total=0, answered=0;
  values.forEach(function(r){if(r[0] instanceof Date && !isNaN(r[0]) && Utilities.formatDate(r[0],'America/Sao_Paulo','yyyy-MM')===key && Object.prototype.hasOwnProperty.call(counts,r[1])) {counts[r[1]]++; total++; if(String(r[8]||'').trim()) answered++;}});
  return {month:key,counts:counts,total:total,answered:answered};
}
function monthlySummary() {
  var lock=LockService.getScriptLock(); if(!lock.tryLock(10000)) throw new Error('Canal ocupado');
  try {
    var ss=SpreadsheetApp.openById(activeSheetId_()), sheet=ss.getSheetByName('Mensagens'), stats=previousMonthStats_(sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,9).getValues():[],new Date());
    var props=PropertiesService.getScriptProperties(), key='summary:'+stats.month;
    if(props.getProperty(key)==='sent') return;
    var to=String(ss.getSheetByName('Config').getRange('B1').getValue()).trim();
    if(!email_(to) || MailApp.getRemainingDailyQuota()<1) throw new Error('Destinatário ou quota indisponível');
    var body='Resumo mensal - Ouvidoria: Fale Conosco - Hidraup\nMês: '+stats.month+'\nTotal: '+stats.total+'\nMelhoria: '+stats.counts['Melhoria']+'\nReclamação: '+stats.counts['Reclamação']+'\nDenúncia: '+stats.counts['Denúncia']+'\nRespondidas: '+stats.answered+'\n\nRespondida = coluna Resposta preenchida no momento do resumo. Sem conteúdo das mensagens.';
    MailApp.sendEmail({to:to,subject:'Resumo mensal - Ouvidoria: Fale Conosco - '+stats.month,body:body,name:'Ouvidoria: Fale Conosco - Hidraup'});
    props.setProperty(key,'sent');
  } finally {if(lock.hasLock()) lock.releaseLock();}
}

function migratePrivateSheet() {
  var lock=LockService.getScriptLock();if(!lock.tryLock(30000))throw new Error('Canal ocupado');
  try {
    var props=PropertiesService.getScriptProperties(), existing=props.getProperty('activeSheetId');
    if(existing){console.log('Planilha ativa já migrada: '+SpreadsheetApp.openById(existing).getUrl());return;}
    var old=SpreadsheetApp.openById(LEGACY_SHEET_ID), fresh=SpreadsheetApp.create('Hidraup - Ouvidoria: Fale Conosco'), defaultSheet=fresh.getSheets()[0];
    fresh.setSpreadsheetTimeZone(old.getSpreadsheetTimeZone()); fresh.setSpreadsheetLocale(old.getSpreadsheetLocale());
    ['Config','Mensagens'].forEach(function(name){old.getSheetByName(name).copyTo(fresh).setName(name);});
    fresh.deleteSheet(defaultSheet);
    var sheet=fresh.getSheetByName('Mensagens');sheet.getRange(1,8,1,2).setValues([['Protocolo','Resposta']]);
    SpreadsheetApp.flush();
    if(old.getSheetByName('Mensagens').getLastRow()!==sheet.getLastRow())throw new Error('Contagem divergente');
    props.setProperty('activeSheetId',fresh.getId());
    console.log('MIGRACAO_OK '+fresh.getUrl()+' | linhas incluindo cabeçalho: '+sheet.getLastRow());
  } finally{if(lock.hasLock())lock.releaseLock();}
}

function auditPrivateMigration() {
  var old=SpreadsheetApp.openById(LEGACY_SHEET_ID), fresh=SpreadsheetApp.openById(activeSheetId_());
  fresh.setSpreadsheetTimeZone(old.getSpreadsheetTimeZone());fresh.setSpreadsheetLocale(old.getSpreadsheetLocale());
  SpreadsheetApp.flush();
  var count=old.getSheetByName('Mensagens').getLastRow();
  var a=old.getSheetByName('Mensagens').getRange(1,1,count,7).getValues(), b=fresh.getSheetByName('Mensagens').getRange(1,1,count,7).getValues();
  var configSame=JSON.stringify(old.getSheetByName('Config').getRange('A1:B4').getValues())===JSON.stringify(fresh.getSheetByName('Config').getRange('A1:B4').getValues());
  var historySame=JSON.stringify(a)===JSON.stringify(b);
  if(!historySame||!configSame)throw new Error('Cópia divergente');
  console.log(JSON.stringify({historyRows:count,historySame:historySame,configSame:configSame,newRows:fresh.getSheetByName('Mensagens').getLastRow(),timezone:fresh.getSpreadsheetTimeZone(),summaryTriggers:ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='monthlySummary';}).length,privateSheet:fresh.getUrl()}));
}
