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
  // Standortdesign: Firestore speichert weiterhin nur Hintergrund- und Textfarbe.
  // Abgeleitete Oberflächenfarben werden zentral über CSS-Variablen gesteuert.
  const validColor = c => /^#[0-9a-f]{6}$/i.test(c || '');
  const rgb = hex => [1,3,5].map(i => parseInt(hex.slice(i,i+2),16));
  const hex = a => '#' + a.map(n => Math.max(0,Math.min(255,Math.round(n))).toString(16).padStart(2,'0')).join('');
  const blend = (a,b,weight) => hex(rgb(a).map((v,i)=>v*(1-weight)+rgb(b)[i]*weight));
  const luminance = c => {
    const v=rgb(c).map(n=>{const s=n/255;return s<=.04045?s/12.92:Math.pow((s+.055)/1.055,2.4);});
    return .2126*v[0]+.7152*v[1]+.0722*v[2];
  };
  let themeRequest=0;
  function clearTheme(){
    document.body.classList.remove('of-themed');
    ['--of-bg','--of-text','--of-card','--of-field','--of-border','--of-muted',
     '--of-button','--of-button-text','--of-ghost','--of-ghost-text'].forEach(k=>document.body.style.removeProperty(k));
  }
  window.orgafunkApplyTheme=async function(school){
    const request=++themeRequest;
    const key=String(school||sessionStorage.getItem('activeSchool')||'').trim().toLowerCase();
    clearTheme();
    if(!key || key==='master' || !window.firebase || !firebase.apps.length)return;
    try{
      const snap=await firebase.firestore().collection('standortdesign').doc(key).get();
      if(request!==themeRequest || !snap.exists)return;
      const d=snap.data()||{};
      if(!validColor(d.hintergrund)||!validColor(d.text))return;
      const bg=d.hintergrund, fg=d.text;
      const light=luminance(bg)>.40;
      const toward=light?'#000000':'#ffffff';
      const card=blend(bg,toward,light?.045:.075);
      const field=blend(bg,toward,light?.018:.035);
      const border=blend(bg,toward,light?.23:.28);
      const muted=blend(fg,bg,.28);
      const button=fg;
      const buttonText=bg;
      const values={
        '--of-bg':bg,'--of-text':fg,'--of-card':card,'--of-field':field,
        '--of-border':border,'--of-muted':muted,'--of-button':button,
        '--of-button-text':buttonText,'--of-ghost':card,'--of-ghost-text':fg
      };
      Object.entries(values).forEach(([k,v])=>document.body.style.setProperty(k,v));
      document.body.classList.add('of-themed');
    }catch(e){if(request===themeRequest)console.warn('Standort-Farbschema konnte nicht geladen werden:',e);}
  };
  if(window.firebase && firebase.apps.length){
    firebase.auth().onAuthStateChanged(user=>{
      if(user)window.orgafunkApplyTheme();
      else {++themeRequest;clearTheme();}
    });
  }
  window.addEventListener('storage',e=>{if(e.key==='activeSchool')window.orgafunkApplyTheme(e.newValue);});
  // Die Hauptseite speichert den Standort per sessionStorage.setItem; das löst
  // im selben Tab kein 'storage'-Event aus. Daher direkt nach dem Wechsel anwenden.
  const originalSetItem=Storage.prototype.setItem;
  Storage.prototype.setItem=function(key,value){
    const isSession=this===window.sessionStorage;
    const previous=isSession && key==='activeSchool' ? this.getItem(key) : null;
    const result=originalSetItem.apply(this,arguments);
    if(isSession && key==='activeSchool' && previous!==String(value)){
      window.orgafunkApplyTheme(String(value));
    }
    return result;
  };
  // Standortwechsel innerhalb derselben Browser-Registerkarte aktiv aktualisieren.
  window.addEventListener('orgafunk:standortwechsel',e=>window.orgafunkApplyTheme(e.detail?.school));

})();