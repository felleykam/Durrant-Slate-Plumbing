export function initBoard(root) {
  root.innerHTML = `
    <div class="card">
      <h2>Board</h2>
      <div class="board-toolbar">
        <button id="addNoteToBoard" class="btn primary">+ Sticky</button>
        <button id="zoomIn" class="btn">Zoom +</button>
        <button id="zoomOut" class="btn">Zoom −</button>
        <button id="resetView" class="btn ghost">Reset View</button>
        <span class="zoom-badge" id="zoomBadge">100%</span>
      </div>
      <div class="board-wrap">
        <div class="board-canvas" id="boardCanvas"></div>
      </div>
      <p class="small">Tip: drag to pan, use Zoom buttons. Notes from the Notes tab can be pinned here.</p>
    </div>
  `;

  const canvas = root.querySelector('#boardCanvas');
  const lsKey = 'ppwa.board.items.v1';
  let items = JSON.parse(localStorage.getItem(lsKey) || '[]');

  let scale = 1, tx = 0, ty = 0;
  const zoomBadge = root.querySelector('#zoomBadge');
  function applyView() {
    canvas.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    zoomBadge.textContent = Math.round(scale*100)+'%';
  }
  function setScale(factor, cx=0, cy=0) {
    // zoom around a point (cx, cy) in canvas parent coords
    const prev = scale;
    scale = Math.min(2.5, Math.max(0.3, scale * factor));
    // adjust translate so the point stays under cursor
    tx = cx - (cx - tx) * (scale/prev);
    ty = cy - (cy - ty) * (scale/prev);
    applyView();
    saveState();
  }
  function resetView(){ scale=1; tx=0; ty=0; applyView(); saveState(); }

  // Pan
  let panning = false, panStart = null;
  canvas.parentElement.addEventListener('pointerdown', (e)=>{
    panning = true; panStart = {x: e.clientX - tx, y: e.clientY - ty};
    e.currentTarget.setPointerCapture(e.pointerId);
  });
  canvas.parentElement.addEventListener('pointermove', (e)=>{
    if (!panning) return;
    tx = e.clientX - panStart.x;
    ty = e.clientY - panStart.y;
    applyView();
  });
  canvas.parentElement.addEventListener('pointerup', ()=>{ panning=false; saveState(); });

  // Zoom controls
  root.querySelector('#zoomIn').onclick = ()=> setScale(1.15, canvas.parentElement.clientWidth/2, canvas.parentElement.clientHeight/2);
  root.querySelector('#zoomOut').onclick = ()=> setScale(1/1.15, canvas.parentElement.clientWidth/2, canvas.parentElement.clientHeight/2);
  root.querySelector('#resetView').onclick = resetView;

  // Items
  function render() {
    canvas.innerHTML = '';
    for (const it of items) {
      const el = document.createElement('div');
      el.className = 'board-item';
      el.style.left = it.x+'px';
      el.style.top = it.y+'px';
      el.style.width = (it.w||200)+'px';
      el.style.height = (it.h||120)+'px';
      el.innerHTML = `
        <div class="grab">Drag • <button data-act="del" class="btn small" style="float:right;">Delete</button></div>
        <textarea>${(it.body||'').replace(/</g,'&lt;')}</textarea>
      `;
      // drag (convert pointer movement to canvas coords considering scale)
      let dragging = false, start = null;
      el.querySelector('.grab').addEventListener('pointerdown', (e)=>{
        dragging = true; start = {x: e.clientX, y: e.clientY, ox: it.x, oy: it.y};
        el.setPointerCapture(e.pointerId);
        e.stopPropagation();
      });
      el.addEventListener('pointermove', (e)=>{
        if (!dragging) return;
        const dx = (e.clientX - start.x) / scale;
        const dy = (e.clientY - start.y) / scale;
        it.x = Math.round(start.ox + dx);
        it.y = Math.round(start.oy + dy);
        el.style.left = it.x+'px';
        el.style.top = it.y+'px';
      });
      el.addEventListener('pointerup', ()=>{ dragging=false; saveItems(); });

      // content edit
      const ta = el.querySelector('textarea');
      ta.addEventListener('input', ()=>{ it.body = ta.value; saveItems(); });

      el.querySelector('[data-act="del"]').onclick = ()=>{
        const i = items.findIndex(x=>x.id===it.id);
        if (i>=0){ items.splice(i,1); saveItems(); render(); }
      };

      canvas.appendChild(el);
    }
  }

  function saveItems(){ localStorage.setItem(lsKey, JSON.stringify(items)); }
  function saveState(){ localStorage.setItem('ppwa.board.view', JSON.stringify({scale,tx,ty})); }
  function loadState(){ try{ const v=JSON.parse(localStorage.getItem('ppwa.board.view')); if(v){ scale=v.scale||1; tx=v.tx||0; ty=v.ty||0; } }catch{} }
  function addSticky(text=''){
    const it = { id: crypto.randomUUID(), type:'sticky', x: 200, y: 200, w: 220, h: 120, body: text };
    items.push(it); saveItems(); render();
  }

  // Accept pins from Notes
  function consumePins(){
    const queueKey = 'ppwa.board.pinQueue';
    const q = JSON.parse(localStorage.getItem(queueKey) || '[]');
    if (q.length){
      for (const p of q) {
        if (p.type==='note') addSticky((p.title? p.title + '\n' : '') + (p.body||''));
      }
      localStorage.setItem(queueKey, JSON.stringify([]));
    }
  }

  root.querySelector('#addNoteToBoard').onclick = ()=> addSticky('New sticky…');

  // init
  loadState();
  render();
  applyView();
  consumePins();
}
