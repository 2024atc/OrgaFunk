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
 // Wait for Authentication. Never apply the legacy group ID as if it were a site.
 document.addEventListener('DOMContentLoaded',()=>{
   if(!window.firebase||!firebase.apps.length)return;
   firebase.auth().onAuthStateChanged(async user=>{
     if(!user){++requestId;return;}
     const selected=sessionStorage.getItem('activeSchool');
     if(selected && key(selected)!=='master'){
       await window.applySchoolLogos(selected);
       return;
     }
     try{
       const d=await firebase.firestore().collection('rollen').doc(user.uid).get();
       const school=d.exists?d.data().school:null;
       if(!school||key(school)==='master')return;
       const group=await firebase.firestore().collection('Schulen').doc(school).get();
       if(group.exists)return;
       // Main page may have selected a different site during the awaits.
       const latest=sessionStorage.getItem('activeSchool');
       if(latest && key(latest)!==key(school))return;
       await window.applySchoolLogos(school);
     }catch(err){console.warn('Logo-Initialisierung:',err);}
   });
 });
})();
