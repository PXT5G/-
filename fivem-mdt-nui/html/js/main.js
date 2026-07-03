/**
 * ═══════════════════════════════════════════════════════════════
 * main.js — Advanced MDT NUI
 * ═══════════════════════════════════════════════════════════════
 *
 * الربط مع FiveM Client (client/main.lua):
 *
 *   ┌─────────────┐    SendNUIMessage     ┌──────────────┐
 *   │ client.lua  │ ───────────────────►  │  main.js     │
 *   │             │ ◄───────────────────  │  (هذا الملف) │
 *   └─────────────┘  RegisterNUICallback └──────────────┘
 *
 * فتح الواجهة من Lua:
 *   SendNUIMessage({ action = 'open', data = { officer = {...}, job = 'police' } })
 *
 * إغلاق من JS:
 *   postNui('close', {})
 *
 * استمع للأحداث:
 *   window.addEventListener('message', onNuiMessage)
 */

import { MOCK, NAV, STATUS_LABELS } from './data.js';

// ─── حالة التطبيق (State) ─────────────────────────────────────
const state = {
  visible: false,
  view: 'dashboard',
  officer: null,
  job: 'police',
  onDuty: true,
  incidents: [...MOCK.incidents],
  units: [...MOCK.units],
  selectedIncident: MOCK.incidents[0],
  searchMode: 'name',
  searchQuery: '',
  searchResults: [],
  selectedCitizen: null,
  dossierTab: 'overview',
};

// ─── NUI Bridge ───────────────────────────────────────────────

/** اسم المورد — FiveM يحقنه تلقائياً في CEF */
function getResourceName() {
  return window.GetParentResourceName?.() ?? 'mdt-nui';
}

/**
 * إرسال حدث إلى client.lua
 * @param {string} event - اسم الـ callback المسجّل في RegisterNUICallback
 * @param {object} data  - البيانات المرسلة
 * @returns {Promise<object>}
 *
 * مثال Lua:
 *   RegisterNUICallback('searchCitizen', function(data, cb) cb({ ok=true }) end)
 */
