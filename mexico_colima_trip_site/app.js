const STORAGE_KEY = 'colimaTripGuide.v1';

const defaultData = {
  tripName: 'Colima Family Trip',
  month: 'February',
  travelers: 7,
  members: [
    { id: cryptoId(), name: 'Oscar', color: 'sun' },
    { id: cryptoId(), name: 'Leah', color: 'clay' },
    { id: cryptoId(), name: 'Traveler 3', color: 'river' },
    { id: cryptoId(), name: 'Traveler 4', color: 'leaf' },
    { id: cryptoId(), name: 'Traveler 5', color: 'sun' },
    { id: cryptoId(), name: 'Traveler 6', color: 'clay' },
    { id: cryptoId(), name: 'Traveler 7', color: 'river' }
  ],
  budget: [
    { id: cryptoId(), label: 'Round-trip flights LAX ⇄ Colima / Manzanillo', amount: 4200 },
    { id: cryptoId(), label: 'Lodging / Airbnb for group', amount: 1750 },
    { id: cryptoId(), label: 'Food, snacks, coffee, family meals', amount: 1400 },
    { id: cryptoId(), label: 'Transportation in Mexico', amount: 700 },
    { id: cryptoId(), label: 'Activities, beaches, tours, entries', amount: 700 },
    { id: cryptoId(), label: 'Emergency buffer', amount: 700 }
  ],
  contributions: []
};

function cryptoId(){
  return 'id-' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}
function money(num){
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(num)||0);
}
function loadData(){
  try{
    const hashData = new URLSearchParams(location.hash.replace(/^#/, '')).get('trip');
    if(hashData){
      const decoded = JSON.parse(decodeURIComponent(atob(hashData)));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(decoded));
      history.replaceState(null, '', location.pathname);
      return sanitize(decoded);
    }
  } catch(err){ console.warn('Could not import trip data', err); }
  const saved = localStorage.getItem(STORAGE_KEY);
  if(!saved){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return structuredClone(defaultData);
  }
  try { return sanitize(JSON.parse(saved)); }
  catch(err){ return structuredClone(defaultData); }
}
function sanitize(data){
  const merged = {...structuredClone(defaultData), ...data};
  if(!Array.isArray(merged.members) || merged.members.length === 0) merged.members = structuredClone(defaultData.members);
  if(!Array.isArray(merged.budget)) merged.budget = structuredClone(defaultData.budget);
  if(!Array.isArray(merged.contributions)) merged.contributions = [];
  return merged;
}
function saveData(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function totalCost(){ return state.budget.reduce((sum,item)=>sum+(Number(item.amount)||0),0); }
function totalSaved(){ return state.contributions.reduce((sum,item)=>sum+(Number(item.amount)||0),0); }
function savedForMember(id){ return state.contributions.filter(x=>x.memberId===id).reduce((s,x)=>s+(Number(x.amount)||0),0); }
function initials(name){ return (name || '?').split(/\s+/).map(p=>p[0]).join('').slice(0,2).toUpperCase(); }

let state = loadData();

function renderTopFund(){
  const saved = totalSaved();
  const cost = totalCost();
  const percent = cost > 0 ? Math.min(100, Math.round((saved / cost) * 100)) : 0;
  document.querySelectorAll('[data-trip-name]').forEach(el=>el.textContent = state.tripName);
  document.querySelectorAll('[data-saved]').forEach(el=>el.textContent = money(saved));
  document.querySelectorAll('[data-cost]').forEach(el=>el.textContent = money(cost));
  document.querySelectorAll('[data-left]').forEach(el=>el.textContent = money(Math.max(cost-saved,0)));
  document.querySelectorAll('[data-percent]').forEach(el=>el.textContent = percent + '%');
  document.querySelectorAll('.progress-fill').forEach(el=>el.style.width = percent + '%');
}

function renderDashboard(){
  const memberSelect = document.querySelector('#memberSelect');
  const memberList = document.querySelector('#memberList');
  const budgetBody = document.querySelector('#budgetBody');
  const feed = document.querySelector('#contributionFeed');
  const memberNameEditor = document.querySelector('#memberNameEditor');

  if(memberSelect){
    memberSelect.innerHTML = state.members.map(m=>`<option value="${m.id}">${escapeHtml(m.name)}</option>`).join('');
  }
  if(memberNameEditor){
    memberNameEditor.innerHTML = state.members.map(m=>`
      <div class="form-row">
        <label>Traveler name<input data-rename="${m.id}" value="${escapeAttr(m.name)}" /></label>
        <label>Saved so far<input readonly value="${money(savedForMember(m.id))}" /></label>
      </div>`).join('');
    memberNameEditor.querySelectorAll('[data-rename]').forEach(input=>{
      input.addEventListener('change', e=>{
        const member = state.members.find(m=>m.id===e.target.dataset.rename);
        if(member){ member.name = e.target.value.trim() || member.name; saveData(); renderAll(); }
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
      const member = state.members.find(m=>m.id===item.memberId);
      return `<div class="feed-item"><strong>${escapeHtml(member?.name || 'Traveler')} added ${money(item.amount)}</strong><small>${escapeHtml(item.note || 'Trip savings')} · ${new Date(item.createdAt).toLocaleString()}</small></div>`
    }).join('') : '<p class="helper">No deposits logged yet. Add the first contribution to start the group fund.</p>';
  }
  const saved = totalSaved();
  const cost = totalCost();
  const each = state.members.length ? cost / state.members.length : cost;
  setText('#statTotal', money(cost));
  setText('#statSaved', money(saved));
  setText('#statLeft', money(Math.max(cost - saved, 0)));
  setText('#statEach', money(each));
}

function setupDashboardForms(){
  const contributionForm = document.querySelector('#contributionForm');
  if(contributionForm){
    contributionForm.addEventListener('submit', e=>{
      e.preventDefault();
      const amount = Number(document.querySelector('#amountInput').value);
      const memberId = document.querySelector('#memberSelect').value;
      const note = document.querySelector('#noteInput').value.trim();
      if(!amount || amount <= 0){ alert('Enter a contribution amount greater than $0.'); return; }
      state.contributions.push({id:cryptoId(), memberId, amount, note, createdAt:Date.now()});
      saveData();
      contributionForm.reset();
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
      if(confirm('Reset this website back to the starter trip plan?')){ localStorage.removeItem(STORAGE_KEY); state = loadData(); renderAll(); }
    });
  }
  const exportBtn = document.querySelector('#exportTrip');
  if(exportBtn){
    exportBtn.addEventListener('click', async ()=>{
      const encoded = btoa(encodeURIComponent(JSON.stringify(state)));
      const link = `${location.href.split('#')[0]}#trip=${encoded}`;
      try{ await navigator.clipboard.writeText(link); alert('Trip snapshot link copied. Send it to the group so they can open the same saved numbers.'); }
      catch(err){ prompt('Copy this trip snapshot link:', link); }
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

function setText(selector, value){ const el = document.querySelector(selector); if(el) el.textContent = value; }
function escapeHtml(str=''){ return String(str).replace(/[&<>"']/g, s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s])); }
function escapeAttr(str=''){ return escapeHtml(str).replace(/`/g,'&#096;'); }
function renderAll(){ renderTopFund(); renderDashboard(); renderSavedPlaces(); }

document.addEventListener('DOMContentLoaded', ()=>{
  renderAll();
  setupDashboardForms();
  setupFilters();
});
