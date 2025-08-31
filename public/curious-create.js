const $ = s=>document.querySelector(s);
$('#create').addEventListener('click', async () => {
  const body = {
    alias: $('#alias').value.trim(),
    nickname: $('#nickname').value.trim(),
    introduction: $('#intro').value.trim(),
    notice: $('#notice').value,
    links: { twitter: $('#twitter').value.trim(), instagram: $('#instagram').value.trim(), common: $('#common').value.trim() },
    visibility: $('#visibility').value,
    password: $('#password').value,
    resetQ: $('#resetQ').value,
    resetA: $('#resetA').value,
    theme: $('#theme').value
  };
  const r = await fetch('/api/curious/create',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
  const d = await r.json();
  $('#result').innerHTML = d.ok
    ? `✅ 생성 완료: <a href="${d.url}">${d.url}</a> • 관리자: <a href="${d.owner}">${d.owner}</a>`
    : `❌ 실패: ${d.error||'unknown'}`;
});
