const $=s=>document.querySelector(s);
const slug = decodeURIComponent(location.pathname.split('/owner/')[1]||'');
$('#title').textContent = '관리자 • '+slug;

async function fetchProfile(){
  const p = await (await fetch('/api/curious/profile/'+slug)).json();
  if(p.error){ alert('없는 페이지'); return; }
  $('#nickname').value = p.nickname || '';
  $('#intro').value = p.introduction || '';
  $('#notice').value = p.notice || '';
  $('#theme').value = p.theme || 'chat:default';
  $('#twitter').value = p.links?.twitter || '';
  $('#instagram').value = p.links?.instagram || '';
  $('#common').value = p.links?.common || '';
  $('#visibility').value = p.visibility || 'public';
}
fetchProfile();

$('#login').addEventListener('click', async ()=>{
  const r = await fetch('/api/owner/login',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ slug, password: $('#pw').value })});
  const d = await r.json(); alert(d.ok?'로그인 성공':'로그인 실패');
});
$('#save').addEventListener('click', async ()=>{
  const body = {
    nickname: $('#nickname').value, introduction: $('#intro').value, notice: $('#notice').value,
    links: { twitter: $('#twitter').value, instagram: $('#instagram').value, common: $('#common').value },
    theme: $('#theme').value, visibility: $('#visibility').value
  };
  const r = await fetch('/api/curious/update/'+slug,{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
  const d = await r.json(); alert(d.ok?'저장 완료':'저장 실패');
});
$('#send').addEventListener('click', async ()=>{
  const r = await fetch('/api/answer/'+slug,{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text: $('#ans').value })});
  const d = await r.json(); alert(d.ok?'발행 완료':'발행 실패'); if(d.ok) $('#ans').value='';
});