async function postNui(event, data = {}) {
  try {
    const res = await fetch(`https://${getResourceName()}/${event}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err) {
    console.warn(`[MDT NUI] postNui(${event}) failed — dev mode?`, err);
    return { ok: false };
  }
}

/**
 * استقبال رسائل من SendNUIMessage في client.lua
 *
 * الأحداث المدعومة:
 *   open            — فتح الواجهة + بيانات الضابط
 *   close           — إغلاق
 *   updateIncidents — تحديث البلاغات
 *   updateUnits     — تحديث الوحدات
 *   notify          — إشعار toast
 *   searchResults   — نتائج بحث من السيرفر
 */
function onNuiMessage({ data }) {
  if (!data?.action) return;

  switch (data.action) {
    case 'open':
      openMdt(data.data);
      break;
    case 'close':
      closeMdt(false);
      break;
    case 'updateIncidents':
      state.incidents = data.data ?? [];
      state.selectedIncident = state.incidents[0] ?? null;
      if (state.view === 'dispatch') renderDispatch();
      break;
    case 'updateUnits':
      state.units = data.data ?? [];
      if (state.view === 'dispatch') renderDispatch();
      break;
    case 'notify':
      showToast(data.data?.title, data.data?.message, data.data?.variant);
      break;
    case 'searchResults':
      state.searchResults = data.data ?? [];
      renderSearch();
      break;
    default:
      console.log('[MDT NUI] Unknown action:', data.action);
  }
}

// ─── فتح / إغلاق ──────────────────────────────────────────────

function openMdt(payload = {}) {
  state.visible = true;
  state.officer = payload.officer ?? { name: 'Officer', rank: '—', callsign: '—' };
  state.job = payload.job ?? 'police';
  state.onDuty = payload.officer?.onDuty !== false;

  const root = document.getElementById('mdt-root');
  root.classList.remove('mdt-hidden');
  root.setAttribute('aria-hidden', 'false');
  root.setAttribute('data-job', state.job);

  updateProfile();
  buildNav();
  navigate('dashboard');
  animateEntrance(root.querySelector('.mdt-shell'));
}

function closeMdt(notifyClient = true) {
  state.visible = false;
  const root = document.getElementById('mdt-root');
  root.classList.add('mdt-hidden');
  root.setAttribute('aria-hidden', 'true');
  if (notifyClient) postNui('close', {});
}

// ─── Motion / Animations (بديل Framer Motion لـ FiveM CEF) ───

/** تأثير دخول باستخدام Web Animations API — مشابه لـ Framer Motion spring */
function animateEntrance(el) {
  if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  el.animate(
    [
      { opacity: 0, transform: 'scale(0.94) translateY(12px)' },
      { opacity: 1, transform: 'scale(1) translateY(0)' },
    ],
    { duration: 450, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)', fill: 'both' },
  );
}

/** تأثير stagger على العناصر الفرعية */
function staggerChildren(container, selector = ':scope > *') {
  if (!container) return;
  const items = container.querySelectorAll(selector);
  items.forEach((item, i) => {
    item.style.opacity = '0';
    item.animate(
      [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 380, delay: i * 50, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' },
    );
  });
}

// ─── Toast ────────────────────────────────────────────────────

function showToast(title, message = '', variant = 'info') {
  const stack = document.getElementById('toast-stack');
  const toast = document.createElement('div');
  toast.className = `toast ${variant}`;
  toast.innerHTML = `<p class="toast-title">${esc(title)}</p>${message ? `<p class="toast-msg">${esc(message)}</p>` : ''}`;
  stack.appendChild(toast);
  setTimeout(() => {
    toast.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateX(-12px)' }], { duration: 280, fill: 'forwards' })
      .onfinish = () => toast.remove();
  }, 3800);
}

// ─── Navigation ───────────────────────────────────────────────

function buildNav() {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = NAV.map((item) => `
    <button type="button" class="nav-item${state.view === item.id ? ' active' : ''}" data-view="${item.id}">
      <span class="nav-icon">${item.icon}</span>
      <span>${item.label}</span>
    </button>
  `).join('');

  nav.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => navigate(btn.dataset.view));
  });
}

function navigate(view) {
  state.view = view;
  document.querySelectorAll('.view-panel').forEach((el) => el.classList.add('hidden'));
  document.getElementById(`view-${view}`)?.classList.remove('hidden');
  buildNav();

  const renders = {
    dashboard: renderDashboard,
    dispatch: renderDispatch,
    search: renderSearch,
    warrants: renderWarrants,
    reports: renderReports,
    citizen: renderCitizenDossier,
  };
  renders[view]?.();
}

function updateProfile() {
  const o = state.officer;
  document.getElementById('profile-name').textContent = o?.name ?? '—';
  document.getElementById('profile-rank').textContent = `${o?.rank ?? ''} · ${o?.department ?? ''}`;
  document.getElementById('profile-avatar').textContent = initials(o?.name ?? '?');
  document.getElementById('duty-badge').textContent = state.onDuty ? 'في الخدمة' : 'خارج الخدمة';
  document.getElementById('duty-badge').className = `badge ${state.onDuty ? 'badge-green' : 'badge-red'}`;

  const jobLabels = { police: 'الشرطة', ems: 'الإسعاف', doj: 'القضاء', fire: 'الإطفاء' };
  document.getElementById('job-label').textContent = jobLabels[state.job] ?? 'MDT';
}

// ─── Views ────────────────────────────────────────────────────

function renderDashboard() {
  const el = document.getElementById('view-dashboard');
  el.innerHTML = `
    <h1 class="page-title">لوحة التحكم</h1>
    <div class="grid-dashboard stagger">
      <div class="glass-card card">
        <p class="card-title">لوحة الإعلانات</p>
        ${MOCK.bulletins.map((b) => `
          <div class="bulletin-item">
            <p class="item-title">${esc(b.title)}</p>
            <p class="item-body">${esc(b.body)}</p>
            <p class="item-meta">${esc(b.author)} · ${esc(b.time)}</p>
          </div>
        `).join('')}
      </div>
      <div class="glass-card card">
        <p class="card-title">مذكرات التوقيف النشطة</p>
        ${MOCK.warrants.map((w) => `
          <div class="list-item">
            <p class="item-title">${esc(w.name)}</p>
            <p class="item-meta">${esc(w.date)}</p>
          </div>
        `).join('')}
      </div>
      <div class="glass-card card">
        <p class="card-title">الوحدات</p>
        ${state.units.map((u) => `
          <div class="list-item">
            <p class="item-title">${esc(u.callsign)} — ${esc(u.name)}</p>
            <span class="badge badge-green">${STATUS_LABELS[u.status] ?? u.status}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  staggerChildren(el.querySelector('.stagger'));
}

function renderDispatch() {
  const inc = state.selectedIncident ?? state.incidents[0];
  const el = document.getElementById('view-dispatch');
  el.innerHTML = `
    <h1 class="page-title">مركز الإرسال</h1>
    <div class="dispatch-grid">
      <div class="glass-card card">
        <p class="card-title">الوحدات</p>
        ${state.units.map((u) => `
          <div class="list-item">
            <p class="item-title font-mono">${esc(u.callsign)}</p>
            <p class="item-body">${esc(u.name)}</p>
            <span class="badge badge-green">${STATUS_LABELS[u.status] ?? u.status}</span>
          </div>
        `).join('')}
      </div>
      <div class="glass-card card" style="padding:12px">
        <p class="card-title">خريطة لوس سانتوس</p>
        <div class="map-container" id="dispatch-map">
          <div class="map-grid"></div>
          ${state.incidents.map((i) => `
            <button type="button" class="map-pin${i.id === inc?.id ? ' selected' : ''}"
              style="left:${i.mapX}%;top:${i.mapY}%"
              data-id="${i.id}" aria-label="${esc(i.location)}"></button>
          `).join('')}
          <div class="map-overlay">
            <p class="font-mono text-sm accent-text">${esc(inc?.callNumber ?? '—')}</p>
            <p class="text-sm font-semibold mt-1">${esc(inc?.location ?? '')}</p>
            <p class="text-xs text-muted mt-1" style="color:var(--muted)">${esc(inc?.description ?? '')}</p>
          </div>
        </div>
      </div>
      <div class="glass-card card">
        <p class="card-title">الحوادث الأخيرة</p>
        ${state.incidents.map((i) => `
          <button type="button" class="incident-btn${i.id === inc?.id ? ' selected' : ''}" data-id="${i.id}">
            <span class="font-mono text-xs accent-text">${esc(i.callNumber)}</span>
            <span class="badge ${i.priority === 'high' ? 'badge-red' : 'badge-amber'}" style="margin-inline-start:8px">${STATUS_LABELS[i.priority]}</span>
            <p class="item-title mt-1">${esc(i.location)}</p>
            <p class="item-body">${esc(i.description)}</p>
          </button>
        `).join('')}
      </div>
    </div>
  `;

  el.querySelectorAll('.incident-btn, .map-pin').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.selectedIncident = state.incidents.find((i) => i.id === btn.dataset.id);
      renderDispatch();
    });
  });
  staggerChildren(el.querySelector('.dispatch-grid'));
}

function renderSearch() {
  const results = state.searchResults.length ? state.searchResults : MOCK.citizens;
  const el = document.getElementById('view-search');
  el.innerHTML = `
    <h1 class="page-title">بحث مواطن — DOJ</h1>
    <div class="glass-card card">
      <div class="search-modes">
        ${['name', 'id', 'phone', 'plate'].map((m) => `
          <button type="button" class="mode-btn${state.searchMode === m ? ' active' : ''}" data-mode="${m}">
            ${{ name: 'بالاسم', id: 'بالهوية', phone: 'بالجوال', plate: 'باللوحة' }[m]}
          </button>
        `).join('')}
      </div>
      <input type="search" class="search-input-lg" id="citizen-query" placeholder="الاسم، الهوية، الجوال، اللوحة…" value="${esc(state.searchQuery)}" />
      <button type="button" class="mode-btn active" id="btn-search" style="margin-bottom:14px">بحث</button>
      <div class="citizen-grid stagger" id="citizen-results">
        ${results.map((c) => citizenCardHtml(c)).join('')}
      </div>
    </div>
  `;

  el.querySelectorAll('.mode-btn[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => { state.searchMode = btn.dataset.mode; renderSearch(); });
  });

  document.getElementById('btn-search')?.addEventListener('click', async () => {
    state.searchQuery = document.getElementById('citizen-query')?.value ?? '';
    const res = await postNui('searchCitizen', { query: state.searchQuery, mode: state.searchMode });
    if (res.results) {
      state.searchResults = res.results;
      showToast('نتائج البحث', `${res.results.length} ملف`, 'success');
    }
    renderSearch();
  });

  el.querySelectorAll('.citizen-card').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      state.selectedCitizen = MOCK.citizens.find((c) => c.id === id) ?? resToCitizen(state.searchResults.find((c) => c.id === id));
      state.dossierTab = 'overview';
      navigate('citizen');
    });
  });
}

function citizenCardHtml(c) {
  return `
    <div class="glass-card citizen-card" data-id="${c.id}">
      <div class="avatar">${initials(c.fullName)}</div>
      <p class="item-title">${esc(c.fullName)}</p>
      <p class="item-meta font-mono">${esc(c.nationalId)}</p>
      <p class="item-meta">${esc(c.phone)}</p>
      ${c.warrants > 0 ? `<span class="badge badge-red">${c.warrants} مذكرة</span>` : ''}
    </div>
  `;
}

function resToCitizen(r) {
  if (!r) return null;
  return { ...r, vehicles: r.vehicles ?? [], properties: r.properties ?? [], records: r.records ?? [], bankBalance: r.bankBalance ?? 0 };
}

function renderCitizenDossier() {
  const c = state.selectedCitizen;
  if (!c) { navigate('search'); return; }
  const el = document.getElementById('view-citizen');
  const tabs = [
    { id: 'overview', label: 'نظرة عامة' },
    { id: 'vehicles', label: 'المركبات' },
    { id: 'properties', label: 'العقارات' },
    { id: 'records', label: 'السجل' },
  ];

  el.innerHTML = `
    <button type="button" class="mode-btn" id="back-search" style="margin-bottom:12px">← العودة للبحث</button>
    <h1 class="page-title">${esc(c.fullName)}</h1>
    <div class="stat-grid stagger">
      <div class="stat-box glass-card"><p class="stat-label">الرصيد</p><p class="stat-value accent-text">$${(c.bankBalance ?? 0).toLocaleString()}</p></div>
      <div class="stat-box glass-card"><p class="stat-label">الهوية</p><p class="stat-value" style="font-size:13px">${esc(c.nationalId)}</p></div>
      <div class="stat-box glass-card"><p class="stat-label">الجوال</p><p class="stat-value" style="font-size:13px">${esc(c.phone)}</p></div>
      <div class="stat-box glass-card"><p class="stat-label">مذكرات</p><p class="stat-value" style="color:var(--neon-red)">${c.warrants ?? 0}</p></div>
    </div>
    <div class="dossier-tabs">
      ${tabs.map((t) => `<button type="button" class="tab-btn${state.dossierTab === t.id ? ' active' : ''}" data-tab="${t.id}">${t.label}</button>`).join('')}
    </div>
    <div class="glass-card card" id="dossier-content"></div>
  `;

  document.getElementById('back-search')?.addEventListener('click', () => navigate('search'));
  el.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => { state.dossierTab = btn.dataset.tab; renderCitizenDossier(); });
  });

  const content = document.getElementById('dossier-content');
  const tab = state.dossierTab;
  if (tab === 'overview') {
    content.innerHTML = `<p class="item-body">${(c.flags ?? []).map((f) => `<span class="badge badge-red" style="margin-inline-end:6px">${esc(f)}</span>`).join('')}</p>`;
  } else if (tab === 'vehicles') {
    content.innerHTML = (c.vehicles ?? []).map((v) => `<div class="list-item"><p class="item-title font-mono">${esc(v.plate)}</p><p class="item-body">${esc(v.model)} — ${esc(v.status)}</p></div>`).join('') || '<p class="item-body">لا توجد مركبات</p>';
  } else if (tab === 'properties') {
    content.innerHTML = (c.properties ?? []).map((p) => `<div class="list-item"><p class="item-title">${esc(p.label)}</p><p class="item-meta">$${p.value?.toLocaleString()}</p></div>`).join('') || '<p class="item-body">لا توجد عقارات</p>';
  } else {
    content.innerHTML = (c.records ?? []).map((r) => `<div class="list-item"><p class="item-title">${esc(r.type)}</p><p class="item-body">${esc(r.description)}</p><p class="item-meta">${esc(r.date)}</p></div>`).join('') || '<p class="item-body">سجل نظيف</p>';
  }
}

function renderWarrants() {
  const el = document.getElementById('view-warrants');
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px">
      <h1 class="page-title" style="margin:0">مذكرات التوقيف</h1>
      <button type="button" class="mode-btn active" id="export-warrants">تصدير Discord</button>
    </div>
    <div class="glass-card card stagger">
      ${MOCK.warrants.map((w) => `
        <div class="list-item" style="display:flex;justify-content:space-between;align-items:center">
          <div><p class="item-title">${esc(w.name)}</p><p class="item-meta">${esc(w.date)}</p></div>
          <span class="badge badge-red">نشط</span>
        </div>
      `).join('')}
    </div>
  `;
  document.getElementById('export-warrants')?.addEventListener('click', async () => {
    const res = await postNui('exportDiscord', { type: 'warrants', payload: MOCK.warrants });
    showToast(res.sent ? 'تم التصدير' : 'فشل التصدير', '', res.sent ? 'success' : 'error');
  });
}

function renderReports() {
  const el = document.getElementById('view-reports');
  el.innerHTML = `
    <h1 class="page-title">التقارير</h1>
    <div class="glass-card card stagger">
      <div class="list-item"><p class="item-title">إيقاف مروري — Legion Square</p><p class="item-meta">r-101 · 2026-07-02</p></div>
      <div class="list-item"><p class="item-title">اعتداء — Mirror Park</p><p class="item-meta">r-102 · 2026-07-02</p></div>
      <div class="list-item"><p class="item-title">سطو — Vespucci</p><p class="item-meta">r-103 · 2026-07-01</p></div>
    </div>
    <button type="button" class="mode-btn active" id="btn-fine" style="margin-top:14px">معالجة غرامة</button>
  `;
  document.getElementById('btn-fine')?.addEventListener('click', async () => {
    const res = await postNui('processFine', { total: 5500, charges: ['سرعة زائدة', 'عدم التوقف'] });
    showToast(res.ok ? 'تم تنفيذ الغرامة' : 'خطأ', '$5,500', res.ok ? 'success' : 'error');
  });
}

// ─── Command Palette ──────────────────────────────────────────

function openPalette() {
  const palette = document.getElementById('command-palette');
  palette.classList.remove('mdt-hidden');
  const input = document.getElementById('palette-input');
  input.value = '';
  input.focus();
  renderPaletteResults('');
}

function closePalette() {
  document.getElementById('command-palette').classList.add('mdt-hidden');
}

function renderPaletteResults(q) {
  const ql = q.toLowerCase();
  const items = [
    ...NAV.map((n) => ({ label: n.label, action: () => { closePalette(); navigate(n.id); } })),
    ...MOCK.citizens.map((c) => ({ label: c.fullName, sub: c.nationalId, action: () => { closePalette(); state.selectedCitizen = c; navigate('citizen'); } })),
  ].filter((i) => !ql || i.label.toLowerCase().includes(ql) || i.sub?.toLowerCase().includes(ql));

  document.getElementById('palette-results').innerHTML = items.slice(0, 10).map((item, idx) => `
    <button type="button" class="palette-item" data-idx="${idx}">
      ${esc(item.label)}${item.sub ? `<span style="color:var(--muted);font-size:11px;display:block">${esc(item.sub)}</span>` : ''}
    </button>
  `).join('');

  document.querySelectorAll('.palette-item').forEach((btn, idx) => {
    btn.addEventListener('click', () => items[idx]?.action());
  });
}

// ─── Utilities ────────────────────────────────────────────────

function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function initials(name) {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

// ─── Event Listeners ──────────────────────────────────────────

function bindEvents() {
  window.addEventListener('message', onNuiMessage);

  document.getElementById('btn-close')?.addEventListener('click', () => closeMdt(true));

  document.addEventListener('keydown', (e) => {
    if (!state.visible) return;
    if (e.key === 'Escape') {
      if (!document.getElementById('command-palette').classList.contains('mdt-hidden')) {
        closePalette();
      } else {
        closeMdt(true);
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openPalette();
    }
  });

  document.getElementById('global-search')?.addEventListener('focus', openPalette);
  document.getElementById('palette-input')?.addEventListener('input', (e) => renderPaletteResults(e.target.value));
  document.querySelector('.palette-backdrop')?.addEventListener('click', closePalette);

  document.getElementById('btn-toggle-duty')?.addEventListener('click', async () => {
    state.onDuty = !state.onDuty;
    updateProfile();
    await postNui('toggleDuty', { onDuty: state.onDuty });
    showToast(state.onDuty ? 'دخلت الخدمة' : 'خرجت من الخدمة', '', 'success');
  });

  document.getElementById('btn-notifications')?.addEventListener('click', () => {
    showToast('مذكرة توقيف جديدة', 'Marcus Webb — Grove St', 'info');
  });
}

// ─── Dev mode (فتح في المتصفح بدون FiveM) ───────────────────
function devBootstrap() {
  if (window.invokeNative) return; // داخل FiveM
  console.info('[MDT NUI] Dev mode — auto-opening UI');
  setTimeout(() => openMdt({
    officer: { name: 'James Carter', rank: 'Sergeant', department: 'LSPD', callsign: '1-L-12', onDuty: true },
    job: 'police',
  }), 300);
}

// ─── Init ─────────────────────────────────────────────────────
bindEvents();
devBootstrap();

export { postNui, openMdt, closeMdt, state };
