/* Public contacts only. Edit Config B3 (WhatsApp) and B4 (phone), with country code. */
(function(){'use strict';
  const cfg=window.HIDRAUP_CONFIG||{},section=document.getElementById('alternate-contact');
  if(!section||!cfg.endpoint)return;
  function digits(value){const s=String(value||'').trim();return /^\+?[1-9][0-9]{7,14}$/.test(s)?s.replace(/^\+/,''):'';}
  async function load(){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
    try{
      const response=await fetch(cfg.endpoint,{method:'GET',credentials:'omit',mode:'cors',cache:'no-store',signal:controller.signal});
      if(!response.ok)return;const data=await response.json();if(data.ok!==true||!data.contacts)return;
      const wa=digits(data.contacts.whatsapp),phone=digits(data.contacts.phone);
      const waButton=document.getElementById('contact-whatsapp'),phoneButton=document.getElementById('contact-phone');
      if(wa){waButton.href='https://wa.me/'+wa;waButton.hidden=false;}
      if(phone){phoneButton.href='tel:+'+phone;phoneButton.hidden=false;}
      section.hidden=!(wa||phone);
    }catch(_){/* Contacts are optional. Sending is independent. */}finally{clearTimeout(timer);}
  }
  load();
})();
