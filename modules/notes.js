export function initNotes(root) {
  root.innerHTML = `
    <div class="card">
      <h2>Notes</h2>
      <div class="row">
        <input id="n_title" class="input" placeholder="Note title">
        <div style="display:flex; gap:8px;">
          <button id="addNote" class="btn primary">Add</button>
          <button id="exportNotes" class="btn">Export</button>
          <button id="clearNotes" class="btn danger">Clear</button>
        </div>
      </div>
      <textarea id="n_body" class="input" rows="4" placeholder="Write something..."></textarea>
    </div>
    <div class="list" id="notesList"></div>
  `;

  const lsKey = 'ppwa.notes.v1';
  const notes = JSON.parse(localStorage.getItem(lsKey) || '[]');
  function save(){ localStorage.setItem(lsKey, JSON.stringify(notes)); render(); }
  function render(){
    const list = root.querySelector('#notesList');
    list.innerHTML = '';
    for (const n of notes) {
      const el = document.createElement('div');
      el.className = 'item';
      el.innerHTML = `
        <div style="display:flex; justify-content: space-between; align-items:center;">
          <strong>${escapeHtml(n.title||'Untitled')}</strong>
          <div class="actions">
            <button class="btn small" data-act="pin">Pin to Board</button>
            <button class="btn small" data-act="edit">Edit</button>
            <button class="btn danger small" data-act="del">Delete</button>
          </div>
        </div>
        <div class="small">${escapeHtml(n.body||'')}</div>
      `;
      el.querySelector('[data-act="del"]').onclick = () => {
        const i = notes.findIndex(x=>x.id===n.id); if(i>=0){ notes.splice(i,1); save(); }
      };
      el.querySelector('[data-act="edit"]').onclick = () => {
        root.querySelector('#n_title').value = n.title||'';
        root.querySelector('#n_body').value = n.body||'';
        const i = notes.findIndex(x=>x.id===n.id); if(i>=0){ notes.splice(i,1); save(); }
      };
      el.querySelector('[data-act="pin"]').onclick = () => {
        // simple bridge via localStorage queue for Board to consume
        const queueKey = 'ppwa.board.pinQueue';
        const q = JSON.parse(localStorage.getItem(queueKey) || '[]');
        q.push({type:'note', title:n.title, body:n.body});
        localStorage.setItem(queueKey, JSON.stringify(q));
        alert('Pinned to Board (open Board tab)');
      };
      list.appendChild(el);
    }
  }

  root.querySelector('#addNote').onclick = () => {
    const title = root.querySelector('#n_title').value.trim();
    const body = root.querySelector('#n_body').value.trim();
    if (!title && !body) return;
    notes.unshift({ id: crypto.randomUUID(), title, body, ts: Date.now() });
    root.querySelector('#n_title').value='';
    root.querySelector('#n_body').value='';
    save();
  };
  root.querySelector('#exportNotes').onclick = () => {
    const blob = new Blob([JSON.stringify(notes,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='notes-export.json'; a.click();
    URL.revokeObjectURL(url);
  };
  root.querySelector('#clearNotes').onclick = () => {
    if (confirm('Delete ALL notes?')) { notes.splice(0, notes.length); save(); }
  };

  render();
}

function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
