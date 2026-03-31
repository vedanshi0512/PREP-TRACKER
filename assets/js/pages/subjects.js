// ============================================================
// pages/subjects.js — Subjects & Topics Management Page
// Full syllabus view, topic editing, progress tracking
// ============================================================

const SubjectsPage = (() => {
  let activeSubject = 'VARC';

  const render = (subjectArg) => {
    if (subjectArg) activeSubject = subjectArg;

    const subjectTabs = Object.keys(SUBJECTS_CONFIG).map(s => {
      const meta = SUBJECT_META[s];
      const prog = Store.getSubjectProgress(s);
      return `
        <button class="subject-tab ${s === activeSubject ? 'active' : ''}"
          onclick="SubjectsPage.switchTab('${s}')"
          style="${s === activeSubject ? `border-color:${meta.color};color:${meta.color}` : ''}">
          ${meta.icon} ${meta.shortName}
          <span class="tab-pct" style="color:${meta.color}">${prog.pct}%</span>
        </button>
      `;
    }).join('');

    const topics = Store.getTopicsBySubject(activeSubject);
    const meta   = SUBJECT_META[activeSubject];
    const prog   = Store.getSubjectProgress(activeSubject);

    const topicRows = topics.map(t => renderTopicRow(t)).join('');

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Subjects & Topics</h1>
          <p class="page-sub">Track lectures, tests, and revisions per topic</p>
        </div>
      </div>

      <div class="subject-tabs">
        ${subjectTabs}
      </div>

      <div class="subject-overview-bar">
        <div class="sob-name" style="color:${meta.color}">${meta.icon} ${meta.name}</div>
        <div class="sob-stats">
          <span>${prog.done}/${prog.total} completed</span>
          <span>${prog.pct}%</span>
        </div>
        <div class="progress-track flex-1">
          <div class="progress-fill" style="width:${prog.pct}%;background:${meta.color}"></div>
        </div>
      </div>

      <div class="topics-table-wrap">
        <table class="topics-table">
          <thead>
            <tr>
              <th>Topic</th>
              <th>Lectures</th>
              <th>Tests</th>
              <th>Practice Qs</th>
              <th>Status</th>
              <th>Difficulty</th>
              <th>Strength</th>
              <th>Next Revision</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="topics-tbody">
            ${topicRows}
          </tbody>
        </table>
      </div>
    `;
  };

  const renderTopicRow = (t) => {
    const lectPct = t.totalLectures > 0 ? Math.round((t.completedLectures / t.totalLectures) * 100) : 100;
    const testPct = t.totalTests > 0 ? Math.round((t.completedTests / t.totalTests) * 100) : 100;

    return `
      <tr class="topic-row ${t.status === STATUS.COMPLETED ? 'row-done' : ''}">
        <td class="topic-name-cell">
          <span class="topic-name">${t.name}</span>
          ${t.notes ? `<span class="topic-note" title="${t.notes}">📝</span>` : ''}
        </td>
        <td>
          <div class="count-cell">
            <button class="cnt-btn minus" onclick="SubjectsPage.adjustCount('${t.id}','completedLectures',-1)">−</button>
            <span class="cnt-val">${t.completedLectures}/${t.totalLectures}</span>
            <button class="cnt-btn plus" onclick="SubjectsPage.adjustCount('${t.id}','completedLectures',1)">+</button>
          </div>
          <div class="mini-progress" title="${lectPct}%">
            <div class="mini-fill" style="width:${lectPct}%"></div>
          </div>
        </td>
        <td>
          <div class="count-cell">
            <button class="cnt-btn minus" onclick="SubjectsPage.adjustCount('${t.id}','completedTests',-1)">−</button>
            <span class="cnt-val">${t.completedTests}/${t.totalTests}</span>
            <button class="cnt-btn plus" onclick="SubjectsPage.adjustCount('${t.id}','completedTests',1)">+</button>
          </div>
          <div class="mini-progress" title="${testPct}%">
            <div class="mini-fill" style="width:${testPct}%"></div>
          </div>
        </td>
        <td>
          <div class="count-cell">
            <button class="cnt-btn minus" onclick="SubjectsPage.adjustCount('${t.id}','practiceQs',-5)">−</button>
            <span class="cnt-val">${t.practiceQs}</span>
            <button class="cnt-btn plus" onclick="SubjectsPage.adjustCount('${t.id}','practiceQs',5)">+</button>
          </div>
        </td>
        <td>${UI.statusBadge(t.status)}</td>
        <td>
          <select class="inline-select" onchange="SubjectsPage.updateField('${t.id}','difficulty',this.value)">
            ${Object.values(DIFFICULTY).map(d =>
              `<option value="${d}" ${t.difficulty === d ? 'selected' : ''}>${d}</option>`
            ).join('')}
          </select>
        </td>
        <td>
          <select class="inline-select" onchange="SubjectsPage.updateField('${t.id}','strength',this.value)">
            ${Object.values(STRENGTH).map(s =>
              `<option value="${s}" ${t.strength === s ? 'selected' : ''}>${s}</option>`
            ).join('')}
          </select>
        </td>
        <td class="rev-date">
          ${t.nextRevision ? `<span class="${t.nextRevision <= Store.todayStr() ? 'due-today' : ''}">${UI.formatDate(t.nextRevision, {month:'short',day:'numeric'})}</span>` : '—'}
        </td>
        <td class="actions-cell">
          ${t.status !== STATUS.COMPLETED
            ? `<button class="btn-sm btn-green" onclick="SubjectsPage.markComplete('${t.id}')">✓ Done</button>`
            : `<button class="btn-sm btn-purple" onclick="SubjectsPage.markRevision('${t.id}')">🔁 Revised</button>`
          }
          <button class="btn-sm btn-ghost" onclick="SubjectsPage.editNotes('${t.id}')">📝</button>
          <button class="btn-sm btn-ghost" onclick="SubjectsPage.editTotals('${t.id}')">✏️</button>
        </td>
      </tr>
    `;
  };

  // ── Tab switch ────────────────────────────────────────────
  const switchTab = (subject) => {
    activeSubject = subject;
    App.renderPage('subjects');
  };

  // ── Count adjustment ──────────────────────────────────────
  const adjustCount = (id, field, delta) => {
    const t = Store.getTopic(id);
    if (!t) return;
    const max = field === 'completedLectures' ? t.totalLectures
              : field === 'completedTests'    ? t.totalTests
              : 9999;
    const newVal = Math.max(0, Math.min(max, (t[field] || 0) + delta));
    Store.updateTopic(id, { [field]: newVal });
    App.renderPage('subjects');
    // Update backlog badge
    App.updateBadges();
  };

  // ── Field update ──────────────────────────────────────────
  const updateField = (id, field, value) => {
    Store.updateTopic(id, { [field]: value });
    App.renderPage('subjects');
  };

  // ── Mark Complete ─────────────────────────────────────────
  const markComplete = (id) => {
    const t = Store.getTopic(id);
    if (!t) return;
    // Fill to max
    Store.updateTopic(id, {
      completedLectures: t.totalLectures,
      completedTests: t.totalTests,
    });
    UI.toast(`✅ ${t.name} marked as completed! Revision scheduled.`, 'success');
    App.renderPage('subjects');
  };

  // ── Mark Revision Done ────────────────────────────────────
  const markRevision = (id) => {
    const t = Store.getTopic(id);
    if (!t) return;
    Store.markRevisionDone(id);
    UI.toast(`🔁 Revision logged for ${t.name}`, 'info');
    App.renderPage('subjects');
  };

  // ── Edit Notes Modal ──────────────────────────────────────
  const editNotes = (id) => {
    const t = Store.getTopic(id);
    if (!t) return;
    UI.openModal(`
      <div class="modal-form">
        <h3>Notes — ${t.name}</h3>
        <textarea id="topic-notes" rows="5" class="textarea">${t.notes || ''}</textarea>
        <div class="modal-actions">
          <button class="btn btn-primary" onclick="SubjectsPage.saveNotes('${id}')">Save</button>
          <button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
        </div>
      </div>
    `);
  };

  const saveNotes = (id) => {
    const notes = document.getElementById('topic-notes')?.value || '';
    Store.updateTopic(id, { notes });
    UI.closeModal();
    App.renderPage('subjects');
    UI.toast('Notes saved', 'success');
  };

  // ── Edit Totals Modal ─────────────────────────────────────
  const editTotals = (id) => {
    const t = Store.getTopic(id);
    if (!t) return;
    UI.openModal(`
      <div class="modal-form">
        <h3>Edit Totals — ${t.name}</h3>
        <div class="form-row">
          <label>Total Lectures / PDFs</label>
          <input type="number" id="edit-lectures" class="input" value="${t.totalLectures}" min="0">
        </div>
        <div class="form-row">
          <label>Total Tests</label>
          <input type="number" id="edit-tests" class="input" value="${t.totalTests}" min="0">
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" onclick="SubjectsPage.saveTotals('${id}')">Save</button>
          <button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
        </div>
      </div>
    `);
  };

  const saveTotals = (id) => {
    const totalLectures = parseInt(document.getElementById('edit-lectures')?.value) || 0;
    const totalTests    = parseInt(document.getElementById('edit-tests')?.value) || 0;
    Store.updateTopic(id, { totalLectures, totalTests });
    UI.closeModal();
    App.renderPage('subjects');
  };

  return {
    render, switchTab,
    adjustCount, updateField,
    markComplete, markRevision,
    editNotes, saveNotes,
    editTotals, saveTotals,
  };
})();
