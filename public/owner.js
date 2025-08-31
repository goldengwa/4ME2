
const $=s=>document.querySelector(s);
const slug=decodeURIComponent(location.pathname.split('/owner/')[1]||''); if(!slug) location.href='/';
$('#slugBadge').textContent='@'+slug;
const socket=io(); socket.emit('join_profile',{slug});
const feed=$('#feed'), ans=$('#answer'), send=$('#send'), passInp=$('#pass'), loginBtn=$('#login');

function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmt(t){const d=new Date(t);return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}
function qCard(m){ return `<div class="qcard" data-id="${m.id}"><div>${escapeHtml(m.text)}</div><div class="qmeta">익명 • ${fmt(m.t)}</div></div>`; }
function aCard(m){ return `<div class="acard"><div>${escapeHtml(m.text)}</div><div class="ameta">호스트 • ${fmt(m.t)}</div></div>`; }

function addMsg(m){
  if(m.role==='ask'){ feed.insertAdjacentHTML('afterbegin', qCard(m)); }
  else if(m.role==='answer'){ feed.insertAdjacentHTML('afterbegin', aCard(m)); }
}

async function loadAll(){
  const p=await (await fetch(`/api/profile/${slug}`)).json(); if(!p.error) $('#title').textContent='Owner • '+p.displayName;
  const d=await (await fetch(`/api/messages/${slug}`)).json();
  (d.messages||[]).reverse().forEach(m=> feed.insertAdjacentHTML('beforeend', m.role==='ask'? qCard(m): aCard(m)));
}
loadAll();
socket.on('message', addMsg);

loginBtn.addEventListener('click', async()=>{
  const r=await fetch('/api/owner/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,passcode:passInp.value})});
  const d=await r.json(); alert(d.ok?'로그인 성공':'로그인 실패: '+(d.error||'unknown'));
});
send.addEventListener('click', async()=>{
  const val=ans.value; if(!val.trim()) return;
  const r=await fetch(`/api/answer/${slug}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:val})});
  const d=await r.json(); if(!d.ok){ alert('전송 실패: '+(d.error||'unknown')); return; } ans.value='';
});
ans.addEventListener('keydown',(e)=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send.click(); } });
