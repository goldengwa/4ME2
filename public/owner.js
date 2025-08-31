
const $ = (s)=> document.querySelector(s);
const chat=$('#chat'), title=$('#title'), slugBadge=$('#slugBadge'), passcode=$('#passcode'), loginBtn=$('#login'), sendBtn=$('#send'), answer=$('#answer');
const slug = decodeURIComponent(location.pathname.split('/owner/')[1]||''); if(!slug) location.href='/'; slugBadge.textContent=`@${slug}`;
const socket=io(); socket.emit('join_profile',{slug});
function escapeHtml(s){return s.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmtTime(t){const d=new Date(t);return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}
function addMsg(m){const el=document.createElement('div'); el.className=`msg ${m.role==='answer'?'answer':'ask'}`; const who=m.role==='answer'?'호스트':'익명';
  el.innerHTML=`<div>${escapeHtml(m.text)}</div><div class="meta">${who} • ${escapeHtml(m.nick||'')} • ${fmtTime(m.t)}</div>`; chat.appendChild(el); chat.scrollTop=chat.scrollHeight;}
async function loadAll(){ const p=await (await fetch(`/api/profile/${slug}`)).json(); if(p.error){title.textContent='페이지가 없어요';return;} title.textContent=`Owner • ${p.displayName}`;
  const d=await (await fetch(`/api/messages/${slug}`)).json(); (d.messages||[]).forEach(addMsg); chat.scrollTop=chat.scrollHeight; } loadAll();
socket.on('message', addMsg);
loginBtn.addEventListener('click', async ()=>{ const res=await fetch('/api/owner/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,passcode:passcode.value})});
  const data=await res.json(); alert(data.ok?'로그인 성공!':'로그인 실패: '+(data.error||'unknown')); });
sendBtn.addEventListener('click', async ()=>{ const txt=answer.value; if(!txt.trim())return;
  const res=await fetch(`/api/answer/${slug}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:txt})});
  const data=await res.json(); if(!data.ok){alert('전송 실패: '+(data.error||'unknown'));return;} answer.value=''; });
answer.addEventListener('keydown',(e)=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendBtn.click(); }});
