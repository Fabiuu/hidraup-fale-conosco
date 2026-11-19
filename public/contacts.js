/* Public contacts from Config B3/B4; sending is independent. */
(function(){'use strict';
const cfg=window.HIDRAUP_CONFIG||{},waButton=document.getElementById('contact-whatsapp'),phoneButton=document.getElementById('contact-phone');
if(!waButton||!phoneButton)return;
for(const button of [waButton,phoneButton]){button.addEventListener('click',e=>{if(!button.hasAttribute('href'))e.preventDefault()});button.addEventListener('keydown',e=>{if(!button.hasAttribute('href')&&(e.key==='Enter'||e.key===' '))e.preventDefault()});}
function digits(value){const s=String(value||'').trim();return /^\+?[1-9][0-9]{7,14}$/.test(s)?s.replace(/^\+/,''):'';}
async function load(){if(!cfg.endpoint)return;const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);try{const r=await fetch(cfg.endpoint,{credentials:'omit',mode:'cors',cache:'no-store',signal:controller.signal});if(!r.ok)return;const data=await r.json();if(data.ok!==true||!data.contacts)return;const wa=digits(data.contacts.whatsapp),phone=digits(data.contacts.phone);if(wa){waButton.href='https://wa.me/'+wa;waButton.target='_blank';waButton.rel='noopener noreferrer';waButton.removeAttribute('aria-disabled')}if(phone){phoneButton.href='tel:+'+phone;phoneButton.removeAttribute('aria-disabled')}}catch(_){}finally{clearTimeout(timer)}}load();
})();
