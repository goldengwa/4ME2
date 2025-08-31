
const $ = (s)=> document.querySelector(s);
const slug = $('#slug'), displayName = $('#displayName'), passcode = $('#passcode'), createBtn = $('#create'), result = $('#createResult');
const goSlug = $('#goSlug'), visit = $('#visit');
createBtn.addEventListener('click', async ()=>{
  const body = { slug: slug.value.trim(), displayName: displayName.value.trim(), passcode: passcode.value };
  const res = await fetch('/api/create-profile', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
  const data = await res.json();
  if (data.ok) result.innerHTML = `✅ 생성 완료! 공개 링크: <a class="primary" href="/@${body.slug}">/@${body.slug}</a> • 소유자: <a class="primary outline" href="/owner/${body.slug}">/owner/${body.slug}</a>`;
  else result.innerHTML = `<span class="error">❌ 실패: ${data.error || 'unknown'}</span>`;
});
goSlug.addEventListener('input', ()=> { const s = goSlug.value.trim(); visit.href = s ? `/@${s}` : '#'; });
