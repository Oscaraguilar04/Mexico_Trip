const STORAGE_KEY = 'colimaTripGuide.v3';
const LEGACY_STORAGE_KEYS = ['colimaTripGuide.v2', 'colimaTripGuide.v1'];
const MY_MEMBER_KEY = 'colimaTripGuide.myMember';
const TRAVELER_COUNT = 7;
const TRAVELER_NAMES = ['Oscar', 'Leah', 'Raul', 'Rosa', 'Lily', 'Mike', 'Yolee'];
const MEMBER_COLORS = ['sun', 'clay', 'river', 'leaf', 'sun', 'clay', 'river'];

let syncActive = false;

function buildMembers(existingMembers){
  return TRAVELER_NAMES.map((name, i) => {
    const existing = existingMembers && existingMembers[i];
    return {
      id: existing?.id || cryptoId(),
      name,
      color: existing?.color || MEMBER_COLORS[i]
    };
  });
}

const defaultData = {
  tripName: 'Colima Family Trip',
  month: 'February',
  travelers: TRAVELER_COUNT,
  members: buildMembers(),
  budget: [
    { id: cryptoId(), label: 'Round-trip flights LAX ⇄ Colima / Manzanillo (deals + points)', amount: 2000 },
    { id: cryptoId(), label: 'Lodging / Airbnb for 7 (shared stay savings)', amount: 900 },
    { id: cryptoId(), label: 'Food, snacks, coffee, family meals (7 people)', amount: 700 },
    { id: cryptoId(), label: 'Transportation in Mexico', amount: 400 },
    { id: cryptoId(), label: 'Activities, beaches, tours, entries', amount: 350 },
    { id: cryptoId(), label: 'Emergency buffer', amount: 150 }
  ],
  contributions: []
};

function cryptoId(){
  return 'id-' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}
