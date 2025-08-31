
const $ = (s)=> document.querySelector(s);
const chat = $('#chat'), composer = $('#composer'), text = $('#text'), title = $('#title'), slugBadge = $('#slugBadge');
const slug = decodeURIComponent(location.pathname.split('/@')[1] || '');
if (!slug) location.href = '/'; slugBadge.textContent = `@${slug}`;
const socket = io(); socket.emit('join_profile', { slug });
function escapeHtml(s){return s.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmtTime(t){const d=new Date(t);return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}
function addMsg(m){const el=document.createElement('div'); el.className=`msg ${m.role==='answer'?'answer':'ask'}`; const who=m.role==='answer'?'호스트':'익명';
  el.innerHTML=`<div>${escapeHtml(m.text)}</div><div class="meta">${who} • ${escapeHtml(m.nick||'')} • ${fmtTime(m.t)}</div>`; chat.appendChild(el); chat.scrollTop=chat.scrollHeight;}
fetch(`/api/profile/${slug}`).then(r=>r.json()).then(p=>{ if(p.error){title.textContent='페이지가 없어요';return;} title.textContent=p.displayName; });
fetch(`/api/messages/${slug}`).then(r=>r.json()).then(d=>{ (d.messages||[]).forEach(addMsg); chat.scrollTop=chat.scrollHeight; });
socket.on('message', addMsg);
composer.addEventListener('submit', async (e)=>{ e.preventDefault(); const val=text.value; if(!val.trim())return;
  const res=await fetch(`/api/ask/${slug}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:val})});
  const data=await res.json(); if(!data.ok){alert('전송 실패: '+(data.error||'unknown'));return;} text.value=''; });
