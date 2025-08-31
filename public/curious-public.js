const $=s=>document.querySelector(s);
const slug = decodeURIComponent(location.pathname.split('/c/')[1]||'');
const socket = io(); socket.emit('join',{ slug });
$('#urlCode').textContent = location.href;

function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function time(t){const d=new Date(t);return d.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'});}

function addItem(m, pos='end'){
  const el = document.createElement('div');
  el.className = m.role==='ask'?'q':'a';
  el.innerHTML = `<div>${escapeHtml(m.text)}</div><div class="meta">${m.role==='ask'?'익명':'호스트'} • ${time(m.t)}</div>`;
  const feed = $('#feed'); (pos==='start'? feed.prepend(el) : feed.appendChild(el));
}

async function init(){
  const p = await (await fetch('/api/curious/profile/'+slug)).json();
  if(p.error){ document.body.innerHTML='존재하지 않는 페이지입니다.'; return; }
  $('#nickname').textContent = p.nickname;
  $('#intro').textContent = p.introduction || '';
  const n = (p.notice||'').trim();
  if(n){ const [title,...rest]=n.split('\n'); $('#noticeBox').style.display='block'; $('#noticeBox').innerHTML = `<b>${escapeHtml(title||'공지')}</b><br>${escapeHtml(rest.join('\n'))}`; }
  const links = [];
  if(p.links?.twitter) links.push(`<a target="_blank" href="https://twitter.com/${encodeURIComponent(p.links.twitter)}">Twitter</a>`);
  if(p.links?.instagram) links.push(`<a target="_blank" href="https://instagram.com/${encodeURIComponent(p.links.instagram)}">Instagram</a>`);
  if(p.links?.common) links.push(`<a target="_blank" href="https://${encodeURIComponent(p.links.common)}">Link</a>`);
  $('#links').innerHTML = links.join(' · ');
  const d = await (await fetch('/api/messages/'+slug)).json();
  (d.messages||[]).forEach(m=> addItem(m,'end'));
}
init();
socket.on('message', m => addItem(m,'start'));

$('#send').addEventListener('click', async()=>{
  const txt = $('#ask').value.trim(); if(!txt) return;
  const r = await fetch('/api/ask/'+slug,{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text: txt })});
  const d = await r.json(); if(!d.ok) alert('전송 실패: '+(d.error||'unknown')); else $('#ask').value='';
});
$('#ask').addEventListener('keydown', e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); $('#send').click(); }});
$('#copy').addEventListener('click', async()=>{ try{ await navigator.clipboard.writeText(location.href); alert('링크 복사 완료'); }catch{ alert('복사 실패'); }});
