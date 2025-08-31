
const $=s=>document.querySelector(s);
const slug=decodeURIComponent(location.pathname.split('/@')[1]||''); if(!slug) location.href='/';
$('#slugBadge').textContent='@'+slug;
const socket=io(); socket.emit('join_profile',{slug});
const feed=$('#feed'), text=$('#text'), send=$('#send');

function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function fmt(t){const d=new Date(t);return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}
function qCard(m){ return `<div class="qcard" data-id="${m.id}"><div>${escapeHtml(m.text)}</div><div class="qmeta">익명 • ${fmt(m.t)}</div><div class="qactions">
  <button class="iconbtn like">좋아요 <span class="likecount">0</span></button>
  <button class="iconbtn report">신고</button>
</div></div>`; }
function aCard(m){ return `<div class="acard"><div>${escapeHtml(m.text)}</div><div class="ameta">호스트 • ${fmt(m.t)}</div></div>`; }

function addMsg(m){
  if(m.role==='ask'){ feed.insertAdjacentHTML('afterbegin', qCard(m)); }
  else if(m.role==='answer'){ feed.insertAdjacentHTML('afterbegin', aCard(m)); }
}
function bindInteractive(root){
  root.querySelectorAll('.iconbtn.like').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const span=btn.querySelector('.likecount'); span.textContent= String(parseInt(span.textContent||'0')+1);
    });
  });
  root.querySelectorAll('.iconbtn.report').forEach(btn=>{
    btn.addEventListener('click',()=> alert('신고가 접수되었습니다(시뮬레이션).'));
  });
}

fetch(`/api/profile/${slug}`).then(r=>r.json()).then(p=>{ if(!p.error) $('#title').textContent=p.displayName; });
fetch(`/api/messages/${slug}`).then(r=>r.json()).then(d=>{
  (d.messages||[]).reverse().forEach(m=> feed.insertAdjacentHTML('beforeend', m.role==='ask'? qCard(m): aCard(m)));
  bindInteractive(document);
});

socket.on('message', (m)=>{
  addMsg(m);
  bindInteractive(feed.firstElementChild || feed);
});

send.addEventListener('click', async ()=>{
  const val=text.value; if(!val.trim()) return;
  const r=await fetch(`/api/ask/${slug}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:val})});
  const d=await r.json(); if(!d.ok){ alert('전송 실패: '+(d.error||'unknown')); return; } text.value='';
});
text.addEventListener('keydown',(e)=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send.click(); } });
