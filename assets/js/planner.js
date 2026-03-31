// ============================================================
// planner.js — Intelligent Study Plan Generator
// Generates daily/weekly tasks with smart load balancing
// ============================================================

const Planner = (() => {

  // ── Task Factory ─────────────────────────────────────────
  const makeTask = (type, topicId, subject, label, detail = '') => ({
    id: `${type}_${topicId}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    type,        // 'lecture' | 'test' | 'revision' | 'mock' | 'analysis' | 'practice'
    topicId,
    subject,
    label,
    detail,
    done: false,
    doneAt: null,
  });

  // ── Generate tasks for a specific date ─────────────────
  const generateDayTasks = (dateStr) => {
    const existing = Store.getTasks(dateStr);
    // Don't regenerate if already has tasks (preserve manual edits)
    if (existing.length > 0) return existing;

    const tasks = [];
    const today = Store.todayStr();
    const allTopics = Object.values(Store.getTopics());
    const mocks = Store.getMocks();
    const settings = Store.getSettings();

    // 1. Mock / Analysis tasks
    const mockOnDate = mocks.find(m => m.date === dateStr);
    if (mockOnDate) {
      tasks.push(makeTask('mock', mockOnDate.id, 'ALL',
        `📝 ${mockOnDate.name}`, `Full mock — ${mockOnDate.provider || 'CL/IMS'}`));
    }
    // Analysis day = day after mock
    const prevDate = Store.addDays(dateStr, -1);
    const mockYesterday = mocks.find(m => m.date === prevDate && m.attempted);
    if (mockYesterday && !mockYesterday.analysed) {
      tasks.push(makeTask('analysis', mockYesterday.id, 'ALL',
        `🔍 Mock Analysis: ${mockYesterday.name}`, 'Go through each section, log errors'));
    }

    if (tasks.length >= MAX_DAILY_TASKS) return finalize(dateStr, tasks);

    // 2. Spaced revision tasks (highest priority after mocks)
    const revisionsDue = Store.getRevisionsDue(dateStr);
    // Sort: weakest topics first
    revisionsDue.sort((a, b) => {
      const w = { weak: 0, normal: 1, strong: 2 };
      return (w[a.strength] || 1) - (w[b.strength] || 1);
    });
    for (const t of revisionsDue) {
      if (tasks.length >= MAX_DAILY_TASKS) break;
      tasks.push(makeTask('revision', t.id, t.subject,
        `🔁 Revise: ${t.name}`, `Strength: ${t.strength}`));
    }

    if (tasks.length >= MAX_DAILY_TASKS) return finalize(dateStr, tasks);

    // 3. In-progress topics — pending lectures
    const inProgress = allTopics
      .filter(t => t.status === STATUS.IN_PROGRESS)
      .sort((a, b) => {
        // Prioritize topics closer to completion
        const pctA = (a.completedLectures + a.completedTests) / Math.max(a.totalLectures + a.totalTests, 1);
        const pctB = (b.completedLectures + b.completedTests) / Math.max(b.totalLectures + b.totalTests, 1);
        return pctB - pctA;
      });

    for (const t of inProgress) {
      if (tasks.length >= MAX_DAILY_TASKS) break;
      if (t.completedLectures < t.totalLectures) {
        const rem = t.totalLectures - t.completedLectures;
        tasks.push(makeTask('lecture', t.id, t.subject,
          `🎬 ${t.name}`, `${rem} lecture(s) remaining`));
      } else if (t.completedTests < t.totalTests) {
        const rem = t.totalTests - t.completedTests;
        tasks.push(makeTask('test', t.id, t.subject,
          `✅ Test: ${t.name}`, `${rem} test(s) remaining`));
      }
    }

    if (tasks.length >= MAX_DAILY_TASKS) return finalize(dateStr, tasks);

    // 4. New topics to start (rotate through subjects)
    const notStarted = allTopics.filter(t => t.status === STATUS.NOT_STARTED);
    // Pick from different subjects to ensure balance
    const subjectCounts = { VARC: 0, LRDI: 0, Quant: 0 };
    tasks.forEach(t => { if (t.subject && subjectCounts[t.subject] !== undefined) subjectCounts[t.subject]++; });
    // Prioritize subject with fewest tasks today
    const sortedSubjects = Object.entries(subjectCounts)
      .sort((a, b) => a[1] - b[1])
      .map(e => e[0]);

    for (const subj of sortedSubjects) {
      if (tasks.length >= MAX_DAILY_TASKS) break;
      const nextTopic = notStarted.find(t => t.subject === subj);
      if (nextTopic) {
        tasks.push(makeTask('lecture', nextTopic.id, nextTopic.subject,
          `🆕 Start: ${nextTopic.name}`, `New topic — ${nextTopic.totalLectures} lectures`));
      }
    }

    // 5. Practice tasks if slots remain
    if (tasks.length < MAX_DAILY_TASKS) {
      const practiceTopics = allTopics
        .filter(t => t.status === STATUS.COMPLETED && t.strength !== STRENGTH.STRONG)
        .slice(0, MAX_DAILY_TASKS - tasks.length);
      for (const t of practiceTopics) {
        if (tasks.length >= MAX_DAILY_TASKS) break;
        tasks.push(makeTask('practice', t.id, t.subject,
          `📌 Practice: ${t.name}`, 'Extra questions / puzzles'));
      }
    }

    return finalize(dateStr, tasks);
  };

  const finalize = (dateStr, tasks) => {
    Store.setTasks(dateStr, tasks);
    return tasks;
  };

  // ── Generate Weekly Plan ────────────────────────────────
  const generateWeeklyPlan = (startDateStr) => {
    const plan = {};
    for (let i = 0; i < 7; i++) {
      const date = Store.addDays(startDateStr, i);
      plan[date] = generateDayTasks(date);
    }
    return plan;
  };

  // ── Backlog Detection ───────────────────────────────────
  // Scans past days for incomplete tasks and moves them to backlog
  const detectAndMoveToBacklog = () => {
    const today = Store.todayStr();
    const allTasks = Store.getAllTasks();
    let count = 0;

    Object.entries(allTasks).forEach(([date, tasks]) => {
      if (date >= today) return; // only past dates
      tasks.forEach(task => {
        if (!task.done) {
          Store.addToBacklog({ ...task, originalDate: date });
          task.missed = true;
          count++;
        }
      });
      // Mark all as processed (set done=true so we don't double-count)
      const updated = tasks.map(t => ({ ...t, done: t.done || true, missed: !t.done }));
      Store.setTasks(date, updated);
    });

    return count;
  };

  // ── Redistribute Backlog ────────────────────────────────
  // Spreads backlog tasks over the next N days without overloading
  const redistributeBacklog = () => {
    const backlog = Store.getBacklog();
    if (!backlog.length) return 0;
    const today = Store.todayStr();
    let dayOffset = 1;
    let distributed = 0;

    backlog.forEach(task => {
      // Find a day that isn't full
      let placed = false;
      for (let attempt = 0; attempt < 30; attempt++) {
        const date = Store.addDays(today, dayOffset + attempt);
        const tasks = Store.getTasks(date);
        if (tasks.length < MAX_DAILY_TASKS) {
          const newTask = { ...task, id: task.id + '_bl', backlog: true, originalDate: task.originalDate };
          tasks.push(newTask);
          Store.setTasks(date, tasks);
          Store.removeFromBacklog(task.id);
          distributed++;
          dayOffset = Math.max(dayOffset, attempt + 1);
          placed = true;
          break;
        }
        dayOffset++;
      }
    });

    return distributed;
  };

  // ── Roadmap Estimation ──────────────────────────────────
  const getRoadmap = () => {
    const topics = Object.values(Store.getTopics());
    const settings = Store.getSettings();
    const today = Store.todayStr();
    const catDate = settings.catDate || CAT_DATE;
    const daysLeft = Math.ceil((new Date(catDate) - new Date(today)) / 86400000);

    const notDone    = topics.filter(t => t.status !== STATUS.COMPLETED).length;
    const completed  = topics.filter(t => t.status === STATUS.COMPLETED).length;
    const totalTopics= topics.length;
    const pct        = Math.round((completed / totalTopics) * 100);

    // Avg completion rate: topics completed per week
    const weeksSinceStart = Math.max(1, (new Date() - new Date('2026-01-01')) / (7 * 86400000));
    const completionRate  = completed / weeksSinceStart; // topics/week
    const weeksNeeded     = completionRate > 0 ? Math.ceil(notDone / completionRate) : notDone * 2;
    const estCompletionDate = Store.addDays(today, weeksNeeded * 7);

    // Recommended daily topics
    const daysForStudy = Math.max(1, daysLeft - 30); // last 30 days = full revision
    const topicsPerDay = (notDone / daysForStudy).toFixed(2);

    return {
      today, catDate, daysLeft,
      totalTopics, completed, notDone, pct,
      completionRate: completionRate.toFixed(1),
      estCompletionDate,
      topicsPerDay,
      onTrack: estCompletionDate <= Store.addDays(catDate, -30),
      weeksNeeded,
    };
  };

  // ── Today's Summary ─────────────────────────────────────
  const getTodaySummary = () => {
    const today = Store.todayStr();
    const tasks  = generateDayTasks(today);
    const done   = tasks.filter(t => t.done).length;
    const total  = tasks.length;
    const revs   = tasks.filter(t => t.type === 'revision').length;
    const lectures= tasks.filter(t => t.type === 'lecture').length;
    return { tasks, done, total, revs, lectures, pct: total ? Math.round((done/total)*100) : 0 };
  };

  return {
    generateDayTasks,
    generateWeeklyPlan,
    detectAndMoveToBacklog,
    redistributeBacklog,
    getRoadmap,
    getTodaySummary,
    makeTask,
  };
})();
