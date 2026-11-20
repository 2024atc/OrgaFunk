/* OrgaFunk: standortspezifische Header-Logos mit sicherer Lade-Reihenfolge. */
(function(){
 'use strict';
 const slots=['left','center','right'];
 const defaults={left:'branding/atc.png',center:'branding/orgafunk.png',right:'branding/drakory.png'};
 const cache=new Map();
 let requestId=0;
 const key=s=>String(s||'master').trim().toLowerCase();
 const fallback=(s,slot)=>s==='master'?defaults[slot]:'logos/'+encodeURIComponent(s)+'/logo-'+slot+'.jpg';
 function setImage(slot,src,backup){
   const img=document.getElementById('logo-'+slot);
   if(!img)return;
   img.onerror=()=>{img.onerror=null;img.src=backup;};
   img.src=src;img.style.opacity='1';
 }
 async function loadValues(s){
   const db=firebase.firestore();
   const docs=await Promise.all(slots.map(slot=>db.collection('schullogos').doc(s+'_'+slot).get()));
   const values=docs.map(d=>d.exists?d.data().image:null);
   cache.set(s,values);
   return values;
 }
 window.applySchoolLogos=async function(school){
   const s=key(school), current=++requestId;
   slots.forEach(slot=>setImage(slot,fallback(s,slot),defaults[slot]));
   if(!window.firebase||!firebase.apps.length||s==='master')return;
   try{
     // A failed read is never cached; later calls may retry after auth/network settles.
     const values=cache.has(s)?cache.get(s):await loadValues(s);
     if(current!==requestId)return; // Prevent an older site request overwriting newer logos.
     slots.forEach((slot,i)=>{
       if(typeof values[i]==='string' && /^data:image\/(png|jpeg|webp);base64,/i.test(values[i]))
         setImage(slot,values[i],defaults[slot]);
     });
   }catch(err){if(current===requestId)console.warn('Standortlogos konnten nicht geladen werden:',err);}
 };
 window.invalidateSchoolLogos=s=>cache.delete(key(s));
 // Die Hauptseite steuert die Logo-Auswahl ausschliesslich ueber den
 // aktiven, autorisierten Standort. Keine zweite, konkurrierende
 // Auth-/Legacy-Initialisierung und kein Footer-Zugriff.
})();
