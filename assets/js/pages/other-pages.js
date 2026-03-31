// ============================================================
// pages/weekly-planner.js — Weekly Planner Page
// ============================================================

const WeeklyPlannerPage = (() => {
  let weekStart = null;

  const getMonday = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const day = d.getDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split('T')[0];
  };

  const render = () => {
    const today = Store.todayStr();
    weekStart = weekStart || getMonday(today);
    const plan = Planner.generateWeeklyPlan(weekStart);
    const weekEnd = Store.addDays(weekStart, 6);

    const prevWeek = Store.addDays(weekStart, -7);
    const nextWeek = Store.addDays(weekStart,  7);
    const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

    const dayCards = Object.entries(plan).map(([date, tasks], idx) => {
      const done  = tasks.filter(t => t.done).length;
      const total = tasks.length;
      const pct   = total ? Math.round((done/total)*100) : 0;
      const isToday = date === today;
      const isPast  = date < today;

      return `
        <div class="week-day-card ${isToday ? 'today-card' : ''} ${isPast ? 'past-card' : ''}">
          <div class="wdc-header">
            <span class="wdc-day">${dayNames[idx]}</span>
            <span class="wdc-date">${UI.formatDate(date, {day:'numeric',month:'short'})}</span>
            ${isToday ? '<span class="today-dot"></span>' : ''}
          </div>
          <div class="wdc-progress">
            <div class="wdc-fill" style="width:${pct}%"></div>
          </div>
          <div class="wdc-tasks-count">${done}/${total} tasks</div>
          <div class="wdc-task-types">
            ${renderTypeDots(tasks)}
          </div>
          <div class="wdc-task-list">
            ${tasks.slice(0,4).map(t => `
              <div class="wdc-task ${t.done ? 'wdc-done' : ''}">
                <span style="color:${UI.taskTypeColor(t.type)}">${UI.taskTypeIcon(t.type)}</span>
                <span class="wdc-task-name">${truncate(t.label, 25)}</span>
              </div>
            `).join('')}
            ${tasks.length > 4 ? `<div class="wdc-more">+${tasks.length - 4} more</div>` : ''}
          </div>
          <button class="btn-sm btn-ghost mt-sm" onclick="App.navigate('daily-planner','${date}')">
            View Day →
          </button>
        </div>
      `;
    }).join('');

    const weekStats = computeWeekStats(plan);

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Weekly Planner</h1>
          <p class="page-sub">${UI.formatDate(weekStart,{day:'numeric',month:'short'})} — ${UI.formatDate(weekEnd,{day:'numeric',month:'short'})}</p>
        </div>
        <div class="date-nav">
          <button class="btn btn-ghost" onclick="WeeklyPlannerPage.changeWeek('${prevWeek}')">← Prev Week</button>
          <button class="btn btn-ghost" onclick="WeeklyPlannerPage.thisWeek()">This Week</button>
          <button class="btn btn-ghost" onclick="WeeklyPlannerPage.changeWeek('${nextWeek}')">Next Week →</button>
        </div>
      </div>

      <div class="week-stats-row">
        <div class="ws-stat"><span class="ws-val">${weekStats.total}</span><span class="ws-lbl">Total Tasks</span></div>
        <div class="ws-stat"><span class="ws-val">${weekStats.done}</span><span class="ws-lbl">Completed</span></div>
        <div class="ws-stat"><span class="ws-val">${weekStats.revisions}</span><span class="ws-lbl">Revisions</span></div>
        <div class="ws-stat"><span class="ws-val">${weekStats.lectures}</span><span class="ws-lbl">Lectures</span></div>
        <div class="ws-stat"><span class="ws-val">${weekStats.mocks}</span><span class="ws-lbl">Mocks</span></div>
      </div>

      <div class="week-grid">
        ${dayCards}
      </div>
    `;
  };

  const renderTypeDots = (tasks) => {
    const types = [...new Set(tasks.map(t => t.type))];
    return types.map(type => `
      <span class="type-dot" style="background:${UI.taskTypeColor(type)}" title="${type}"></span>
    `).join('');
  };

  const computeWeekStats = (plan) => {
    const all = Object.values(plan).flat();
    return {
      total: all.length, done: all.filter(t => t.done).length,
      revisions: all.filter(t => t.type === 'revision').length,
      lectures:  all.filter(t => t.type === 'lecture').length,
      mocks:     all.filter(t => t.type === 'mock').length,
    };
  };

  const truncate = (s, n) => s.length > n ? s.slice(0, n) + '…' : s;

  const changeWeek = (date) => { weekStart = getMonday(date); App.renderPage('weekly-planner'); };
  const thisWeek   = () => { weekStart = getMonday(Store.todayStr()); App.renderPage('weekly-planner'); };

  return { render, changeWeek, thisWeek };
})();

// ============================================================
// pages/backlog-page.js — Backlog Management
// ============================================================

const BacklogPage = (() => {
  const render = () => {
    const backlog = Store.getBacklog();

    const itemsHtml = backlog.length === 0
      ? UI.emptyState('✅', 'Backlog is empty!', 'You\'re all caught up. Keep it going!')
      : backlog.map(task => `
          <div class="task-card full-task backlog-item">
            <div class="task-body">
              <div class="task-label">
                <span class="task-type-badge" style="background:${UI.taskTypeColor(task.type)}22;color:${UI.taskTypeColor(task.type)}">
                  ${UI.taskTypeIcon(task.type)} ${task.type}
                </span>
                <span>${task.label}</span>
              </div>
              ${task.detail ? `<div class="task-detail">${task.detail}</div>` : ''}
              <div class="backlog-meta">
                📅 Originally: ${UI.formatDate(task.originalDate, {day:'numeric',month:'short'})} · 
                Backlogged: ${UI.formatDate(task.backloggedAt, {day:'numeric',month:'short'})}
              </div>
            </div>
            ${task.subject && task.subject !== 'ALL' ? UI.subjectPill(task.subject) : ''}
            <button class="btn-sm btn-red" onclick="BacklogPage.removeItem('${task.id}')">✕ Remove</button>
          </div>
        `).join('');

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Backlog</h1>
          <p class="page-sub">${backlog.length} missed tasks</p>
        </div>
        ${backlog.length > 0 ? `
        <div>
          <button class="btn btn-primary" onclick="BacklogPage.clearBacklog()">
            ↻ Redistribute to Future Days
          </button>
          <button class="btn btn-ghost ml-sm" onclick="BacklogPage.clearAll()">
            🗑 Clear All
          </button>
        </div>` : ''}
      </div>

      ${backlog.length > 0 ? `
      <div class="info-box mb-md">
        💡 "Redistribute" will spread these tasks over the next few days without overloading any single day.
      </div>` : ''}

      <div class="task-groups-wrap">
        ${itemsHtml}
      </div>
    `;
  };

  const clearBacklog = () => {
    const count = Planner.redistributeBacklog();
    UI.toast(`✅ Redistributed ${count} tasks into upcoming days`, 'success');
    App.renderPage('backlog');
    App.updateBadges();
  };

  const removeItem = (id) => {
    Store.removeFromBacklog(id);
    App.renderPage('backlog');
    App.updateBadges();
  };

  const clearAll = () => {
    UI.confirm('Remove all backlog tasks permanently?', () => {
      Store.setBacklog([]);
      App.renderPage('backlog');
      App.updateBadges();
      UI.toast('Backlog cleared', 'info');
    });
  };

  return { render, clearBacklog, removeItem, clearAll };
})();

