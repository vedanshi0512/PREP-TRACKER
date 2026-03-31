// ============================================================
// store.js — Persistent Data Layer (localStorage)
// All reads/writes to localStorage happen here
// ============================================================

const Store = (() => {
  const KEYS = {
    TOPICS:   'cat26_topics',
    TASKS:    'cat26_tasks',
    MOCKS:    'cat26_mocks',
    BACKLOG:  'cat26_backlog',
    STREAK:   'cat26_streak',
    SETTINGS: 'cat26_settings',
    REVISIONS:'cat26_revisions',
  };

  // ── Helpers ─────────────────────────────────────────────
  const get = (key, fallback = null) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  };
  const set = (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { console.error(e); }
  };

  // ── Topic Initialization ─────────────────────────────────
  const initTopics = () => {
    const existing = get(KEYS.TOPICS, {});
    Object.entries(SUBJECTS_CONFIG).forEach(([subject, subData]) => {
      subData.topics.forEach(t => {
        if (!existing[t.id]) {
          existing[t.id] = {
            id: t.id,
            subject,
            name: t.name,
            totalLectures: t.defaultLectures,
            completedLectures: 0,
            totalTests: t.defaultTests,
            completedTests: 0,
            practiceQs: 0,
            status: STATUS.NOT_STARTED,
            lastStudied: null,
            completedDate: null,
            difficulty: DIFFICULTY.MEDIUM,
            strength: STRENGTH.NORMAL,
            notes: '',
            revisionsDone: [],   // array of {date, interval}
            nextRevision: null,
          };
        }
      });
    });
    set(KEYS.TOPICS, existing);
    return existing;
  };

  // ── Topics CRUD ─────────────────────────────────────────
  const getTopics = () => get(KEYS.TOPICS, {});
  const getTopic  = (id) => getTopics()[id] || null;

  const updateTopic = (id, updates) => {
    const topics = getTopics();
    if (!topics[id]) return;
    topics[id] = { ...topics[id], ...updates };
    // Auto-compute status
    const t = topics[id];
    if (t.completedLectures === 0 && t.completedTests === 0) {
      t.status = STATUS.NOT_STARTED;
    } else if (
      t.completedLectures >= t.totalLectures &&
      t.completedTests >= t.totalTests
    ) {
      t.status = STATUS.COMPLETED;
      if (!t.completedDate) {
        t.completedDate = todayStr();
        // Schedule first revision
        t.nextRevision = addDays(todayStr(), getRevisionIntervals(t)[0]);
      }
    } else {
      t.status = STATUS.IN_PROGRESS;
    }
    t.lastStudied = todayStr();
    set(KEYS.TOPICS, topics);
    return topics[id];
  };

  const getTopicsBySubject = (subject) => {
    const topics = getTopics();
    return Object.values(topics).filter(t => t.subject === subject);
  };

  // ── Revision Intervals ──────────────────────────────────
  const getRevisionIntervals = (topic) => {
    if (topic.strength === STRENGTH.WEAK)   return REVISION_INTERVALS_WEAK;
    if (topic.strength === STRENGTH.STRONG) return REVISION_INTERVALS_STRONG;
    return REVISION_INTERVALS_NORMAL;
  };

  // ── Revision Scheduling ─────────────────────────────────
  const markRevisionDone = (topicId, date = todayStr()) => {
    const topics = getTopics();
    const t = topics[topicId];
    if (!t) return;
    const intervals = getRevisionIntervals(t);
    const doneCount = t.revisionsDone.length;
    t.revisionsDone.push({ date, interval: intervals[doneCount] || 30 });
    // Schedule next revision
    const nextIdx = doneCount + 1;
    if (nextIdx < intervals.length) {
      t.nextRevision = addDays(date, intervals[nextIdx]);
    } else {
      // Repeat last interval indefinitely
      t.nextRevision = addDays(date, intervals[intervals.length - 1]);
    }
    t.lastStudied = date;
    set(KEYS.TOPICS, topics);
    return topics[topicId];
  };

  // Revisions due on a given date
  const getRevisionsDue = (date = todayStr()) => {
    const topics = getTopics();
    return Object.values(topics).filter(t =>
      t.status === STATUS.COMPLETED &&
      t.nextRevision &&
      t.nextRevision <= date
    );
  };

  // ── Tasks ────────────────────────────────────────────────
  // Tasks are stored per date: { '2026-01-01': [task, ...] }
  const getTasks = (date) => {
    const all = get(KEYS.TASKS, {});
    return all[date] || [];
  };
  const setTasks = (date, tasks) => {
    const all = get(KEYS.TASKS, {});
    all[date] = tasks;
    set(KEYS.TASKS, all);
  };
  const getAllTasks = () => get(KEYS.TASKS, {});
  const completeTask = (date, taskId) => {
    const all = get(KEYS.TASKS, {});
    const tasks = all[date] || [];
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.done = true;
      task.doneAt = new Date().toISOString();
    }
    all[date] = tasks;
    set(KEYS.TASKS, all);
    return task;
  };

  // ── Backlog ──────────────────────────────────────────────
  const getBacklog = () => get(KEYS.BACKLOG, []);
  const setBacklog = (items) => set(KEYS.BACKLOG, items);
  const addToBacklog = (task) => {
    const bl = getBacklog();
    if (!bl.find(t => t.id === task.id)) bl.push({ ...task, backloggedAt: todayStr() });
    setBacklog(bl);
  };
  const removeFromBacklog = (taskId) => {
    const bl = getBacklog().filter(t => t.id !== taskId);
    setBacklog(bl);
  };

  // ── Mock Tests ───────────────────────────────────────────
  const getMocks = () => get(KEYS.MOCKS, []);
  const setMocks = (mocks) => set(KEYS.MOCKS, mocks);
  const addMock = (mock) => {
    const mocks = getMocks();
    mock.id = mock.id || `mock_${Date.now()}`;
    mocks.push(mock);
    mocks.sort((a, b) => a.date.localeCompare(b.date));
    setMocks(mocks);
    return mock;
  };
  const updateMock = (id, updates) => {
    const mocks = getMocks();
    const idx = mocks.findIndex(m => m.id === id);
    if (idx > -1) { mocks[idx] = { ...mocks[idx], ...updates }; setMocks(mocks); }
  };
  const deleteMock = (id) => setMocks(getMocks().filter(m => m.id !== id));

  // ── Streak ───────────────────────────────────────────────
  const getStreak = () => get(KEYS.STREAK, { current: 0, best: 0, lastDate: null });
  const updateStreak = () => {
    const s = getStreak();
    const today = todayStr();
    const yesterday = addDays(today, -1);
    if (s.lastDate === today) return s;
    if (s.lastDate === yesterday) { s.current += 1; }
    else { s.current = 1; }
    s.best = Math.max(s.best, s.current);
    s.lastDate = today;
    set(KEYS.STREAK, s);
    return s;
  };

  // ── Settings ─────────────────────────────────────────────
  const getSettings = () => get(KEYS.SETTINGS, {
    dailyHours: DEFAULT_DAILY_STUDY_HOURS,
    theme: 'dark',
    mockDay: 'Sunday',
    catDate: CAT_DATE,
    onboardingDone: false,
  });
  const updateSettings = (updates) => {
    const s = { ...getSettings(), ...updates };
    set(KEYS.SETTINGS, s);
    return s;
  };

  // ── Stats helpers ────────────────────────────────────────
  const getOverallProgress = () => {
    const topics = Object.values(getTopics());
    const total = topics.length;
    const done  = topics.filter(t => t.status === STATUS.COMPLETED).length;
    const inProg= topics.filter(t => t.status === STATUS.IN_PROGRESS).length;
    const lectDone = topics.reduce((s, t) => s + t.completedLectures, 0);
    const lectTotal= topics.reduce((s, t) => s + t.totalLectures, 0);
    const testDone = topics.reduce((s, t) => s + t.completedTests, 0);
    const testTotal= topics.reduce((s, t) => s + t.totalTests, 0);
    return { total, done, inProg, lectDone, lectTotal, testDone, testTotal,
      pct: total ? Math.round((done / total) * 100) : 0 };
  };

  const getSubjectProgress = (subject) => {
    const topics = getTopicsBySubject(subject);
    const done  = topics.filter(t => t.status === STATUS.COMPLETED).length;
    return { total: topics.length, done, pct: topics.length ? Math.round((done / topics.length) * 100) : 0 };
  };

  // ── Export / Import ──────────────────────────────────────
  const exportData = () => {
    const data = {};
    Object.values(KEYS).forEach(k => { data[k] = get(k); });
    return JSON.stringify(data, null, 2);
  };
  const importData = (jsonStr) => {
    try {
      const data = JSON.parse(jsonStr);
      Object.entries(data).forEach(([k, v]) => { if (v !== null) set(k, v); });
      return true;
    } catch { return false; }
  };

  // ── Date helpers ─────────────────────────────────────────
  const todayStr = () => new Date().toISOString().split('T')[0];
  const addDays = (dateStr, n) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  };

  // ── Init ─────────────────────────────────────────────────
  const init = () => {
    initTopics();
    console.log('[Store] Initialized');
  };

  return {
    init,
    getTopics, getTopic, updateTopic, getTopicsBySubject, initTopics,
    getRevisionIntervals, markRevisionDone, getRevisionsDue,
    getTasks, setTasks, getAllTasks, completeTask,
    getBacklog, setBacklog, addToBacklog, removeFromBacklog,
    getMocks, addMock, updateMock, deleteMock,
    getStreak, updateStreak,
    getSettings, updateSettings,
    getOverallProgress, getSubjectProgress,
    exportData, importData,
    todayStr, addDays,
  };
})();
