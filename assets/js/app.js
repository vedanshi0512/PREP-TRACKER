// ============================================================
// app.js — Main Application Controller
// Handles routing, navigation, initialization
// ============================================================

const App = (() => {
  let currentPage = 'dashboard';
  let currentArg  = null;

  // ── Page registry ─────────────────────────────────────────
  const pages = {
    'dashboard':      DashboardPage,
    'subjects':       SubjectsPage,
    'daily-planner':  DailyPlannerPage,
    'weekly-planner': WeeklyPlannerPage,
    'backlog':        BacklogPage,
    'mocks':          MocksPage,
    'roadmap':        RoadmapPage,
  };

  // ── Initialize app ────────────────────────────────────────
  const init = () => {
    Store.init();
    setupNav();
    setupTheme();
    setupExportImport();
    setupModalClose();
    navigate('dashboard');
    updateBadges();
    // Auto-detect backlog every load
    Planner.detectAndMoveToBacklog();
    console.log('[App] CAT 2026 Prep Tracker initialized');
  };

  // ── Navigation ────────────────────────────────────────────
  const navigate = (page, arg = null) => {
    currentPage = page;
    currentArg  = arg;
    renderPage(page, arg);
    updateActiveNav(page);
    updateBadges();
    window.scrollTo(0, 0);
  };

  const renderPage = (page, arg = null) => {
    const container = document.getElementById('page-content');
    if (!container) return;
    const pageObj = pages[page];
    if (!pageObj) { container.innerHTML = `<p>Page not found: ${page}</p>`; return; }
    try {
      container.innerHTML = pageObj.render(arg || currentArg);
      // Re-attach any nav-link clicks within rendered content
      container.querySelectorAll('[data-page]').forEach(el => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          const p = el.dataset.page;
          if (p) navigate(p);
        });
      });
    } catch (err) {
      console.error(`[App] Error rendering page "${page}":`, err);
      container.innerHTML = `<div class="error-state">❌ Error loading page. Check console.</div>`;
    }
  };

  // ── Sidebar nav setup ─────────────────────────────────────
  const setupNav = () => {
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(el.dataset.page);
      });
    });
  };

  const updateActiveNav = (page) => {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });
  };

  // ── Badges ────────────────────────────────────────────────
  const updateBadges = () => {
    const backlogCount = Store.getBacklog().length;
    const badge = document.getElementById('backlog-badge');
    if (badge) {
      badge.textContent = backlogCount;
      badge.classList.toggle('hidden', backlogCount === 0);
    }

    // Update mobile sidebar toggle text if needed
    const streak = Store.getStreak();
    const streakEl = document.getElementById('streak-count');
    if (streakEl) streakEl.textContent = streak.current;
  };

  // ── Theme ─────────────────────────────────────────────────
  const setupTheme = () => {
    const settings = Store.getSettings();
    const theme = settings.theme || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeBtn(theme);

    document.getElementById('dark-mode-toggle')?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      Store.updateSettings({ theme: next });
      updateThemeBtn(next);
    });
  };

  const updateThemeBtn = (theme) => {
    const btn = document.getElementById('dark-mode-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
  };

  // ── Export / Import ───────────────────────────────────────
  const setupExportImport = () => {
    document.getElementById('export-btn')?.addEventListener('click', () => {
      const data = Store.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `cat26-backup-${Store.todayStr()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      UI.toast('Data exported!', 'success');
    });

    const importInput = document.getElementById('import-file');
    document.getElementById('import-btn')?.addEventListener('click', () => importInput?.click());
    importInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const ok = Store.importData(evt.target.result);
        if (ok) {
          UI.toast('Data imported successfully!', 'success');
          navigate('dashboard');
        } else {
          UI.toast('Import failed — invalid file', 'error');
        }
      };
      reader.readAsText(file);
      importInput.value = '';
    });
  };

  // ── Modal close on overlay click ──────────────────────────
  const setupModalClose = () => {
    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') UI.closeModal();
    });
  };

  // ── Mobile sidebar toggle ─────────────────────────────────
  const toggleSidebar = () => {
    document.getElementById('sidebar')?.classList.toggle('sidebar-open');
  };

  return { init, navigate, renderPage, updateBadges, toggleSidebar };
})();

// ── Boot ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', App.init);
