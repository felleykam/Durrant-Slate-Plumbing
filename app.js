import { initJobs } from './modules/jobs.js';
import { initCalc } from './modules/calc.js';
import { initNotes } from './modules/notes.js';
import { initBoard } from './modules/board.js';
import { cloudEnabled, signIn, signOut, currentUser } from './modules/cloud.js';

async function renderAuthHeader(){
  const header = document.querySelector('.app-header');
  if(!header) return;
  let slot = document.getElementById('authSlot');
  if(!slot){
    slot = document.createElement('div');
    slot.id = 'authSlot';
    slot.style.display = 'flex'; slot.style.gap = '8px'; slot.style.alignItems = 'center';
    header.appendChild(slot);
  }
  slot.innerHTML = '';
  if(!cloudEnabled){
    const s = document.createElement('span'); s.className='small'; s.textContent='Local mode';
    slot.appendChild(s); return;
  }
  const user = await currentUser();
  if(!user){
    const inp = document.createElement('input');
    inp.placeholder = 'you@company.com'; inp.className='input'; inp.style.maxWidth='220px';
    const btn = document.createElement('button'); btn.className='btn'; btn.textContent='Sign in';
    btn.onclick = async ()=>{
      if(inp.value){
        const r = await signIn(inp.value);
        alert(r.ok ? 'Check your email for a sign-in link.' : ('Sign-in error: ' + (r.error?.message||r.error)));
      }
    };
    slot.append(inp, btn);
  }else{
    const span = document.createElement('span'); span.className='small'; span.textContent = user.email;
    const btn = document.createElement('button'); btn.className='btn ghost'; btn.textContent = 'Sign out';
    btn.onclick = signOut;
    slot.append(span, btn);
  }
}
renderAuthHeader();


const views = ['jobs','calc','notes','board'];

function show(target) {
  for (const v of views) {
    const el = document.getElementById(v);
    const tab = document.querySelector(`.tab[data-target="${v}"]`);
    if (v === target) { el.classList.remove('hidden'); tab.classList.add('active'); }
    else { el.classList.add('hidden'); tab.classList.remove('active'); }
  }
  localStorage.setItem('lastView', target);
}

// nav
document.querySelectorAll('.tabbar .tab').forEach(btn => {
  btn.addEventListener('click', () => show(btn.dataset.target));
});

// status
const statusDot = document.getElementById('onlineStatus');
function updateStatus() {
  statusDot.style.background = navigator.onLine ? 'var(--ok)' : 'var(--danger)';
}
window.addEventListener('online', updateStatus);
window.addEventListener('offline', updateStatus);
updateStatus();
try{ document.getElementById('jsStatus')?.remove(); }catch(_){}
function renderGloveToggle(){
  const header = document.querySelector('.app-header');
  if(!header) return;
  let btn = document.getElementById('gloveToggle');
  if(!btn){ btn = document.createElement('button'); btn.id='gloveToggle'; btn.className='btn ghost'; btn.style.marginLeft='8px'; header.appendChild(btn); }
  function update(){ const on = document.body.classList.contains('gloves'); btn.textContent = on ? 'Gloves: ON' : 'Gloves: OFF'; }
  btn.onclick = ()=>{ document.body.classList.toggle('gloves'); localStorage.setItem('ppwa.gloves', document.body.classList.contains('gloves')?'1':'0'); update(); };
  if(localStorage.getItem('ppwa.gloves')==='1') document.body.classList.add('gloves');
  update();
}
renderGloveToggle();

// init views
initJobs(document.getElementById('jobs'));
initCalc(document.getElementById('calc'));
initNotes(document.getElementById('notes'));
initBoard(document.getElementById('board'));

show(localStorage.getItem('lastView') || 'jobs');
