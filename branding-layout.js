/* OrgaFunk: gemeinsamer Markenrahmen, ohne Firebase-Schreibzugriffe. */
(function(){
  'use strict';
  const script=document.currentScript;
  const root=new URL('./',script.src);
  const logo=n=>new URL('branding/'+n+'.png',root).href;
  const login=/^(index|login)\.html$/i.test(location.pathname.split('/').pop()||'index.html');
  const original=document.querySelector('body > header');
  const brand=document.createElement('div');brand.id='of-brand-header';
  brand.setAttribute('aria-label','OrgaFunk Kopfbereich');
  const items=['atc','orgafunk','drakory'];
  const oldLogos=original?Array.from(original.querySelectorAll('img')):[];
  items.forEach((name,i)=>{
    const slot=document.createElement('div');slot.className='of-brand-slot';
    let img=(!login&&oldLogos[i])?oldLogos[i]:document.createElement('img');
    if(!img.id && !login)img.id=['logo-left','logo-center','logo-right'][i];
    if(!img.getAttribute('src'))img.src=logo(name);
    if(login)img.src=logo(name);
    img.alt=['Advanced Tech Creations','OrgaFunk','Drakory Games'][i];
    slot.appendChild(img);brand.appendChild(slot);
  });
  if(original){
    // Nur reine Logo-Header ersetzen; andere Steuerelemente unangetastet lassen.
    if(!original.querySelector('button,a,input,select'))original.remove();
  }
  // Loginseiten haben bereits eine eigene Logozeile; Dopplung vermeiden.
  if(login){const legacy=document.querySelector('body > .header');if(legacy)legacy.style.display='none';}
  document.body.prepend(brand);
  const footer=document.createElement('footer');footer.id='of-brand-footer';
  footer.setAttribute('aria-label','Betreiber- und Entwicklermarken');
  items.forEach((name,i)=>{
    const slot=document.createElement('div');slot.className='of-brand-slot';
    const img=document.createElement('img');img.src=logo(name);
    img.alt=['Advanced Tech Creations','OrgaFunk','Drakory Games'][i];
    slot.appendChild(img);footer.appendChild(slot);
  });
  document.body.appendChild(footer);
  document.body.classList.add('of-branded');
})();