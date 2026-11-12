/* Schul-Logos: Firestore-Overrides, GitHub-Bilder bleiben Fallback. */
(function(){
 const slots=['left','center','right'];
 const cache=new Map();
 const key=s=>String(s||'master').trim().toLowerCase();
 function fallback(s,slot){const defaults={left:'branding/atc.png',center:'branding/orgafunk.png',right:'branding/drakory.png'};return s==='master'?defaults[slot]:'logos/'+s+'/logo-'+slot+'.jpg';}
 function setImage(slot,src,backup){const img=document.getElementById('logo-'+slot);if(!img)return;img.onerror=()=>{img.onerror=null;img.src=backup;};img.src=src;img.style.opacity='1';}
 window.applySchoolLogos=async function(school){
  const s=key(school); const master=key('master');
  for(const slot of slots)setImage(slot,fallback(s,slot),fallback(master,slot));
  if(!window.firebase||!firebase.apps.length)return;
  try{
   const db=firebase.firestore();
   let values=cache.get(s);
   if(!values){const docs=await Promise.all(slots.map(slot=>db.collection('schullogos').doc(s+'_'+slot).get()));values=docs.map(d=>d.exists?d.data().image:null);cache.set(s,values);}
   slots.forEach((slot,i)=>{if(typeof values[i]==='string'&&values[i].startsWith('data:image/'))setImage(slot,values[i],fallback(s,slot));});
  }catch(err){console.warn('Schullogos: Standardbilder werden verwendet.',err);}
 };
 window.invalidateSchoolLogos=s=>cache.delete(key(s));
 // Seiten ohne eigene Header-Initialisierung ebenfalls unterstützen.
 document.addEventListener('DOMContentLoaded',()=>{
  if(!document.getElementById('logo-left')||!window.firebase||!firebase.apps.length)return;
  firebase.auth().onAuthStateChanged(async user=>{
   if(!user)return;
   try{const d=await firebase.firestore().collection('rollen').doc(user.uid).get();
    const school=d.exists?(d.data().school||'master'):'master';
    const group=await firebase.firestore().collection('Schulen').doc(school).get().catch(()=>null);
    if(group&&group.exists)return; // Gruppenkontext: bestehende Auswahlfunktion entscheidet.
    window.applySchoolLogos(school);
   }catch(e){console.warn('Logo-Initialisierung:',e);}
  });
 });
})();
