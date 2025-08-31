
const $ = s=>document.querySelector(s);
const slug=$('#slug'), displayName=$('#displayName'), passcode=$('#passcode'), btn=$('#create'), res=$('#createResult');
const goSlug=$('#goSlug'), visit=$('#visit');
btn.addEventListener('click', async ()=>{
  const body={slug:slug.value.trim(), displayName:displayName.value.trim(), passcode:passcode.value};
  const r=await fetch('/api/create-profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const d=await r.json();
  if(d.ok){ res.innerHTML=`✅ <b>생성 완료</b> · 공개 <a href="/@${body.slug}">/@${body.slug}</a> · 소유자 <a href="/owner/${body.slug}">/owner/${body.slug}</a>`; }
  else { res.innerHTML=`<span style="color:#ff6b6b">실패: ${d.error||'unknown'}</span>`; }
});
goSlug.addEventListener('input',()=>{ const s=goSlug.value.trim(); visit.href=s?`/@${s}`:'#'; });