function money(num){
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(num)||0);
}
function travelerRoster(separator){
  return TRAVELER_NAMES.join(separator || ' · ');
}
function loadData(){
  try{
    const hashData = new URLSearchParams(location.hash.replace(/^#/, '')).get('trip');
    if(hashData){
      const decoded = JSON.parse(decodeURIComponent(atob(hashData)));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitize(decoded)));
      history.replaceState(null, '', location.pathname);
      return sanitize(decoded);
    }
  } catch(err){ console.warn('Could not import trip data', err); }
  const saved = localStorage.getItem(STORAGE_KEY);
  if(saved){
    try { return sanitize(JSON.parse(saved)); }
    catch(err){ return structuredClone(defaultData); }
  }
  for(const legacyKey of LEGACY_STORAGE_KEYS){
    const legacy = localStorage.getItem(legacyKey);
    if(!legacy) continue;
    try {
      const migrated = sanitize(JSON.parse(legacy));
      migrated.budget = structuredClone(defaultData.budget);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      localStorage.removeItem(legacyKey);
      return migrated;
    } catch(err){ /* try next legacy key */ }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
  return structuredClone(defaultData);
}

function sanitize(data){
  const merged = {...structuredClone(defaultData), ...data};
  merged.travelers = TRAVELER_COUNT;
  merged.members = buildMembers(merged.members);
  if(!Array.isArray(merged.budget)) merged.budget = structuredClone(defaultData.budget);
  if(!Array.isArray(merged.contributions)) merged.contributions = [];
  return merged;
}

function saveData(options = {}){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if(syncActive && !options.skipSync && window.TripSync && !window.TripSync.isApplyingRemote()){
    window.TripSync.pushState(state);
  }
}

function totalCost(){ return state.budget.reduce((sum,item)=>sum+(Number(item.amount)||0),0); }
function totalSaved(){ return state.contributions.reduce((sum,item)=>sum+(Number(item.amount)||0),0); }
function savedForMember(id){ return state.contributions.filter(x=>x.memberId===id).reduce((s,x)=>s+(Number(x.amount)||0),0); }
function initials(name){ return (name || '?').split(/\s+/).map(p=>p[0]).join('').slice(0,2).toUpperCase(); }
function memberNameById(id){
  const member = state.members.find(m => m.id === id);
  if(member) return member.name;
  const index = state.members.findIndex(m => m.id === id);
  return TRAVELER_NAMES[index] || 'Group member';
}

function relativeTime(timestamp){
  const diff = Date.now() - Number(timestamp);
  const mins = Math.floor(diff / 60000);
  if(mins < 1) return 'just now';
  if(mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if(hours < 48) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

function rememberMyMember(memberId){
  if(memberId) localStorage.setItem(MY_MEMBER_KEY, memberId);
}

function restoreMyMember(){
  const savedId = localStorage.getItem(MY_MEMBER_KEY);
  const select = document.querySelector('#memberSelect');
  if(!select || !savedId) return;
  if(state.members.some(m => m.id === savedId)) select.value = savedId;
}

function renderSyncStatus(status, detail){
  const banner = document.querySelector('#syncStatus');
  if(!banner) return;
  banner.classList.remove('sync-status--live', 'sync-status--offline', 'sync-status--error', 'sync-status--connecting');
  banner.classList.add(`sync-status--${status}`);
  const label = banner.querySelector('[data-sync-label]');
  const text = banner.querySelector('[data-sync-detail]');
  const labels = {
    live: 'Live group board',
    offline: 'This device only',
    error: 'Sync issue',
    connecting: 'Connecting…'
  };
  if(label) label.textContent = labels[status] || 'Group board';
  if(text) text.textContent = detail || '';
}

let state = loadData();

function renderTopFund(){
  const saved = totalSaved();
  const cost = totalCost();
  const percent = cost > 0 ? Math.min(100, Math.round((saved / cost) * 100)) : 0;
  const roster = travelerRoster(' · ');
  document.querySelectorAll('[data-trip-name]').forEach(el=>el.textContent = state.tripName);
  document.querySelectorAll('[data-saved]').forEach(el=>el.textContent = money(saved));
  document.querySelectorAll('[data-cost]').forEach(el=>el.textContent = money(cost));
  document.querySelectorAll('[data-left]').forEach(el=>el.textContent = money(Math.max(cost-saved,0)));
  document.querySelectorAll('[data-percent]').forEach(el=>el.textContent = percent + '%');
  document.querySelectorAll('.progress-fill').forEach(el=>el.style.width = percent + '%');
  document.querySelectorAll('[data-traveler-count]').forEach(el=>el.textContent = TRAVELER_COUNT);
  document.querySelectorAll('[data-traveler-roster]').forEach(el=>el.textContent = roster);
  document.querySelectorAll('[data-traveler-roster-comma]').forEach(el=>el.textContent = travelerRoster(', '));
}

function renderDashboard(){
  const memberSelect = document.querySelector('#memberSelect');
  const memberList = document.querySelector('#memberList');
  const budgetBody = document.querySelector('#budgetBody');
  const feed = document.querySelector('#contributionFeed');
  const memberNameEditor = document.querySelector('#memberNameEditor');

  if(memberSelect){
    memberSelect.innerHTML = state.members.map(m=>`<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('');
    restoreMyMember();
  }
  if(memberNameEditor){
    memberNameEditor.innerHTML = state.members.map(m=>`
      <div class="form-row">
        <label>${escapeHtml(m.name)}<input data-rename="${m.id}" value="${escapeAttr(m.name)}" aria-label="${escapeAttr(m.name)} saved amount editor" /></label>
        <label>Saved so far<input readonly value="${money(savedForMember(m.id))}" aria-label="${escapeAttr(m.name)} total saved" /></label>
      </div>`).join('');
    memberNameEditor.querySelectorAll('[data-rename]').forEach(input=>{
      input.addEventListener('change', e=>{
        const member = state.members.find(m=>m.id===e.target.dataset.rename);
        const index = state.members.findIndex(m=>m.id===e.target.dataset.rename);
        if(member){
          member.name = e.target.value.trim() || TRAVELER_NAMES[index] || member.name;
          saveData();
          renderAll();
        }
      });
    });
  }
  if(memberList){
    memberList.innerHTML = state.members.map(m=>`
      <div class="member">
        <div class="avatar">${escapeHtml(initials(m.name))}</div>
        <div><strong>${escapeHtml(m.name)}</strong><small>${state.contributions.filter(x=>x.memberId===m.id).length} deposits logged</small></div>
        <span class="price-chip">${money(savedForMember(m.id))}</span>
      </div>`).join('');
  }
  if(budgetBody){
    budgetBody.innerHTML = state.budget.map(item=>`
      <tr>
        <td>${escapeHtml(item.label)}</td>
        <td>${money(item.amount)}</td>
      </tr>`).join('') + `<tr><th>Total trip cost</th><th>${money(totalCost())}</th></tr>`;
  }
  if(feed){
    const sorted = [...state.contributions].sort((a,b)=>b.createdAt-a.createdAt);
    feed.innerHTML = sorted.length ? sorted.map(item=>{
      const name = memberNameById(item.memberId);
      return `<article class="feed-item reveal"><div class="feed-item-head"><strong>${escapeHtml(name)}</strong><span class="feed-amount">${money(item.amount)}</span></div><p>${escapeHtml(item.note || 'Trip savings')}</p><small>${relativeTime(item.createdAt)} · ${new Date(item.createdAt).toLocaleString()}</small></article>`;
    }).join('') : `<p class="helper">No deposits yet. When someone adds money, everyone on the group board will see it here.</p>`;
  }
  const saved = totalSaved();
  const cost = totalCost();
  const each = cost / TRAVELER_COUNT;
  setText('#statTotal', money(cost));
  setText('#statSaved', money(saved));
  setText('#statLeft', money(Math.max(cost - saved, 0)));
  setText('#statEach', money(each));
}

function setupDashboardForms(){
  const memberSelect = document.querySelector('#memberSelect');
  if(memberSelect){
    memberSelect.addEventListener('change', () => rememberMyMember(memberSelect.value));
  }
  const contributionForm = document.querySelector('#contributionForm');
  if(contributionForm){
    contributionForm.addEventListener('submit', async e=>{
      e.preventDefault();
      const amount = Number(document.querySelector('#amountInput').value);
      const memberId = document.querySelector('#memberSelect').value;
      const note = document.querySelector('#noteInput').value.trim();
      if(!amount || amount <= 0){ alert('Enter a contribution amount greater than $0.'); return; }
      rememberMyMember(memberId);
      const contribution = {id:cryptoId(), memberId, amount, note, createdAt:Date.now()};

      if(syncActive && window.TripSync){
        try {
          await window.TripSync.addContribution(contribution);
          contributionForm.reset();
          restoreMyMember();
          return;
        } catch(err){
          console.warn('Could not sync contribution, saving locally', err);
        }
      }

      state.contributions.push(contribution);
      saveData();
      contributionForm.reset();
      restoreMyMember();
      renderAll();
    });
  }
  const budgetForm = document.querySelector('#budgetForm');
  if(budgetForm){
    budgetForm.addEventListener('submit', e=>{
      e.preventDefault();
      const label = document.querySelector('#budgetLabel').value.trim();
      const amount = Number(document.querySelector('#budgetAmount').value);
      if(!label || !amount || amount <= 0){ alert('Add a cost name and amount.'); return; }
      state.budget.push({id:cryptoId(), label, amount});
      saveData(); budgetForm.reset(); renderAll();
    });
  }
  const clearBudget = document.querySelector('#clearBudget');
  if(clearBudget){
    clearBudget.addEventListener('click', ()=>{
      if(confirm('Clear the current cost list?')){ state.budget = []; saveData(); renderAll(); }
    });
  }
  const resetDemo = document.querySelector('#resetDemo');
  if(resetDemo){
    resetDemo.addEventListener('click', ()=>{
      if(confirm('Reset this website back to the starter trip plan?')){
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(MY_MEMBER_KEY);
        LEGACY_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
        state = loadData();
        renderAll();
        if(syncActive && window.TripSync) window.TripSync.pushState(state);
      }
    });
  }
  const exportBtn = document.querySelector('#exportTrip');
  if(exportBtn){
    exportBtn.addEventListener('click', async ()=>{
      const encoded = btoa(encodeURIComponent(JSON.stringify(state)));
      const link = `${location.href.split('#')[0]}#trip=${encoded}`;
      try{ await navigator.clipboard.writeText(link); alert('Backup link copied. With live sync enabled, you usually do not need this — everyone sees the same board automatically.'); }
      catch(err){ prompt('Copy this backup link:', link); }
    });
  }
  document.querySelectorAll('[data-add-plan]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const name = btn.dataset.addPlan;
      const saved = JSON.parse(localStorage.getItem('colimaTripGuide.savedPlaces') || '[]');
      if(!saved.includes(name)) saved.push(name);
      localStorage.setItem('colimaTripGuide.savedPlaces', JSON.stringify(saved));
      btn.textContent = 'Saved ✓';
      btn.classList.add('secondary');
      renderSavedPlaces();
    });
  });
}

