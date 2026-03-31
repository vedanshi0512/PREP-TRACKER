// ============================================================
// pages/daily-planner.js — Daily Planner Page
// Shows today's (or selected date's) study tasks
// ============================================================

const DailyPlannerPage = (() => {
  let viewDate = null; // null = today

  const render = (dateArg) => {
    if (dateArg) viewDate = dateArg;
    const date  = viewDate || Store.todayStr();
    const today = Store.todayStr();
    const isToday = date === today;
    const tasks = Planner.generateDayTasks(date);
    const done  = tasks.filter(t => t.done).length;
    const pct   = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

    const prevDate = Store.addDays(date, -1);
    const nextDate = Store.addDays(date, 1);

    // Group tasks by type
    const groups = {
      'Mock / Analysis': tasks.filter(t => ['mock','analysis'].includes(t.type)),
      'Revisions':       tasks.filter(t => t.type === 'revision'),
      'New Lectures':    tasks.filter(t => t.type === 'lecture'),
      'Tests':           tasks.filter(t => t.type === 'test'),
      'Practice':        tasks.filter(t => t.type === 'practice'),
    };

    const groupsHtml = Object.entries(groups)
      .filter(([, items]) => items.length > 0)
      .map(([label, items]) => `
        <div class="task-group">
          <div class="task-group-label">${label}</div>
          ${items.map(task => renderTask(task, date)).join('')}
        </div>
      `).join('');

    const emptyHtml = tasks.length === 0
      ? UI.emptyState('🎉', 'No tasks scheduled', 'Great job! Or generate a plan for this day.')
      : '';

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Daily Planner</h1>
          <p class="page-sub">${isToday ? 'Today — ' : ''}${UI.formatDateShort(date)}</p>
        </div>
        <div class="date-nav">
          <button class="btn btn-ghost" onclick="DailyPlannerPage.changeDate('${prevDate}')">← Prev</button>
          <button class="btn ${isToday ? 'btn-primary' : 'btn-ghost'}" onclick="DailyPlannerPage.goToday()">Today</button>
          <button class="btn btn-ghost" onclick="DailyPlannerPage.changeDate('${nextDate}')">Next →</button>
        </div>
      </div>

      <!-- Progress summary -->
      <div class="day-progress-bar">
        <div class="dp-fill" style="width:${pct}%;background:var(--accent)"></div>
      </div>
      <div class="dp-meta">
        <span>${done} of ${tasks.length} tasks done</span>
        <span>${pct}%</span>
      </div>

      <!-- Quick stats pills -->
      <div class="task-type-pills">
        ${renderTypePills(tasks)}
      </div>

      <!-- Regenerate button -->
      <div class="planner-actions">
        <button class="btn btn-ghost btn-sm" onclick="DailyPlannerPage.regenerate('${date}')">
          ↻ Regenerate Plan
        </button>
        <button class="btn btn-ghost btn-sm" onclick="DailyPlannerPage.addCustomTask('${date}')">
          + Add Task
        </button>
        ${tasks.length > 0 && done < tasks.length ? `
        <button class="btn btn-ghost btn-sm" onclick="DailyPlannerPage.markAllDone('${date}')">
          ✓ Mark All Done
        </button>` : ''}
      </div>

      <!-- Task groups -->
      <div class="task-groups-wrap">
        ${emptyHtml}
        ${groupsHtml}
      </div>

      <!-- Focus Mode button -->
      <div class="focus-mode-wrap">
        <button class="btn btn-outline-accent" onclick="DailyPlannerPage.focusMode('${date}')">
          🎯 Today Focus Mode
        </button>
      </div>
    `;
  };

  // ── Task card ─────────────────────────────────────────────
  const renderTask = (task, date) => {
    const color = UI.taskTypeColor(task.type);
    const icon  = UI.taskTypeIcon(task.type);
    const doneClass = task.done ? 'task-done' : '';
    const missedClass = task.missed ? 'task-missed' : '';
    const backlogClass = task.backlog ? 'task-backlog' : '';

    return `
      <div class="task-card full-task ${doneClass} ${missedClass} ${backlogClass}"
           data-task-id="${task.id}">
        <div class="task-check ${task.done ? 'checked' : ''}"
             onclick="DailyPlannerPage.toggleTask('${task.id}','${date}')">
          ${task.done ? '✓' : ''}
        </div>
        <div class="task-body">
          <div class="task-label">
            <span class="task-type-badge" style="background:${color}22;color:${color};border:1px solid ${color}44">
              ${icon} ${task.type}
            </span>
            <span>${task.label}</span>
          </div>
          ${task.detail ? `<div class="task-detail">${task.detail}</div>` : ''}
          ${task.backlog ? `<div class="task-backlog-tag">📋 From backlog · orig: ${UI.formatDate(task.originalDate,{month:'short',day:'numeric'})}</div>` : ''}
        </div>
        ${task.subject && task.subject !== 'ALL' ? UI.subjectPill(task.subject) : ''}
        <div class="task-actions">
          <button class="btn-icon" title="Remove" onclick="DailyPlannerPage.removeTask('${task.id}','${date}')">✕</button>
        </div>
      </div>
    `;
  };

  // ── Type pills summary ────────────────────────────────────
  const renderTypePills = (tasks) => {
    const types = ['lecture','test','revision','mock','analysis','practice'];
    return types.map(type => {
      const cnt = tasks.filter(t => t.type === type).length;
      if (!cnt) return '';
      const color = UI.taskTypeColor(type);
      return `<span class="type-pill" style="background:${color}22;color:${color};border:1px solid ${color}44">
        ${UI.taskTypeIcon(type)} ${type}: ${cnt}
      </span>`;
    }).join('');
  };

  // ── Actions ───────────────────────────────────────────────
  const toggleTask = (taskId, date) => {
    const updated = Store.completeTask(date, taskId);
    if (updated?.done) {
      Store.updateStreak();
      if (updated.type === 'revision' && updated.topicId) {
        Store.markRevisionDone(updated.topicId);
        UI.toast('🔁 Revision marked done!', 'success');
      } else if (updated.type === 'lecture' && updated.topicId) {
        const t = Store.getTopic(updated.topicId);
        if (t) {
          // Increment completed lectures by 1
          const newLect = Math.min(t.completedLectures + 1, t.totalLectures);
          Store.updateTopic(updated.topicId, { completedLectures: newLect });
        }
        UI.toast('🎬 Lecture logged!', 'success');
      } else if (updated.type === 'test' && updated.topicId) {
        const t = Store.getTopic(updated.topicId);
        if (t) {
          const newTest = Math.min(t.completedTests + 1, t.totalTests);
          Store.updateTopic(updated.topicId, { completedTests: newTest });
        }
        UI.toast('✅ Test logged!', 'success');
      }
    }
    App.renderPage('daily-planner');
    App.updateBadges();
  };

  const regenerate = (date) => {
    // Clear existing tasks and regenerate
    Store.setTasks(date, []);
    App.renderPage('daily-planner');
    UI.toast('Plan regenerated!', 'info');
  };

  const removeTask = (taskId, date) => {
    const tasks = Store.getTasks(date).filter(t => t.id !== taskId);
    Store.setTasks(date, tasks);
    App.renderPage('daily-planner');
  };

  const markAllDone = (date) => {
    const tasks = Store.getTasks(date).map(t => ({ ...t, done: true, doneAt: new Date().toISOString() }));
    Store.setTasks(date, tasks);
    Store.updateStreak();
    UI.toast('🎉 All tasks marked done!', 'success');
    App.renderPage('daily-planner');
  };

  const addCustomTask = (date) => {
    UI.openModal(`
      <div class="modal-form">
        <h3>Add Custom Task</h3>
        <div class="form-row">
          <label>Type</label>
          <select id="ct-type" class="input">
            <option value="lecture">Lecture</option>
            <option value="test">Test</option>
            <option value="revision">Revision</option>
            <option value="practice">Practice</option>
          </select>
        </div>
        <div class="form-row">
          <label>Label</label>
          <input type="text" id="ct-label" class="input" placeholder="Task description">
        </div>
        <div class="form-row">
          <label>Subject</label>
          <select id="ct-subject" class="input">
            <option value="VARC">VARC</option>
            <option value="LRDI">LRDI</option>
            <option value="Quant">Quant</option>
            <option value="ALL">General</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" onclick="DailyPlannerPage.saveCustomTask('${date}')">Add</button>
          <button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>
        </div>
      </div>
    `);
  };

  const saveCustomTask = (date) => {
    const type    = document.getElementById('ct-type')?.value || 'practice';
    const label   = document.getElementById('ct-label')?.value || 'Custom Task';
    const subject = document.getElementById('ct-subject')?.value || 'ALL';
    const task = Planner.makeTask(type, 'custom', subject, label);
    const tasks = Store.getTasks(date);
    tasks.push(task);
    Store.setTasks(date, tasks);
    UI.closeModal();
    App.renderPage('daily-planner');
  };

  const changeDate = (date) => {
    viewDate = date;
    App.renderPage('daily-planner');
  };

  const goToday = () => {
    viewDate = Store.todayStr();
    App.renderPage('daily-planner');
  };

  // ── Focus Mode ────────────────────────────────────────────
  const focusMode = (date) => {
    const tasks = Store.getTasks(date).filter(t => !t.done);
    if (!tasks.length) { UI.toast('All tasks done! 🎉', 'success'); return; }
    const html = `
      <div class="focus-modal">
        <div class="focus-header">
          <span>🎯 Focus Mode — ${UI.formatDateShort(date)}</span>
          <span>${tasks.length} tasks remaining</span>
        </div>
        <div class="focus-tasks">
          ${tasks.map(t => `
            <div class="focus-task-card">
              <div class="focus-task-type" style="color:${UI.taskTypeColor(t.type)}">
                ${UI.taskTypeIcon(t.type)} ${t.type.toUpperCase()}
              </div>
              <div class="focus-task-name">${t.label}</div>
              ${t.detail ? `<div class="focus-task-detail">${t.detail}</div>` : ''}
              <button class="btn btn-primary mt-sm" 
                onclick="DailyPlannerPage.toggleTask('${t.id}','${date}');UI.closeModal()">
                ✓ Mark Done
              </button>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-ghost mt-md" onclick="UI.closeModal()">Close</button>
      </div>
    `;
    UI.openModal(html);
  };

  return {
    render, toggleTask, regenerate, removeTask, markAllDone,
    addCustomTask, saveCustomTask, changeDate, goToday, focusMode,
  };
})();
