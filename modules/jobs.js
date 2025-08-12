// Ported 'Plumbing Field Log' scoped into the Jobs tab as an ES module.
import { cloudEnabled, fetchEntries as cloudFetch, upsertEntry as cloudUpsert, deleteEntryCloud, fetchAudit } from './cloud.js';

export function initJobs(root){
  // Inject minimal extra CSS once
  if(!document.getElementById('jobs-extra-css')){
    const css = document.createElement('style');
    css.id = 'jobs-extra-css';
    css.textContent = `
      .j-wrap{max-width:980px;margin:0 auto;display:block}
      .j-bar{display:flex;gap:12px;align-items:center;justify-content:space-between;margin-bottom:8px}
      .j-title{display:flex;gap:10px;align-items:baseline}
      .j-title h2{font-size:18px;margin:0;font-weight:700;letter-spacing:.2px}
      .j-actions{display:flex;gap:8px;flex-wrap:wrap}
      .j-tabs{display:flex;gap:10px;border-bottom:1px solid #1f2937;padding:8px 4px;margin:6px 0 12px}
      .j-tabs button{background:transparent;color:var(--muted);border:1px solid transparent;border-radius:10px;padding:8px 12px}
      .j-tabs button.active{color:var(--text);border-color:#1f2937;background:#0b1220}
      .pill{display:inline-flex;gap:6px;align-items:center;background:#0e1624;border:1px solid #1f2937;padding:6px 10px;border-radius:999px;color:var(--muted);font-size:12px}
      .kpi{display:flex;gap:8px;align-items:center}
      .dot{width:10px;height:10px;border-radius:999px;display:inline-block}
      .chips{display:flex;gap:6px;flex-wrap:wrap}
      .thumb{width:88px;height:66px;object-fit:cover;border-radius:10px;border:1px solid #1f2937}
      .thumb-wrap{display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap}
      .list-header{display:flex;gap:10px;align-items:center;justify-content:space-between;margin:8px 0}
      .j-grid{display:grid;gap:12px}
      @media(min-width:760px){ .j-two{grid-template-columns:1fr 1fr} .j-three{grid-template-columns:repeat(3,1fr)} }
      @media print{ .j-actions, .j-tabs, #j_entries, #j_importer, #j_settings { display:none !important } }
    `;
    document.head.appendChild(css);
  }

  root.innerHTML = `
    <div class="j-wrap">
      <div class="card">
        <div class="j-bar">
          <div class="j-title"><h2>Plumbing Field Log</h2></div>
          <div class="j-actions">
            <button id="j_btnExportJSON" type="button" class="btn">Export JSON</button>
            <button id="j_btnExportCSV" type="button" class="btn">Export CSV</button>
            <button id="j_btnImport" type="button" class="btn">Import</button>
            <button id="j_btnSettings" type="button" class="btn ghost">Settings</button>
          </div>
        </div>
        <nav class="j-tabs"><button class="btn ghost" id="j_sync" type="button" style="margin-left:auto">Sync</button>
          <button class="active btn" data-tab="j_form" type="button">New / Edit</button>
          <button class="btn" data-tab="j_entries" type="button">Entries</button>
        </nav>

        <!-- FORM CARD -->
        <section id="j_form" class="j-grid">
          <div id="j_savebar" class="savebar" style="position:fixed;left:10px;right:10px;bottom:72px;z-index:20;display:flex;gap:8px;align-items:center;justify-content:space-between;background:linear-gradient(180deg,var(--panel),var(--panel-2));border:1px solid #1f2937;border-radius:16px;padding:10px 12px;box-shadow:0 12px 28px rgba(0,0,0,.35)">
            <strong>Quick Actions</strong>
            <div style="display:flex;gap:8px">
              <button type="button" id="j_quickSave" class="btn primary">Save</button>
              <button type="button" id="j_quickDup" class="btn">Duplicate</button>
              <button type="button" id="j_quickClear" class="btn ghost">Clear</button>
            </div>
          </div>
          <form id="j_entryForm" class="j-grid j-two">
            <input type="hidden" id="j_entryId" />
            <div>
              <label for="j_date">Date</label>
              <input type="date" id="j_date" class="input" required />
            </div>
            <div>
              <label for="j_time">Time</label>
              <input type="time" id="j_time" class="input" required />
            </div>

            <div>
              <label for="j_job">Job Site (name / lot)</label>
              <input type="text" id="j_job" class="input" placeholder="e.g., Symphony Homes • Lot 12" required />
            </div>
            <div>
              <label for="j_location">Location (address or lat,lng)</label>
              <div class="row" style="gap:8px">
                <input type="text" id="j_location" class="input" placeholder="123 W Example Rd, Saratoga Springs" />
                <button type="button" id="j_btnGPS" class="btn">📍</button>
                <button type="button" id="j_btnMaps" class="btn">🗺️</button>
              </div>
              <div id="j_coords" class="small" style="margin-top:4px"></div>
            </div>

            <div>
              <label for="j_gc">GC Company</label>
              <input type="text" id="j_gc" class="input" placeholder="e.g., Rainey Homes / Symphony Homes" />
            </div>
            <div>
              <label for="j_super">Superintendent</label>
              <input type="text" id="j_super" class="input" placeholder="Name" />
            </div>

            <div class="hr j-two" style="grid-column:1 / -1"></div>

            <div class="card" style="background:var(--panel-2)">
              <h3 style="margin:0 0 8px 0">Water Lines Test</h3>
              <div class="j-grid j-two">
                <div>
                  <label for="j_waterTested">Tested?</label>
                  <select id="j_waterTested" class="input">
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label for="j_waterPass">Pass/Fail</label>
                  <select id="j_waterPass" class="input">
                    <option value="N/A">N/A</option>
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                  </select>
                </div>
                <div>
                  <label for="j_waterPSI">PSI</label>
                  <input type="number" id="j_waterPSI" class="input" placeholder="e.g., 100" inputmode="decimal" />
                </div>
                <div>
                  <label for="j_waterMinutes">Duration (min)</label>
                  <input type="number" id="j_waterMinutes" class="input" placeholder="e.g., 15" inputmode="decimal" />
                </div>
              </div>
            </div>

            <div class="card" style="background:var(--panel-2)">
              <h3 style="margin:0 0 8px 0">Drainage Test</h3>
              <div class="j-grid j-two">
                <div>
                  <label for="j_drainTested">Tested?</label>
                  <select id="j_drainTested" class="input">
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label for="j_drainPass">Pass/Fail</label>
                  <select id="j_drainPass" class="input">
                    <option value="N/A">N/A</option>
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                  </select>
                </div>
                <div>
                  <label for="j_drainHead">Head (ft/in or inches)</label>
                  <input type="text" id="j_drainHead" class="input" placeholder="e.g., 10' head or 120 in" />
                </div>
                <div>
                  <label for="j_drainMinutes">Duration (min)</label>
                  <input type="number" id="j_drainMinutes" class="input" placeholder="e.g., 15" inputmode="decimal" />
                </div>
              </div>
            </div>

            <div class="card" style="background:var(--panel-2)">
              <h3 style="margin:0 0 8px 0">Inspection / Test Tag</h3>
              <div class="j-grid j-two">
                <div>
                  <label for="j_testPulled">Test Pulled?</label>
                  <select id="j_testPulled" class="input">
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label for="j_inspector">Inspector / City</label>
                  <input type="text" id="j_inspector" class="input" placeholder="City & inspector (if any)" />
                </div>
                <div>
                  <label for="j_permit">Permit / Tag #</label>
                  <input type="text" id="j_permit" class="input" placeholder="Optional" />
                </div>
                <div>
                  <label for="j_nextSteps">Next Steps</label>
                  <input type="text" id="j_nextSteps" class="input" placeholder="e.g., Re-test tomorrow, fix leak @ lav" />
                </div>
              </div>
            </div>

            <div class="card" style="background:var(--panel-2)">
              <h3 style="margin:0 0 8px 0">Status & Materials</h3>
              <div class="j-grid j-two">
                <div style="grid-column:1 / -1">
                  <label for="j_completed">Completed</label>
                  <textarea id="j_completed" class="input" placeholder="Rough-in master bath; set tub drain; pressure test"></textarea>
                </div>
                <div style="grid-column:1 / -1">
                  <label for="j_attention">Needs Attention</label>
                  <textarea id="j_attention" class="input" placeholder="Leak at 2F lav cold stub; order 3/4&quot; PEX tees"></textarea>
                </div>

                <div style="grid-column:1 / -1">
                  <label>Materials Used</label>
                  <div id="j_materials"></div>
                  <div class="row" style="margin-top:6px">
                    <button type="button" id="j_btnAddMat" class="btn">+ Add Material</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="card" style="background:var(--panel-2)">
              <h3 style="margin:0 0 8px 0">Photos & Descriptions</h3>
              <div class="row">
                <input type="file" id="j_photoInput" accept="image/*" multiple />
              </div>
              <div id="j_photoList" class="thumb-wrap" style="margin-top:8px"></div>
            </div>

            <div style="grid-column:1 / -1">
              <label for="j_notes">General Notes</label>
              <textarea id="j_notes" class="input" placeholder="What you did, materials, issues, who you talked to, punch items..."></textarea>
            </div>

            <div class="row" style="grid-column:1 / -1;justify-content:space-between;margin-top:4px">
              <div class="row">
                <button type="submit" class="btn">Save Entry</button>
                <button type="button" id="j_btnReset" class="btn">Clear</button>
              </div>
              <div class="row">
                <button type="button" id="j_btnPrint" class="btn">Print</button>
                <button type="button" id="j_btnDuplicate" class="btn">Duplicate</button>
              </div>
            </div>
          </form>
        </section>

        <!-- ENTRIES -->
        <section id="j_entries" class="hidden">
          <div class="list-header">
            <div class="row" style="gap:8px">
              <input id="j_search" class="input" type="text" placeholder="Search job, notes, GC, super..." style="min-width:250px" />
              <select id="j_filterPass" class="input">
                <option value="">All</option>
                <option value="Pass">Water: Pass</option>
                <option value="Fail">Water: Fail</option>
                <option value="DPass">Drain: Pass</option>
                <option value="DFail">Drain: Fail</option>
              </select>
            </div>
            <div class="row">
              <select id="j_sortBy" class="input">
                <option value="dateDesc">Newest first</option>
                <option value="dateAsc">Oldest first</option>
                <option value="jobAZ">Job A→Z</option>
                <option value="jobZA">Job Z→A</option>
              </select>
            </div>
          </div>
          <div id="j_list" class="list"></div>
        </section>

        <!-- IMPORTER -->
        <section id="j_importer" class="hidden card">
          <h3 style="margin-top:0">Import JSON Backup</h3>
          <p class="small">Choose a previously exported JSON file. Entries will be merged as new copies.</p>
          <input type="file" id="j_fileInput" accept="application/json" />
        </section>

        <!-- SETTINGS -->
        <section id="j_settings" class="hidden card j-grid j-two">
          <div><label for="j_displayName">Your Name (for tags)</label><input id="j_displayName" class="input" type="text" placeholder="e.g., Deklan" /></div>
<div><label for="j_defGC">Default GC Company</label><input id="j_defGC" class="input" type="text" placeholder="Optional" /></div>
          <div><label for="j_defPSI">Default Water Test PSI</label><input id="j_defPSI" class="input" type="number" placeholder="e.g., 100" /></div>
          <div><label for="j_defCity">Default City</label><input id="j_defCity" class="input" type="text" placeholder="Optional" /></div>
          <div><label for="j_defSuper">Default Superintendent</label><input id="j_defSuper" class="input" type="text" placeholder="Optional" /></div>
          <div>
            <label for="j_geoProvider">Geocoding Provider</label>
            <select id="j_geoProvider" class="input">
              <option value="nominatim">OpenStreetMap (free)</option>
              <option value="locationiq">LocationIQ (API key)</option>
              <option value="mapbox">Mapbox (token)</option>
            </select>
          </div>
          <div><label for="j_geoApiKey">API Key / Token</label><input id="j_geoApiKey" class="input" type="text" placeholder="Leave empty for OpenStreetMap" /></div>
          <div><label for="j_contactEmail">Contact Email (for OSM)</label><input id="j_contactEmail" class="input" type="email" placeholder="Optional, improves reliability" /></div>
          <div>
            <label for="j_addrFormat">Address Format</label>
            <select id="j_addrFormat" class="input">
              <option value="full">Full</option>
              <option value="short">Short</option>
            </select>
          </div>
          <div style="grid-column:1 / -1" class="row">
            <button id="j_btnSaveSettings" class="btn" type="button">Save Settings</button>
            <button id="j_btnClearAll" class="btn" type="button" title="Delete ALL entries (cannot be undone)">Clear ALL Entries</button>
          </div>
        </section>
      </div>
    </div>
  `;

  // ---- Simple localStorage DB ----
  const KEY = 'plumbLog_v2';
  const SETTINGS_KEY = 'plumbLog_settings_v2';

  const $ = sel => root.querySelector(sel);
  const $$ = sel => root.querySelectorAll(sel);

  const todayStr = () => new Date().toISOString().slice(0,10);
  const timeStr = () => new Date().toTimeString().slice(0,5);

  function loadEntries(){
    try{
      const v2 = JSON.parse(localStorage.getItem(KEY));
      if(Array.isArray(v2)) return v2;
      const v1 = JSON.parse(localStorage.getItem('plumbLog_v1'));
      return Array.isArray(v1) ? v1 : [];
    }catch(e){ return [] }
  }
  function saveEntries(arr){
    try{ localStorage.setItem(KEY, JSON.stringify(arr)) }
    catch(err){ alert('Save failed (likely photo storage is full). Try removing some photos or exporting & clearing.'); }
  }
  function uid(){ return (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).slice(2)) }

  function loadSettings(){
    try{ return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {} }catch(e){ return {} }
  }
  function saveSettings(obj){ localStorage.setItem(SETTINGS_KEY, JSON.stringify(obj)) }

  const state = { entries: loadEntries(), settings: loadSettings(), formPhotos: [] };

  function userName(){
    let name = (window.__supabaseUserEmail) || state.settings.displayName || 'Unknown';
    return name;
  }
  function tagColor(name){
    let h=0; for(let i=0;i<name.length;i++){ h=(h*31 + name.charCodeAt(i))>>>0; }
    h = h % 360; return `hsl(${h} 70% 22%)`;
  }


  // Cloud sync (optional)
  async function syncFromCloud(){
    if(!cloudEnabled) return;
    try{
      const rows = await cloudFetch();
      if(Array.isArray(rows)){
        state.entries = rows;
        saveEntries(state.entries); // cache
        renderList();
        toast('Synced from cloud');
      }
    }catch(e){ console.warn('Cloud fetch failed', e); }
  }
  async function saveToCloud(entry){
    if(!cloudEnabled) return entry;
    try{
      const saved = await cloudUpsert(entry);
      return saved || entry;
    }catch(e){ alert('Cloud save failed: ' + e.message); return entry; }
  }
  async function deleteFromCloud(id){
    if(!cloudEnabled) return;
    try{ await deleteEntryCloud(id); }catch(e){ alert('Cloud delete failed: ' + e.message); }
  }


  // ---- Tabs ----
  $$('.j-tabs button').forEach(b=>{
    b.addEventListener('click', ()=>{
      $$('.j-tabs button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      ['j_form','j_entries','j_importer','j_settings'].forEach(id=> $('#'+id).classList.add('hidden'));
      const tab = b.dataset.tab;
      if(tab==='j_form') $('#j_form').classList.remove('hidden');
      if(tab==='j_entries'){ $('#j_entries').classList.remove('hidden'); renderList(); }
    });
  });

    // Header action routes
  $('#j_sync').addEventListener('click', ()=> syncFromCloud());
  $('#j_btnImport').addEventListener('click', ()=>{
    $$('.j-tabs button').forEach(x=>x.classList.remove('active'));
    $('#j_form').classList.add('hidden');
    $('#j_entries').classList.add('hidden');
    $('#j_settings').classList.add('hidden');
    $('#j_importer').classList.remove('hidden');
  });
  $('#j_btnSettings').addEventListener('click', ()=>{
    $$('.j-tabs button').forEach(x=>x.classList.remove('active'));
    $('#j_form').classList.add('hidden');
    $('#j_entries').classList.add('hidden');
    $('#j_importer').classList.add('hidden');
    $('#j_settings').classList.remove('hidden');
    // preload settings into fields
    $('#j_displayName').value = state.settings.displayName || '';
      $('#j_defGC').value = state.settings.defGC || '';
    $('#j_defPSI').value = state.settings.defPSI || '';
    $('#j_defCity').value = state.settings.defCity || '';
    $('#j_defSuper').value = state.settings.defSuper || '';
    $('#j_geoProvider').value = state.settings.geoProvider || 'nominatim';
    $('#j_geoApiKey').value = state.settings.geoApiKey || '';
    $('#j_contactEmail').value = state.settings.contactEmail || '';
    $('#j_addrFormat').value = state.settings.addrFormat || 'full';
  });

  // ---- Form helpers ----
  function resetForm(preset={}){
    $('#j_entryId').value = preset.id || '';
    $('#j_date').value = preset.date || todayStr();
    $('#j_time').value = preset.time || timeStr();
    $('#j_job').value = preset.job || '';
    $('#j_location').value = preset.location || '';
    const coordsObj = preset.coords || null;
    $('#j_coords').textContent = coordsObj ? `GPS: ${coordsObj.lat.toFixed(6)}, ${coordsObj.lng.toFixed(6)}` : '';
    $('#j_coords').dataset.coords = coordsObj ? JSON.stringify(coordsObj) : '';
    $('#j_gc').value = preset.gc || state.settings.defGC || '';
    $('#j_super').value = preset.super || state.settings.defSuper || '';
    $('#j_waterTested').value = preset.waterTested || 'No';
    $('#j_waterPass').value = preset.waterPass || 'N/A';
    $('#j_waterPSI').value = preset.waterPSI ?? (state.settings.defPSI || '');
    $('#j_waterMinutes').value = preset.waterMinutes || '';
    $('#j_drainTested').value = preset.drainTested || 'No';
    $('#j_drainPass').value = preset.drainPass || 'N/A';
    $('#j_drainHead').value = preset.drainHead || '';
    $('#j_drainMinutes').value = preset.drainMinutes || '';
    $('#j_testPulled').value = preset.testPulled || 'No';
    $('#j_inspector').value = preset.inspector || (state.settings.defCity ? `${state.settings.defCity}` : '');
    $('#j_permit').value = preset.permit || '';
    $('#j_nextSteps').value = preset.nextSteps || '';
    $('#j_completed').value = preset.completed || '';
    $('#j_attention').value = preset.attention || '';
    setMaterials(preset.materials || []);
    state.formPhotos = Array.isArray(preset.photos) ? preset.photos : [];
    renderPhotos();
    $('#j_notes').value = preset.notes || '';
  }

  const FIELDS_TO_TRACK = ['job','location','gc','super','waterTested','waterPass','waterPSI','waterMinutes','drainTested','drainPass','drainHead','drainMinutes','testPulled','inspector','permit','nextSteps','completed','attention','materials','notes'];

function readForm(){
    return {
      id: $('#j_entryId').value || uid(),
      date: $('#j_date').value,
      time: $('#j_time').value,
      job: $('#j_job').value.trim(),
      location: $('#j_location').value.trim(),
      coords: $('#j_coords').dataset.coords ? JSON.parse($('#j_coords').dataset.coords) : null,
      gc: $('#j_gc').value.trim(),
      super: $('#j_super').value.trim(),
      waterTested: $('#j_waterTested').value,
      waterPass: $('#j_waterPass').value,
      waterPSI: $('#j_waterPSI').value ? Number($('#j_waterPSI').value) : '',
      waterMinutes: $('#j_waterMinutes').value ? Number($('#j_waterMinutes').value) : '',
      drainTested: $('#j_drainTested').value,
      drainPass: $('#j_drainPass').value,
      drainHead: $('#j_drainHead').value.trim(),
      drainMinutes: $('#j_drainMinutes').value ? Number($('#j_drainMinutes').value) : '',
      testPulled: $('#j_testPulled').value,
      inspector: $('#j_inspector').value.trim(),
      permit: $('#j_permit').value.trim(),
      nextSteps: $('#j_nextSteps').value.trim(),
      completed: $('#j_completed').value.trim(),
      attention: $('#j_attention').value.trim(),
      materials: getMaterials(),
      photos: state.formPhotos,
      notes: $('#j_notes').value.trim(),
      createdAt: $('#j_entryId').value ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  function isSecure(){ return (window.isSecureContext || location.protocol==='https:' || location.hostname==='localhost'); }
  function formatLatLng(lat,lng){ return `${lat.toFixed(6)}, ${lng.toFixed(6)}` }
  function shortAddrFromOSM(obj){
    const a = obj && obj.address ? obj.address : {};
    const parts = [];
    if(a.road) parts.push(a.house_number ? `${a.house_number} ${a.road}` : a.road);
    const city = a.city || a.town || a.village || a.hamlet;
    if(city) parts.push(city);
    if(a.state) parts.push(a.state);
    return parts.join(', ');
  }

  async function reverseGeocode(lat,lng){
    const provider = (state.settings.geoProvider || 'nominatim');
    const key = state.settings.geoApiKey || '';
    const wantShort = (state.settings.addrFormat || 'full') === 'short';
    try{
      if(provider==='locationiq' && key){
        const url = `https://us1.locationiq.com/v1/reverse?key=${encodeURIComponent(key)}&lat=${lat}&lon=${lng}&format=json&normalizeaddress=1`;
        const r = await fetch(url);
        if(!r.ok) throw new Error('LocationIQ failed');
        const j = await r.json();
        if(wantShort && j.address){
          const parts = [j.address.road, j.address.city || j.address.town || j.address.village, j.address.state].filter(Boolean);
          return parts.join(', ') || j.display_name || formatLatLng(lat,lng);
        }
        return j.display_name || formatLatLng(lat,lng);
      }
      if(provider==='mapbox' && key){
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${encodeURIComponent(key)}`;
        const r = await fetch(url);
        if(!r.ok) throw new Error('Mapbox failed');
        const j = await r.json();
        const full = j.features && j.features[0] && j.features[0].place_name;
        return full || formatLatLng(lat,lng);
      }
      // Default: Nominatim (OSM) — light personal use only
      const email = state.settings.contactEmail ? `&email=${encodeURIComponent(state.settings.contactEmail)}` : '';
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1${email}`;
      const r = await fetch(url, { headers: { 'Accept':'application/json' }});
      if(!r.ok) throw new Error('Nominatim failed');
      const j = await r.json();
      if(wantShort){
        const s = shortAddrFromOSM(j);
        return s || j.display_name || formatLatLng(lat,lng);
      }
      return j.display_name || formatLatLng(lat,lng);
    }catch(err){ console.warn('Reverse geocode failed:', err); return formatLatLng(lat,lng); }
  }

  // GPS capture
  $('#j_btnGPS').addEventListener('click', ()=>{
    if(!navigator.geolocation){ alert('Geolocation not supported on this device.'); return }
    if(!isSecure()){
      alert('GPS needs https or localhost. If you opened this as a file, serve it from http://localhost or host it on GitHub Pages.');
      return;
    }
    const btn = $('#j_btnGPS'); btn.disabled = true; btn.textContent = '…';
    navigator.geolocation.getCurrentPosition(async pos=>{
      const { latitude:lat, longitude:lng } = pos.coords;
      const pair = formatLatLng(lat,lng);
      $('#j_coords').textContent = `GPS: ${pair}`;
      $('#j_coords').dataset.coords = JSON.stringify({lat, lng, ts: Date.now()});
      try{
        const addr = await reverseGeocode(lat,lng);
        $('#j_location').value = addr; // fill with street address
      }catch(_){ $('#j_location').value = pair; }
      btn.textContent = '📍'; btn.disabled = false;
    }, err=>{
      alert('GPS error: ' + err.message + ' — Tip: On iOS/Safari, GPS requires https or localhost.');
      btn.textContent = '📍'; btn.disabled = false;
    }, { enableHighAccuracy:true, timeout:15000, maximumAge:0 });
  });

  // Open in Maps (Apple on iOS, Google elsewhere)
  $('#j_btnMaps').addEventListener('click', ()=>{
    let lat=null, lng=null;
    if($('#j_coords').dataset.coords){
      try { const c = JSON.parse($('#j_coords').dataset.coords); lat=c.lat; lng=c.lng; } catch(_){}
    }
    if(lat===null || lng===null){
      const m = ($('#j_location').value||'').match(/(-?\\d+\\.?\\d*)\\s*,\\s*(-?\\d+\\.?\\d*)/);
      if(m){ lat=parseFloat(m[1]); lng=parseFloat(m[2]); }
    }
    const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    let url='';
    if(lat!==null && lng!==null){
      const pair = lat + ',' + lng;
      url = isiOS ? ('https://maps.apple.com/?ll=' + pair) : ('https://www.google.com/maps?q=' + pair);
    } else {
      const q = encodeURIComponent($('#j_location').value||'');
      url = isiOS ? ('https://maps.apple.com/?q=' + q) : ('https://www.google.com/maps/search/?api=1&query=' + q);
    }
    window.open(url, '_blank');
  });

  // Materials UI
  function matRow(m={ id: uid(), name:'', qty:'', unit:'' }){
    const wrap = document.createElement('div');
    wrap.className = 'row';
    wrap.style.cssText = 'gap:8px; align-items:flex-end; margin:6px 0; flex-wrap:wrap';
    wrap.dataset.id = m.id;
    wrap.innerHTML = `
      <div style="flex:1 1 210px">
        <label>Material</label>
        <input class="input" type="text" placeholder="e.g., 1/2&quot; PEX tee" value="${m.name?escapeHTML(m.name):''}">
      </div>
      <div style="width:110px">
        <label>Qty</label>
        <input class="input" type="number" inputmode="decimal" value="${m.qty!==undefined?m.qty:''}">
      </div>
      <div style="width:140px">
        <label>Unit</label>
        <input class="input" type="text" placeholder="pcs/ft/ea" value="${m.unit?escapeHTML(m.unit):''}">
      </div>
      <button type="button" class="btn ghost" data-del>Remove</button>
    `;
    wrap.querySelector('[data-del]').addEventListener('click',()=>{ wrap.remove() });
    return wrap;
  }
  function setMaterials(arr){
    const box = $('#j_materials'); box.innerHTML = '';
    (arr && arr.length? arr : [{},{}]).forEach(m=> box.appendChild(matRow(m)));
  }
  function getMaterials(){
    return Array.from($('#j_materials').children).map(row=>{
      const [nameEl, qtyEl, unitEl] = row.querySelectorAll('input');
      return { id: row.dataset.id || uid(), name: nameEl.value.trim(), qty: qtyEl.value ? Number(qtyEl.value) : '', unit: unitEl.value.trim() };
    }).filter(m=> m.name || m.qty || m.unit);
  }
  $('#j_btnAddMat').addEventListener('click', ()=> $('#j_materials').appendChild(matRow({})));

  // Photos UI (compressed)
  async function fileToDataURL(file, maxDim=1600, quality=0.75){
    const img = new Image();
    const reader = new FileReader();
    const loaded = new Promise((res,rej)=>{ img.onload=()=>res(); img.onerror=rej; });
    const read = new Promise((res,rej)=>{ reader.onload=()=>{ img.src = reader.result; res(); }; reader.onerror=rej; });
    reader.readAsDataURL(file);
    await read; await loaded;
    const canvas = document.createElement('canvas');
    const { width:w, height:h } = img;
    const scale = Math.min(1, maxDim / Math.max(w,h));
    canvas.width = Math.round(w*scale); canvas.height = Math.round(h*scale);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  }

  function renderPhotos(){
    const box = $('#j_photoList'); box.innerHTML = '';
    if(!state.formPhotos) state.formPhotos = [];
    state.formPhotos.forEach(p=>{
      const wrap = document.createElement('div');
      wrap.style.maxWidth = '220px';
      wrap.innerHTML = `
        <img class="thumb" src="${p.dataUrl}" alt="photo" />
        <input class="input" type="text" placeholder="description" value="${p.desc?escapeHTML(p.desc):''}" style="width:220px;margin-top:6px">
        <div class="row" style="gap:6px;margin-top:6px">
          <button type="button" class="btn ghost" data-act="del">Remove</button>
        </div>
      `;
      wrap.querySelector('[data-act="del"]').addEventListener('click', ()=>{
        state.formPhotos = state.formPhotos.filter(x=> x.id!==p.id); renderPhotos();
      });
      wrap.querySelector('input').addEventListener('input', (e)=>{ p.desc = e.target.value; });
      box.appendChild(wrap);
    });
  }

  $('#j_photoInput').addEventListener('change', async (e)=>{
    const files = Array.from(e.target.files || []);
    for(const f of files){
      try{
        const dataUrl = await fileToDataURL(f);
        state.formPhotos.push({ id: uid(), name: f.name, dataUrl, desc: '' });
      }catch(err){ alert('Photo failed: ' + err.message); }
    }
    renderPhotos();
    e.target.value='';
    toast('Photos added');
  });

  // Save
  $('#j_entryForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const data = readForm();
    if(!data.date || !data.time || !data.job){ alert('Date, time, and job site are required.'); return }
    const idx = state.entries.findIndex(x=> x.id === data.id);
    let saved = await saveToCloud(data);
    // ensure id comes back for new rows
    if(!saved.id) saved.id = data.id;
    const idx = state.entries.findIndex(x=> x.id === saved.id);
    // Tag diffs per field
    const prev = state.entries.find(x=> x.id === saved.id) || {};
    const tags = Object.assign({}, prev._tags||{});
    FIELDS_TO_TRACK.forEach(k=>{
      const a = JSON.stringify(prev[k] ?? '');
      const b = JSON.stringify(saved[k] ?? '');
      if(a !== b){ tags[k] = { by: userName(), at: new Date().toISOString() }; }
    });
    saved._tags = tags; saved._lastBy = userName(); saved._lastAt = new Date().toISOString();
    if(idx>=0){ state.entries[idx] = { ...state.entries[idx], ...saved }; }
    else { state.entries.unshift(saved); }
    saveEntries(state.entries);
    resetForm({});
    toast('Saved.');
  });

  // Clear
  $('#j_btnReset').addEventListener('click', ()=> resetForm({}));

  // Duplicate
  $('#j_btnDuplicate').addEventListener('click', ()=>{
    const d = readForm();
    d.id = uid();
    d.date = todayStr();
    d.time = timeStr();
    d.createdAt = new Date().toISOString();
    d.updatedAt = d.createdAt;
    state.entries.unshift(d);
    saveEntries(state.entries);
    resetForm(d); // keep visible
    toast('Duplicated as a new entry.');
  });

  // Print (prints the whole page; Jobs view has print CSS hiding lists)
  $('#j_btnPrint').addEventListener('click', ()=> window.print());

  // ---- List rendering ----
  function statusDot(val){
    let c = '#475569';
    if(val==='Pass') c = 'var(--ok)';
    if(val==='Fail') c = 'var(--danger)';
    return `<span class="dot" style="background:${c}"></span>`;
  }

  function tagBg(name){ return tagColor(name); }
function tagDot(name){ let h=0; for(const c of name){ h=(h*31 + c.charCodeAt(0))>>>0; } h=h%360; return `hsl(${h} 85% 55%)`; }
function renderComments(entry){
  const list = (entry.comments||[]).map(c=>`<div class="comment"><div class="comment-meta">${escapeHTML(c.by||'Unknown')} • ${new Date(c.at).toLocaleString()}</div><div>${escapeHTML(c.text||'')}</div></div>`).join('') || '<div class="small muted">No comments yet.</div>';
  return `<div class="hr-lite"></div>
  <div><strong>Comments</strong></div>
  <div class="list" style="margin-top:6px">${list}</div>
  <div class="row" style="margin-top:8px;gap:8px">
    <input type="text" class="input" placeholder="Add a comment…" id="c_input_${entry.id}" style="flex:1">
    <button class="btn" data-addc="${entry.id}">Post</button>
  </div>`;
}
function wireComments(scope, entryId){
  const btn = scope.querySelector('[data-addc]'); if(!btn) return;
  btn.onclick = async ()=>{
    const id = btn.getAttribute('data-addc'); const inp = scope.querySelector('#c_input_'+id);
    const txt = (inp.value||'').trim(); if(!txt) return;
    const i = state.entries.findIndex(x=> x.id===id); if(i<0) return;
    const e = state.entries[i]; if(!Array.isArray(e.comments)) e.comments = [];
    e.comments.push({ id: crypto.randomUUID(), by: userName(), text: txt, at: new Date().toISOString() });
    saveEntries(state.entries); try{ await saveToCloud(e); }catch(_){}
    scope.innerHTML = renderComments(e); wireComments(scope, id); toast('Comment posted');
  };
}
function renderList(){
    const q = ($('#j_search').value||'').toLowerCase();
    const f = $('#j_filterPass').value;
    const sort = $('#j_sortBy').value;

    let arr = [...state.entries];
    if(q){
      arr = arr.filter(x=> [x.job,x.location,x.gc,x.super,x.notes,x.inspector,x.permit,x.completed,x.attention].join(' ').toLowerCase().includes(q));
    }
    if(f){
      if(f==='Pass') arr = arr.filter(x=> x.waterPass==='Pass');
      if(f==='Fail') arr = arr.filter(x=> x.waterPass==='Fail');
      if(f==='DPass') arr = arr.filter(x=> x.drainPass==='Pass');
      if(f==='DFail') arr = arr.filter(x=> x.drainPass==='Fail');
    }
    if(sort==='dateDesc') arr.sort((a,b)=> (b.date+b.time).localeCompare(a.date+a.time));
    if(sort==='dateAsc') arr.sort((a,b)=> (a.date+a.time).localeCompare(b.date+b.time));
    if(sort==='jobAZ') arr.sort((a,b)=> (a.job||'').localeCompare(b.job||''));
    if(sort==='jobZA') arr.sort((a,b)=> (b.job||'').localeCompare(a.job||''));

    const html = arr.map(x=>{
      const subtitle = [x.location, x.gc, x.super].filter(Boolean).join(' • ');
      const mats = (x.materials && x.materials.length) ? `${x.materials.length} material${x.materials.length>1?'s':''}` : '';
      const photos = (x.photos && x.photos.length) ? `${x.photos.length} photo${x.photos.length>1?'s':''}` : '';
      const extras = [mats, photos].filter(Boolean).join(' • ');
      return `<div class="item">
        <h3>${x.job || '(no job)'} <span class="small" style="font-weight:500">• ${x.date} ${x.time}</span></h3>
        <div class="chips">
          <span class="pill kpi">${statusDot(x.waterPass)} <span>Water: ${x.waterPass || 'N/A'}</span>${x.waterPSI?`<span class="small"> @ ${x.waterPSI} PSI</span>`:''}</span>
          <span class="pill kpi">${statusDot(x.drainPass)} <span>Drain: ${x.drainPass || 'N/A'}</span>${x.drainHead?`<span class="small"> • ${x.drainHead}</span>`:''}</span>
          ${x.testPulled==='Yes' ? `<span class="pill">Tag pulled</span>` : ''}
          ${extras?`<span class="pill">${extras}</span>`:''}
        </div>
        ${subtitle?`<div class="small" style="margin:6px 0 8px 0">${subtitle}</div>`:''}
        ${x.completed?`<div style="margin:6px 0"><strong>Completed:</strong> <span class="small">${escapeHTML(x.completed).slice(0,220)}</span></div>`:''}
        ${x.attention?`<div style="margin:6px 0"><strong>Needs Attention:</strong> <span class="small">${escapeHTML(x.attention).slice(0,220)}</span></div>`:''}
        ${x.notes?`<div style="white-space:pre-wrap;border-left:3px solid #1f2937;padding-left:10px">${escapeHTML(x.notes).slice(0,400)}</div>`:''}
        <div class="row" style="margin-top:8px;gap:8px;flex-wrap:wrap">
          <button type="button" class="btn" data-act="edit" data-id="${x.id}">Edit</button>
          <button type="button" class="btn ghost" data-act="audit" data-id="${x.id}">Changes</button>
          <button type="button" class="btn ghost" data-act="dup" data-id="${x.id}">Duplicate</button>
          <button type="button" class="btn ghost" <button type="button" class="btn ghost" data-act="share" data-id="${x.id}">Share</button>
          <button type="button" class="btn danger" data-act="del" data-id="${x.id}">Delete</button>
        </div>
        <div class="comments-box open">${renderComments(x)}</div>
      </div>`
    }).join('');

    $('#j_list').innerHTML = html || `<div class="small">No entries yet. Save your first entry on the New/Edit tab.</div>`;

      // Wire comments for each card
      $('#j_list').querySelectorAll('.comments-box').forEach((box, idx)=>{
        const idMatch = box.querySelector('[data-addc]')?.getAttribute('data-addc');
        if(idMatch) wireComments(box, idMatch);
      });

    // Wire item actions
    $('#j_list').querySelectorAll('[data-act]').forEach(btn=> btn.addEventListener('click', (e)=>{
      const id = e.currentTarget.dataset.id;
      const act = e.currentTarget.dataset.act;
      const entry = state.entries.find(x=> x.id===id);
      if(!entry) return;
      if(act==='edit'){
        root.querySelector('.j-tabs [data-tab="j_form"]').click();
        resetForm(entry);
        $('#j_entryId').value = entry.id;
      }
      if(act==='dup'){
        const copy = JSON.parse(JSON.stringify(entry));
        copy.id = uid();
        copy.date = todayStr();
        copy.time = timeStr();
        copy.createdAt = new Date().toISOString();
        copy.updatedAt = copy.createdAt;
        state.entries.unshift(copy);
        saveEntries(state.entries);
        renderList();
        toast('Duplicated.');
      }
      if(act==='del'){
        if(confirm('Delete this entry? This cannot be undone.')){
          const idx = state.entries.findIndex(x=> x.id===id);
          if(idx>=0){ const gone = state.entries.splice(idx,1); saveEntries(state.entries); renderList(); deleteFromCloud(id); toast('Deleted.'); }
        }
      }
      if(act==='comments'){
        const boxId = 'cbox_'+id;
        let box = document.getElementById(boxId);
        if(!box){
          box = document.createElement('div'); box.id = boxId; box.className='comments-box open';
          const entry = state.entries.find(x=> x.id===id);
          const html = renderComments(entry);
          box.innerHTML = html;
          e.currentTarget.closest('.item').appendChild(box);
          wireComments(box, id);
        } else { box.classList.toggle('open'); }
        return;
      }
      if(act==='audit'){
        if(!cloudEnabled){ alert('Cloud is off. Enable Supabase to see changes.'); return; }
        (async()=>{
          try{
            const rows = await fetchAudit(id);
            if(!rows || !rows.length){ alert('No changes logged yet.'); return; }
            const lines = rows.map(r=>`• ${r.action} by ${r.changed_by || 'unknown'} @ ${new Date(r.at).toLocaleString()}`);
            alert(lines.join('\n'));
          }catch(e){ alert('Audit load failed: ' + e.message); }
        })();
      }
      if(act==='share'){
        const txt = formatShare(entry);
        if(navigator.share){ navigator.share({ title: 'Plumbing Log', text: txt }).catch(()=>{}); }
        else { navigator.clipboard.writeText(txt).then(()=> toast('Copied to clipboard')); }
      }
    }));
  }

  function escapeHTML(s){
    return String(s||'')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  // Filters and search
  ['j_search','j_filterPass','j_sortBy'].forEach(id=> $('#'+id).addEventListener('input', renderList));

  // ---- Export / Import ----
  function download(filename, text, type='application/json'){
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], {type:type}));
    a.download = filename;
    a.click();
    setTimeout(()=> URL.revokeObjectURL(a.href), 3000);
  }

  function materialsToText(mats){
    return (mats||[]).map(m=> `${m.qty||''} ${m.unit||''} ${m.name||''}`.trim()).join('; ');
  }

  function toCSV(){
    const cols = [
      'id','date','time','job','location','coords.lat','coords.lng','gc','super','waterTested','waterPass','waterPSI','waterMinutes','drainTested','drainPass','drainHead','drainMinutes','testPulled','inspector','permit','nextSteps','completed','attention','materials','photosCount','notes','createdAt','updatedAt'
    ];
    const rows = state.entries.map(e=>{
      const get = k => {
        if(k==='coords.lat') return e.coords? e.coords.lat : '';
        if(k==='coords.lng') return e.coords? e.coords.lng : '';
        if(k==='materials') return materialsToText(e.materials);
        if(k==='photosCount') return (e.photos||[]).length;
        return (e[k]!==undefined && e[k]!==null) ? String(e[k]).replace(/\n/g,'\\n') : '';
      }
      return cols.map(get).map(v=> `"${String(v).replace(/"/g,'""')}"`).join(',');
    });
    return [cols.join(','), ...rows].join('\\n');
  }

  $('#j_btnExportJSON').addEventListener('click', ()=> download(`plumbing_log_${todayStr()}.json`, JSON.stringify(state.entries, null, 2)));
  $('#j_btnExportCSV').addEventListener('click', ()=>{
    const csv = toCSV();
    download(`plumbing_log_${todayStr()}.csv`, csv, 'text/csv');
  });

  $('#j_fileInput').addEventListener('change', async (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    const text = await file.text();
    try{
      const arr = JSON.parse(text);
      if(!Array.isArray(arr)) throw new Error('Invalid file');
      arr.forEach(x=>{ x.id = uid(); x.createdAt = new Date().toISOString(); x.updatedAt = x.createdAt; });
      state.entries = [...arr, ...state.entries];
      saveEntries(state.entries);
      toast(`Imported ${arr.length} entries.`);
    }catch(err){ alert('Import failed: ' + err.message) }
    e.target.value = '';
    renderList();
  });

  // ---- Settings ----
  $('#j_btnSaveSettings').addEventListener('click', ()=>{
    state.settings = { displayName: $('#j_displayName').value.trim(),
      defGC: $('#j_defGC').value.trim(),
      defPSI: $('#j_defPSI').value ? Number($('#j_defPSI').value) : '',
      defCity: $('#j_defCity').value.trim(),
      defSuper: $('#j_defSuper').value.trim(),
      geoProvider: $('#j_geoProvider').value,
      geoApiKey: $('#j_geoApiKey').value.trim(),
      contactEmail: $('#j_contactEmail').value.trim(),
      addrFormat: $('#j_addrFormat').value
    };
    saveSettings(state.settings);
    toast('Settings saved');
  });

  $('#j_btnClearAll').addEventListener('click', ()=>{
    if(confirm('Delete ALL entries? This cannot be undone.')){
      state.entries = []; saveEntries(state.entries); renderList(); toast('All entries cleared.');
    }
  });

  function formatShare(e){
    const lines = [];
    lines.push(`Job: ${e.job}`);
    lines.push(`${e.date} ${e.time}`);
    if(e.location) lines.push(`Location: ${e.location}`);
    if(e.coords) lines.push(`GPS: ${e.coords.lat.toFixed(6)}, ${e.coords.lng.toFixed(6)}`);
    if(e.gc) lines.push(`GC: ${e.gc}`);
    if(e.super) lines.push(`Super: ${e.super}`);
    lines.push(`Water Test: ${e.waterTested} • ${e.waterPass}${e.waterPSI?` @ ${e.waterPSI} PSI`:''}${e.waterMinutes?` • ${e.waterMinutes} min`:''}`);
    lines.push(`Drain Test: ${e.drainTested} • ${e.drainPass}${e.drainHead?` • ${e.drainHead}`:''}${e.drainMinutes?` • ${e.drainMinutes} min`:''}`);
    lines.push(`Test Pulled: ${e.testPulled}${e.inspector?` • ${e.inspector}`:''}${e.permit?` • #${e.permit}`:''}`);
    if(e.completed) lines.push(`Completed: ${e.completed}`);
    if(e.attention) lines.push(`Needs Attention: ${e.attention}`);
    const mats = materialsToText(e.materials); if(mats) lines.push(`Materials: ${mats}`);
    if((e.photos||[]).length) lines.push(`Photos: ${(e.photos||[]).length} attached`);
    if(e.nextSteps) lines.push(`Next: ${e.nextSteps}`);
    if(e.notes) lines.push(`Notes: ${e.notes}`);
    return lines.join(String.fromCharCode(10));
  }

  function toast(msg){
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.position='fixed'; t.style.bottom='16px'; t.style.left='50%';
    t.style.transform='translateX(-50%)'; t.style.background='var(--panel)';
    t.style.border='1px solid #1f2937'; t.style.padding='10px 14px';
    t.style.borderRadius='999px'; t.style.boxShadow='0 10px 30px rgba(0,0,0,.35)';
    t.style.zIndex='50';
    document.body.appendChild(t); setTimeout(()=> t.remove(), 2000);
  }

  // ---- Self-tests ----
  function runSelfTests(){
    try{
      console.group('%cField Log – Self-tests','color:#3b82f6');
      console.assert(typeof uid()==='string' && uid().length>5, 'uid should return string');
      const before = state.entries.length;
      const temp = { id: uid(), date: '2025-01-01', time: '08:00', job: 'TEST', waterTested:'No', waterPass:'N/A', drainTested:'No', drainPass:'N/A' };
      state.entries.unshift(temp); saveEntries(state.entries);
      const idx = state.entries.findIndex(x=> x.id===temp.id);
      console.assert(idx>=0, 'temp entry added');
      state.entries.splice(idx,1); saveEntries(state.entries);
      console.assert(state.entries.length===before, 'temp entry removed');
      const csvHead = toCSV().split('\\n')[0];
      console.assert(csvHead.startsWith('id,date,time,job'), 'CSV header ok');
      console.log('✅ Self-tests passed');
    }catch(e){ console.error('❌ Self-tests failed', e); }
    finally{ console.groupEnd(); }
  }

  // ---- Init ----
  (function init(){
    resetForm({});
    renderList();
    runSelfTests(); syncFromCloud();
  })();
}