function renderSavedPlaces(){
  const holder = document.querySelector('#savedPlaces');
  if(!holder) return;
  const saved = JSON.parse(localStorage.getItem('colimaTripGuide.savedPlaces') || '[]');
  holder.innerHTML = saved.length ? saved.map(place=>`<span class="tag river">${escapeHtml(place)}</span>`).join('') : '<span class="helper">Tap “save to plan” on any activity card.</span>';
}

function setupFilters(){
  const filters = document.querySelectorAll('[data-filter]');
  const cards = document.querySelectorAll('[data-category]');
  if(!filters.length) return;
  filters.forEach(filter=>{
    filter.addEventListener('click', ()=>{
      filters.forEach(f=>f.classList.remove('active'));
      filter.classList.add('active');
      const value = filter.dataset.filter;
      cards.forEach(card=>{
        const categories = card.dataset.category.split(' ');
        card.classList.toggle('hide', value !== 'all' && !categories.includes(value));
      });
    });
  });
}

async function initGroupSync(){
  if(!window.TripSync) return;
  syncActive = await window.TripSync.init({
    getDefaultState: () => structuredClone(defaultData),
    setState: (data) => {
      state = sanitize(data);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      renderAll();
    },
    onStatusChange: renderSyncStatus
  });
}

function setText(selector, value){ const el = document.querySelector(selector); if(el) el.textContent = value; }
function escapeHtml(str=''){ return String(str).replace(/[&<>"']/g, s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s])); }
function escapeAttr(str=''){ return escapeHtml(str).replace(/`/g,'&#096;'); }
function renderAll(){ renderTopFund(); renderDashboard(); renderSavedPlaces(); }

document.addEventListener('DOMContentLoaded', async ()=>{
  renderAll();
  setupDashboardForms();
  setupFilters();
  await initGroupSync();
});
