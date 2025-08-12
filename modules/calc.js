export function initCalc(root) {
  root.innerHTML = `
    <div class="card">
      <h2>Calculator</h2>
      <div id="calcDisplay" class="input" style="text-align:right; font-size:24px; margin-bottom:8px;">0</div>
      <div class="row-3" id="calcKeys" style="grid-template-columns: repeat(4, 1fr);">
        ${['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+','C','⌫','±','%'].map(k=>`<button class="btn" data-k="${k}">${k}</button>`).join('')}
      </div>
    </div>
  `;
  const display = root.querySelector('#calcDisplay');
  let cur = '0', op = null, mem = null, justEq = false;
  const set = v => { cur = v; display.textContent = cur; };
  const toNum = v => parseFloat(v || '0');
  function apply(nextOp) {
    if (mem === null) { mem = toNum(cur); }
    else {
      const b = toNum(cur);
      if (op === '+') mem += b;
      else if (op === '-') mem -= b;
      else if (op === '*') mem *= b;
      else if (op === '/') mem = b===0 ? NaN : mem / b;
      else if (op === '%') mem = mem % b;
    }
    op = nextOp;
    set(String(mem));
    justEq = true;
  }
  root.querySelectorAll('#calcKeys button').forEach(btn => {
    btn.onclick = () => {
      const k = btn.dataset.k;
      if (!isNaN(k)) {
        if (cur === '0' || justEq) { set(k); justEq = false; }
        else set(cur + k);
      } else if (k === '.') {
        if (!cur.includes('.')) set(cur + '.');
      } else if (['+','-','*','/','%'].includes(k)) {
        apply(k);
      } else if (k === '=') {
        apply(null);
      } else if (k === 'C') {
        cur = '0'; op = null; mem = null; set('0');
      } else if (k === '⌫') {
        if (justEq) { set('0'); justEq=false; }
        else set(cur.length>1 ? cur.slice(0,-1) : '0');
      } else if (k === '±') {
        if (cur.startsWith('-')) set(cur.slice(1)); else if (cur!=='0') set('-'+cur);
      }
    };
  });
}