// ============================================================
// pages/mocks-page.js — Mock Test Management
// CL + IMS mocks, schedule, analysis tracking
// ============================================================

const MocksPage = (() => {
  const render = () => {
    const mocks  = Store.getMocks();
    const today  = Store.todayStr();
    const upcoming = mocks.filter(m => m.date >= today);
    const past     = mocks.filter(m => m.date < today);

    const mockCard = (m, isPast) => {
      const statusBg = m.attempted ? (m.analysed ? 'badge-green' : 'badge-yellow') : 'badge-gray';
      const statusTxt= m.attempted ? (m.analysed ? 'Done' : 'Analysis Pending') : 'Upcoming';
      return `
        <div class="mock-card">
          <div class="mock-card-header">
            <div>
              <div class="mock-name">${m.name}</div>
              <div class="mock-meta">${UI.formatDateShort(m.date)} · ${m.provider || 'CL/IMS'} · ${m.type || 'Full Mock'}</div>
            </div>
            <span class="badge ${statusBg}">${statusTxt}</span>
          </div>
          ${m.score ? `
          <div class="mock-scores">
            <div class="score-item">
              <span class="score-val">${m.score?.total ?? '—'}</span>
              <span class="score-lbl">Total</span>
            </div>
            <div class="score-item">
              <span class="score-val">${m.score?.varc ?? '—'}</span>
              <span class="score-lbl">VARC</span>
            </div>
            <div class="score-item">
              <span class="score-val">${m.score?.lrdi ?? '—'}</span>
              <span class="score-lbl">LRDI</span>
            </div>
            <div class="score-item">
              <span class="score-val">${m.score?.quant ?? '—'}</span>
              <span class="score-lbl">Quant</span>
            </div>
            ${m.score?.percentile ? `<div class="score-item"><span class="score-val">${m.score.percentile}%ile</span><span class="score-lbl">Percentile</span></div>` : ''}
          </div>` : ''}
          ${m.notes ? `<div class="mock-notes">${m.notes}</div>` : ''}
          <div class="mock-actions">
            ${!m.attempted ? `<button class="btn-sm btn-blue" onclick="MocksPage.markAttempted('${m.id}')">✓ Mark Attempted</button>` : ''}
            ${m.attempted && !m.analysed ? `<button class="btn-sm btn-green" onclick="MocksPage.markAnalysed('${m.id}')">🔍 Mark Analysed</button>` : ''}
            <button class="btn-sm btn-ghost" onclick="MocksPage.editMock('${m.id}')">✏️ Edit</button>
            <button class="btn-sm btn-ghost" onclick="MocksPage.enterScore('${m.id}')">📊 Scores</button>
            <button class="btn-sm btn-red" onclick="MocksPage.deleteMock('${m.id}')">✕</button>
          </div>
        </div>
      `;
    };

    const totalMocks    = mocks.length;
    const attempted     = mocks.filter(m => m.attempted).length;
    const analysed      = mocks.filter(m => m.analysed).length;
    const avgScore      = mocks.filter(m => m.score?.total).reduce((s,m,_,a) => s + m.score.total/a.length, 0);

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Mock Tests</h1>
          <p class="page-sub">CL · IMS · Schedule & Analysis</p>
        </div>
        <button class="btn btn-primary" onclick="MocksPage.addMock()">+ Add Mock</button>
      </div>

      <div class="mock-stats-row">
        <div class="ms-stat"><span class="ms-val">${totalMocks}</span><span class="ms-lbl">Total Scheduled</span></div>
        <div class="ms-stat"><span class="ms-val">${attempted}</span><span class="ms-lbl">Attempted</span></div>
        <div class="ms-stat"><span class="ms-val">${analysed}</span><span class="ms-lbl">Analysed</span></div>
        <div class="ms-stat"><span class="ms-val">${avgScore ? avgScore.toFixed(0) : '—'}</span><span class="ms-lbl">Avg Score</span></div>
      </div>

      ${upcoming.length > 0 ? `
      <div class="mock-section">
        <h3 class="section-title">Upcoming (${upcoming.length})</h3>
        ${upcoming.map(m => mockCard(m, false)).join('')}
      </div>` : ''}

      ${past.length > 0 ? `
      <div class="mock-section mt-md">
        <h3 class="section-title">Past Mocks (${past.length})</h3>
        ${past.reverse().map(m => mockCard(m, true)).join('')}
      </div>` : ''}

      ${mocks.length === 0 ? UI.emptyState('📝', 'No mocks scheduled yet', 'Add your CL and IMS mock schedule to track progress.') : ''}

      <!-- Quick add bulk CL/IMS -->
      <div class="bulk-add-wrap mt-md">
        <button class="btn btn-ghost" onclick="MocksPage.bulkAddCL()">+ Bulk Add CL Mocks</button>
        <button class="btn btn-ghost ml-sm" onclick="MocksPage.bulkAddIMS()">+ Bulk Add IMS Mocks</button>
      </div>
    `;
  };

  const addMock = (prefill = {}) => {
    UI.openModal(`
      <div class="modal-form">
        <h3>Add Mock Test</h3>
        <div class="form-row">
          <label>Name</label>
          <input type="text" id="mock-name" class="input" value="${prefill.name||''}" placeholder="e.g. CL Mock 1">
        </div>
        <div class="form-row">
          <label>Date</label>
          <input type="date" id="mock-date" class="input" value="${prefill.date||Store.todayStr()}">
        </div>
        <div class="form-row">
          <label>Provider</label>
          <select id="mock-provider" class="input">
            <option value="CL" ${prefill.provider==='CL'?'selected':''}>Career Launcher (CL)</option>
            <option value="IMS" ${prefill.provider==='IMS'?'selected':''}>IMS</option>
            <option value="Self" ${prefill.provider==='Self'?'selected':''}>Self / Other</option>
          </select>
        </div>
        <div class="form-row">
          <label>Type</label>
          <select id="mock-type" class="input">
            <option>Full Mock</option>
            <option>Sectional — VARC</option>
            <option>Sectional — LRDI</option>
            <option>Sectional — Quant</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" onclick="MocksPage.saveMock()">Save</button>
          <button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
        </div>
      </div>
    `);
  };

  const saveMock = () => {
    const name     = document.getElementById('mock-name')?.value?.trim();
    const date     = document.getElementById('mock-date')?.value;
    const provider = document.getElementById('mock-provider')?.value;
    const type     = document.getElementById('mock-type')?.value;
    if (!name || !date) { UI.toast('Fill all fields', 'error'); return; }
    Store.addMock({ name, date, provider, type, attempted: false, analysed: false, score: null, notes: '' });
    UI.closeModal();
    App.renderPage('mocks');
    UI.toast('Mock added!', 'success');
  };

  const markAttempted = (id) => {
    Store.updateMock(id, { attempted: true });
    App.renderPage('mocks');
    UI.toast('Mock marked as attempted!', 'success');
  };

  const markAnalysed = (id) => {
    Store.updateMock(id, { analysed: true });
    App.renderPage('mocks');
    UI.toast('Analysis logged!', 'success');
  };

  const enterScore = (id) => {
    const mock = Store.getMocks().find(m => m.id === id);
    if (!mock) return;
    const s = mock.score || {};
    UI.openModal(`
      <div class="modal-form">
        <h3>Scores — ${mock.name}</h3>
        <div class="form-row"><label>VARC</label><input type="number" id="sc-varc" class="input" value="${s.varc||''}"></div>
        <div class="form-row"><label>LRDI</label><input type="number" id="sc-lrdi" class="input" value="${s.lrdi||''}"></div>
        <div class="form-row"><label>Quant</label><input type="number" id="sc-quant" class="input" value="${s.quant||''}"></div>
        <div class="form-row"><label>Total</label><input type="number" id="sc-total" class="input" value="${s.total||''}"></div>
        <div class="form-row"><label>Percentile</label><input type="number" id="sc-pct" class="input" value="${s.percentile||''}" step="0.01"></div>
        <div class="form-row"><label>Notes</label><textarea id="sc-notes" class="textarea" rows="3">${mock.notes||''}</textarea></div>
        <div class="modal-actions">
          <button class="btn btn-primary" onclick="MocksPage.saveScore('${id}')">Save</button>
          <button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
        </div>
      </div>
    `);
  };

  const saveScore = (id) => {
    const score = {
      varc:      parseFloat(document.getElementById('sc-varc')?.value)||null,
      lrdi:      parseFloat(document.getElementById('sc-lrdi')?.value)||null,
      quant:     parseFloat(document.getElementById('sc-quant')?.value)||null,
      total:     parseFloat(document.getElementById('sc-total')?.value)||null,
      percentile:parseFloat(document.getElementById('sc-pct')?.value)||null,
    };
    const notes = document.getElementById('sc-notes')?.value||'';
    Store.updateMock(id, { score, notes, attempted: true });
    UI.closeModal();
    App.renderPage('mocks');
    UI.toast('Scores saved!', 'success');
  };

  const editMock = (id) => {
    const mock = Store.getMocks().find(m => m.id === id);
    if (!mock) return;
    addMock(mock);
  };

  const deleteMock = (id) => {
    UI.confirm('Delete this mock?', () => {
      Store.deleteMock(id);
      App.renderPage('mocks');
      UI.toast('Mock deleted', 'info');
    });
  };

  // ── Bulk add helpers ──────────────────────────────────────
  const bulkAddCL = () => {
    // Add 10 CL mocks every Sunday from next month
    const today = Store.todayStr();
    let added = 0;
    let date = Store.addDays(today, 1);
    for (let i = 1; i <= 10; i++) {
      while (new Date(date + 'T00:00:00').getDay() !== 0) {
        date = Store.addDays(date, 1);
      }
      if (Store.getMocks().find(m => m.date === date && m.provider === 'CL')) { date = Store.addDays(date, 7); continue; }
      Store.addMock({ name: `CL Mock ${i}`, date, provider: 'CL', type: 'Full Mock', attempted: false, analysed: false, score: null, notes: '' });
      date = Store.addDays(date, 7);
      added++;
    }
    App.renderPage('mocks');
    UI.toast(`Added ${added} CL mocks on Sundays`, 'success');
  };

  const bulkAddIMS = () => {
    const today = Store.todayStr();
    let added = 0;
    let date = Store.addDays(today, 14); // start 2 weeks out
    for (let i = 1; i <= 8; i++) {
      while (new Date(date + 'T00:00:00').getDay() !== 0) { date = Store.addDays(date, 1); }
      const mockDate = Store.addDays(date, 0);
      // Avoid clash with CL mock on same date
      const hasCL = Store.getMocks().find(m => m.date === mockDate && m.provider === 'CL');
      const finalDate = hasCL ? Store.addDays(mockDate, 1) : mockDate;
      Store.addMock({ name: `IMS Mock ${i}`, date: finalDate, provider: 'IMS', type: 'Full Mock', attempted: false, analysed: false, score: null, notes: '' });
      date = Store.addDays(date, 14); // every 2 weeks
      added++;
    }
    App.renderPage('mocks');
    UI.toast(`Added ${added} IMS mocks`, 'success');
  };

  return {
    render, addMock, saveMock,
    markAttempted, markAnalysed,
    enterScore, saveScore,
    editMock, deleteMock,
    bulkAddCL, bulkAddIMS,
  };
})();

// ============================================================
// pages/roadmap.js — Roadmap & Smart Estimation
// ============================================================

const RoadmapPage = (() => {
  const render = () => {
    const r = Planner.getRoadmap();
    const topics = Object.values(Store.getTopics());
    const mocks  = Store.getMocks();

    // Subject-level timelines
    const subjectRows = Object.keys(SUBJECTS_CONFIG).map(subj => {
      const p = Store.getSubjectProgress(subj);
      const meta = SUBJECT_META[subj];
      const remaining = p.total - p.done;
      const weeksNeeded = r.completionRate > 0 ? Math.ceil(remaining / (r.completionRate / 3)) : remaining;
      return `
        <div class="roadmap-subject-row">
          <div class="rsr-name" style="color:${meta.color}">${meta.icon} ${meta.shortName}</div>
          <div class="rsr-progress">
            <div class="rsr-fill" style="width:${p.pct}%;background:${meta.color}"></div>
          </div>
          <div class="rsr-pct">${p.pct}%</div>
          <div class="rsr-eta">${remaining > 0 ? `~${weeksNeeded}w remaining` : '✅ Done'}</div>
        </div>
      `;
    }).join('');

    const onTrackHtml = r.onTrack
      ? `<div class="alert alert-green">✅ You're on track! Est. completion by ${UI.formatDate(r.estCompletionDate)}.</div>`
      : `<div class="alert alert-red">⚠️ You're behind schedule. Aim for ${r.topicsPerDay} topics/day to catch up.</div>`;

    // Timeline bar
    const start  = new Date('2026-01-01');
    const catDay = new Date(r.catDate);
    const todayD = new Date(r.today);
    const total  = catDay - start;
    const elapsed= todayD - start;
    const pctElapsed = Math.min(100, Math.round((elapsed / total) * 100));
    const pctSyllabus= r.pct;

    const mockSchedule = mocks.slice(0,6).map(m => `
      <div class="timeline-mock-dot" style="left:${calcDatePct(m.date, start, catDay)}%"
           title="${m.name} — ${UI.formatDate(m.date)}">
        <div class="tmd-dot ${m.attempted ? 'tmd-done' : ''}"></div>
        <div class="tmd-label">${m.name.replace(' Mock','').replace('Mock','M')}</div>
      </div>
    `).join('');

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Roadmap to CAT 2026</h1>
          <p class="page-sub">${r.daysLeft} days remaining · ${UI.formatDate(r.catDate)}</p>
        </div>
      </div>

      ${onTrackHtml}

      <!-- Timeline -->
      <div class="panel mt-md">
        <h3 class="panel-title">Timeline</h3>
        <div class="timeline-wrap">
          <div class="timeline-track">
            <!-- Time elapsed -->
            <div class="timeline-elapsed" style="width:${pctElapsed}%"></div>
            <!-- Syllabus progress -->
            <div class="timeline-syllabus" style="width:${pctSyllabus}%;background:var(--accent)"></div>
            <!-- Today marker -->
            <div class="timeline-today" style="left:${pctElapsed}%" title="Today">▼</div>
            ${mockSchedule}
          </div>
          <div class="timeline-labels">
            <span>Jan 2026</span>
            <span>Apr</span>
            <span>Jul</span>
            <span>Sep</span>
            <span>Nov 29 (CAT)</span>
          </div>
        </div>
        <div class="timeline-legend">
          <span class="tl-item"><span class="tl-dot elapsed"></span> Time elapsed (${pctElapsed}%)</span>
          <span class="tl-item"><span class="tl-dot syllabus"></span> Syllabus done (${pctSyllabus}%)</span>
        </div>
      </div>

      <!-- Key Metrics -->
      <div class="roadmap-metrics-grid mt-md">
        <div class="rm-card">
          <div class="rm-icon">📅</div>
          <div class="rm-val">${r.daysLeft}</div>
          <div class="rm-lbl">Days to CAT</div>
        </div>
        <div class="rm-card">
          <div class="rm-icon">📚</div>
          <div class="rm-val">${r.notDone}</div>
          <div class="rm-lbl">Topics Remaining</div>
        </div>
        <div class="rm-card">
          <div class="rm-icon">⚡</div>
          <div class="rm-val">${r.topicsPerDay}</div>
          <div class="rm-lbl">Topics/Day Needed</div>
        </div>
        <div class="rm-card">
          <div class="rm-icon">📈</div>
          <div class="rm-val">${r.completionRate}</div>
          <div class="rm-lbl">Topics/Week (avg)</div>
        </div>
        <div class="rm-card">
          <div class="rm-icon">🎯</div>
          <div class="rm-val">${UI.formatDate(r.estCompletionDate, {month:'short',day:'numeric'})}</div>
          <div class="rm-lbl">Est. Syllabus Done</div>
        </div>
        <div class="rm-card">
          <div class="rm-icon">📝</div>
          <div class="rm-val">${mocks.filter(m=>m.attempted).length}/${mocks.length}</div>
          <div class="rm-lbl">Mocks Done</div>
        </div>
      </div>

      <!-- Subject timeline -->
      <div class="panel mt-md">
        <h3 class="panel-title">Subject Progress</h3>
        ${subjectRows}
      </div>

      <!-- Phase plan -->
      <div class="panel mt-md">
        <h3 class="panel-title">Suggested Phase Plan</h3>
        ${renderPhasePlan(r)}
      </div>
    `;
  };

  const calcDatePct = (dateStr, start, end) => {
    const d = new Date(dateStr);
    const total = end - start;
    const pos   = d - start;
    return Math.max(0, Math.min(98, Math.round((pos / total) * 100)));
  };

  const renderPhasePlan = (r) => {
    const phases = [
      { name: 'Phase 1 — Foundation', dates: 'Jan–Mar 2026', goal: 'Complete all lectures & PDFs (VARC + Quant basics)', icon: '🏗️' },
      { name: 'Phase 2 — Practice',   dates: 'Apr–Jun 2026', goal: 'Topic-wise tests, VARC 1000 series, LRDI sets',      icon: '📝' },
      { name: 'Phase 3 — Mocks',      dates: 'Jul–Sep 2026', goal: 'Full mocks every Sunday, analyse next day',           icon: '🚀' },
      { name: 'Phase 4 — Revision',   dates: 'Oct–Nov 2026', goal: 'Spaced revision, weak topic focus, final mocks',      icon: '🔁' },
    ];
    return phases.map(p => `
      <div class="phase-row">
        <div class="phase-icon">${p.icon}</div>
        <div class="phase-body">
          <div class="phase-name">${p.name}</div>
          <div class="phase-dates">${p.dates}</div>
          <div class="phase-goal">${p.goal}</div>
        </div>
      </div>
    `).join('');
  };

  return { render };
})();
