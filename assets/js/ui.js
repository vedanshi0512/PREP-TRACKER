// ============================================================
// ui.js — Shared UI Utilities
// Toast notifications, modal, formatting helpers
// ============================================================

const UI = (() => {

  // ── Toast Notifications ──────────────────────────────────
  const toast = (msg, type = 'info', duration = 3000) => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span>${msg}</span><button onclick="this.parentElement.remove()">×</button>`;
    container.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, duration);
  };

  // ── Modal ────────────────────────────────────────────────
  const openModal = (html, onClose) => {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    if (!overlay || !content) return;
    content.innerHTML = html;
    overlay.classList.remove('hidden');
    overlay.onclick = (e) => { if (e.target === overlay) { closeModal(); onClose && onClose(); } };
  };

  const closeModal = () => {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.add('hidden');
  };

  // ── Progress Bar HTML ────────────────────────────────────
  const progressBar = (pct, color = 'var(--accent)') => `
    <div class="progress-bar-wrap">
      <div class="progress-bar-fill" style="width:${pct}%;background:${color}"></div>
    </div>
    <span class="progress-label">${pct}%</span>
  `;

  // ── Status Badge ─────────────────────────────────────────
  const statusBadge = (status) => {
    const map = {
      [STATUS.NOT_STARTED]: 'badge-gray',
      [STATUS.IN_PROGRESS]: 'badge-blue',
      [STATUS.COMPLETED]:   'badge-green',
    };
    return `<span class="badge ${map[status] || 'badge-gray'}">${status}</span>`;
  };

  // ── Strength Badge ───────────────────────────────────────
  const strengthBadge = (strength) => {
    const map = { weak: 'badge-red', normal: 'badge-yellow', strong: 'badge-green' };
    const icons = { weak: '⚡', normal: '〰️', strong: '💪' };
    return `<span class="badge ${map[strength] || 'badge-yellow'}">${icons[strength] || ''} ${strength}</span>`;
  };

  // ── Task Type Color ──────────────────────────────────────
  const taskTypeColor = (type) => {
    const map = {
      lecture: '#3B82F6', test: '#10B981', revision: '#8B5CF6',
      mock: '#EF4444', analysis: '#F59E0B', practice: '#06B6D4',
    };
    return map[type] || '#6B7280';
  };

  const taskTypeIcon = (type) => {
    const map = {
      lecture: '🎬', test: '✅', revision: '🔁',
      mock: '📝', analysis: '🔍', practice: '📌',
    };
    return map[type] || '•';
  };

  // ── Date Formatting ──────────────────────────────────────
  const formatDate = (dateStr, opts = {}) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', ...opts });
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    return `${days[d.getDay()]}, ${d.getDate()} ${d.toLocaleString('en-IN',{month:'short'})}`;
  };

  const daysUntil = (dateStr) => {
    const diff = new Date(dateStr) - new Date(Store.todayStr());
    return Math.ceil(diff / 86400000);
  };

  // ── Subject color helper ─────────────────────────────────
  const subjectColor = (subject) => SUBJECT_META[subject]?.color || '#6B7280';
  const subjectIcon  = (subject) => SUBJECT_META[subject]?.icon  || '📚';

  // ── Render subject pill ──────────────────────────────────
  const subjectPill = (subject) => {
    const m = SUBJECT_META[subject] || {};
    return `<span class="subject-pill" style="background:${m.bg||'rgba(107,114,128,0.2)'};color:${m.color||'#6B7280'}">${m.icon||''} ${subject}</span>`;
  };

  // ── Confirm dialog (inline modal) ───────────────────────
  const confirm = (msg, onYes) => {
    openModal(`
      <div class="confirm-dialog">
        <p>${msg}</p>
        <div class="confirm-actions">
          <button class="btn btn-danger" id="confirm-yes">Yes</button>
          <button class="btn btn-ghost" id="confirm-no">Cancel</button>
        </div>
      </div>
    `);
    document.getElementById('confirm-yes').onclick = () => { closeModal(); onYes(); };
    document.getElementById('confirm-no').onclick  = closeModal;
  };

  // ── Countdown to CAT ─────────────────────────────────────
  const catCountdown = () => {
    const settings = Store.getSettings();
    const d = daysUntil(settings.catDate || CAT_DATE);
    if (d <= 0) return `<span class="cat-countdown red">CAT Day!</span>`;
    return `<span class="cat-countdown">${d} days to CAT 2026</span>`;
  };

  // ── Streak display ───────────────────────────────────────
  const streakBadge = () => {
    const s = Store.getStreak();
    return `<span class="streak-badge" title="Best: ${s.best}">🔥 ${s.current}-day streak</span>`;
  };

  // ── Empty state ──────────────────────────────────────────
  const emptyState = (icon, title, subtitle = '') => `
    <div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <div class="empty-title">${title}</div>
      ${subtitle ? `<div class="empty-sub">${subtitle}</div>` : ''}
    </div>
  `;

  return {
    toast, openModal, closeModal,
    progressBar, statusBadge, strengthBadge,
    taskTypeColor, taskTypeIcon,
    formatDate, formatDateShort, daysUntil,
    subjectColor, subjectIcon, subjectPill,
    confirm, catCountdown, streakBadge, emptyState,
  };
})();
