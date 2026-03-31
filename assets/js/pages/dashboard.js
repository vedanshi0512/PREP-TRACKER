// ============================================================
// pages/dashboard.js — Dashboard Page
// Overview: progress, today's tasks, streaks, countdown
// ============================================================

const DashboardPage = (() => {

  const render = () => {
    const overall = Store.getOverallProgress();
    const streak  = Store.getStreak();
    const today   = Store.todayStr();
    const summary = Planner.getTodaySummary();
    const revsDue = Store.getRevisionsDue(today);
    const backlog = Store.getBacklog();
    const roadmap = Planner.getRoadmap();

    // Detect missed tasks from yesterday and earlier
    Planner.detectAndMoveToBacklog();

    const subjectCards = Object.keys(SUBJECTS_CONFIG).map(subj => {
      const prog = Store.getSubjectProgress(subj);
      const meta = SUBJECT_META[subj];
      const topics = Store.getTopicsBySubject(subj);
      const inProg = topics.filter(t => t.status === STATUS.IN_PROGRESS).length;
      return `
        <div class="subject-stat-card" style="border-left:3px solid ${meta.color}">
          <div class="ssc-header">
            <span class="ssc-icon">${meta.icon}</span>
            <span class="ssc-name">${meta.shortName}</span>
            <span class="ssc-pct" style="color:${meta.color}">${prog.pct}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:${prog.pct}%;background:${meta.color}"></div>
          </div>
          <div class="ssc-meta">${prog.done}/${prog.total} topics · ${inProg} in progress</div>
        </div>
      `;
    }).join('');

    const todayTasksHtml = summary.tasks.length === 0
      ? UI.emptyState('🎉', 'No tasks for today!', 'All caught up or generate a plan.')
      : summary.tasks.map(task => renderTaskCard(task, today)).join('');

    const revsHtml = revsDue.length === 0
      ? `<p class="muted-text">No revisions due today 🎉</p>`
      : revsDue.slice(0, 5).map(t => `
          <div class="rev-item">
            ${UI.subjectPill(t.subject)}
            <span class="rev-name">${t.name}</span>
            <span class="rev-badge">${t.strength}</span>
          </div>
        `).join('');

    const onTrackBadge = roadmap.onTrack
      ? `<span class="badge badge-green">✅ On Track</span>`
      : `<span class="badge badge-red">⚠️ Behind Schedule</span>`;

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-sub">CAT 2026 — ${UI.formatDate(today)}</p>
        </div>
        <div class="header-badges">
          ${UI.catCountdown()}
          ${UI.streakBadge()}
        </div>
      </div>

      <!-- Overall Progress Ring + Stats -->
      <div class="stats-row">
        <div class="stat-card stat-card-hero">
          <div class="hero-ring-wrap">
            ${renderRing(overall.pct)}
          </div>
          <div class="hero-details">
            <div class="hero-title">Overall Progress</div>
            <div class="hero-sub">${overall.done}/${overall.total} topics complete</div>
            <div class="hero-meta">
              <span>📖 ${overall.lectDone}/${overall.lectTotal} lectures</span>
              <span>✅ ${overall.testDone}/${overall.testTotal} tests</span>
            </div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔥</div>
          <div class="stat-value">${streak.current}</div>
          <div class="stat-label">Day Streak</div>
          <div class="stat-sub">Best: ${streak.best}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏳</div>
          <div class="stat-value">${roadmap.daysLeft}</div>
          <div class="stat-label">Days to CAT</div>
          <div class="stat-sub">${UI.formatDate(roadmap.catDate)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⚠️</div>
          <div class="stat-value">${backlog.length}</div>
          <div class="stat-label">Backlog Tasks</div>
          <div class="stat-sub">${backlog.length > 0 ? '<a href="#" data-page="backlog" class="nav-link">Clear backlog →</a>' : 'All clear!'}</div>
        </div>
      </div>

      <!-- Subject Progress Cards -->
      <div class="section-header">
        <h2>Subject Progress</h2>
      </div>
      <div class="subject-stats-grid">
        ${subjectCards}
      </div>

      <!-- Today Tasks + Revisions -->
      <div class="two-col">
        <div class="panel">
          <div class="panel-header">
            <h3>Today's Plan</h3>
            <span class="panel-meta">${summary.done}/${summary.total} done</span>
          </div>
          <div class="progress-track mb-sm">
            <div class="progress-fill accent" style="width:${summary.pct}%"></div>
          </div>
          <div class="task-list" id="today-tasks">
            ${todayTasksHtml}
          </div>
        </div>
        <div class="panel">
          <div class="panel-header">
            <h3>Revisions Due</h3>
            <span class="panel-meta">${revsDue.length} topics</span>
          </div>
          <div id="revisions-list">
            ${revsHtml}
          </div>
        </div>
      </div>

      <!-- Roadmap snippet -->
      <div class="panel mt-md">
        <div class="panel-header">
          <h3>Roadmap Snapshot</h3>
          ${onTrackBadge}
        </div>
        <div class="roadmap-row">
          <div class="roadmap-stat">
            <span class="rs-val">${roadmap.completionRate}</span>
            <span class="rs-lbl">topics/week avg</span>
          </div>
          <div class="roadmap-stat">
            <span class="rs-val">${roadmap.topicsPerDay}</span>
            <span class="rs-lbl">needed/day</span>
          </div>
          <div class="roadmap-stat">
            <span class="rs-val">${UI.formatDate(roadmap.estCompletionDate, {month:'short',day:'numeric'})}</span>
            <span class="rs-lbl">est. syllabus done</span>
          </div>
          <div class="roadmap-stat">
            <span class="rs-val">${roadmap.notDone}</span>
            <span class="rs-lbl">topics remaining</span>
          </div>
        </div>
      </div>
    `;
  };

  // ── Ring SVG ─────────────────────────────────────────────
  const renderRing = (pct) => {
    const r = 44, circ = 2 * Math.PI * r;
    const filled = (pct / 100) * circ;
    return `
      <svg class="ring-svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="${r}" fill="none" stroke="var(--border)" stroke-width="8"/>
        <circle cx="50" cy="50" r="${r}" fill="none" stroke="var(--accent)" stroke-width="8"
          stroke-dasharray="${filled} ${circ}" stroke-linecap="round"
          transform="rotate(-90 50 50)"/>
        <text x="50" y="54" text-anchor="middle" class="ring-text">${pct}%</text>
      </svg>
    `;
  };

  // ── Task card ────────────────────────────────────────────
  const renderTaskCard = (task, date) => {
    const color = UI.taskTypeColor(task.type);
    const icon  = UI.taskTypeIcon(task.type);
    const doneClass = task.done ? 'task-done' : '';
    return `
      <div class="task-card ${doneClass}" data-task-id="${task.id}" data-date="${date}">
        <div class="task-check ${task.done ? 'checked' : ''}" onclick="DashboardPage.toggleTask('${task.id}','${date}')">
          ${task.done ? '✓' : ''}
        </div>
        <div class="task-body">
          <span class="task-type-dot" style="background:${color}"></span>
          <span class="task-label">${icon} ${task.label}</span>
          ${task.detail ? `<span class="task-detail">${task.detail}</span>` : ''}
        </div>
        ${UI.subjectPill(task.subject)}
      </div>
    `;
  };

  // ── Toggle task done ─────────────────────────────────────
  const toggleTask = (taskId, date) => {
    Store.completeTask(date, taskId);
    // Refresh today tasks section
    const tasks = Store.getTasks(date);
    const task  = tasks.find(t => t.id === taskId);
    // Update streak if any task done today
    if (task && task.done) {
      Store.updateStreak();
      // If it was a revision, mark it done
      if (task.type === 'revision' && task.topicId) {
        Store.markRevisionDone(task.topicId);
        UI.toast(`Revision marked! Next scheduled.`, 'success');
      }
    }
    App.navigate('dashboard'); // re-render
  };

  return { render, renderTaskCard, toggleTask, renderRing };
})();
