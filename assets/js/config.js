// ============================================================
// config.js — CAT 2026 Syllabus Configuration & Constants
// Based on Elites Grid Course 2026
// ============================================================

const CAT_DATE = '2026-11-29'; // CAT 2026 exam date

// Spaced repetition intervals (days after completion)
const REVISION_INTERVALS_NORMAL = [1, 3, 7, 15, 30];
const REVISION_INTERVALS_WEAK   = [1, 2, 4, 7, 15, 30];  // more frequent
const REVISION_INTERVALS_STRONG = [3, 7, 21, 60];          // less frequent

const MAX_DAILY_TASKS = 7;
const DEFAULT_DAILY_STUDY_HOURS = 5;

const DIFFICULTY = { EASY: 'Easy', MEDIUM: 'Medium', HARD: 'Hard' };
const STRENGTH   = { WEAK: 'weak', NORMAL: 'normal', STRONG: 'strong' };
const STATUS     = { NOT_STARTED: 'Not Started', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed' };

const SUBJECT_META = {
  VARC: {
    name: 'Verbal Ability & Reading Comprehension',
    shortName: 'VARC',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.12)',
    icon: '📖',
  },
  LRDI: {
    name: 'Logical Reasoning & Data Interpretation',
    shortName: 'LRDI',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.12)',
    icon: '🧩',
  },
  Quant: {
    name: 'Quantitative Aptitude',
    shortName: 'Quant',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
    icon: '🔢',
  },
};

// ── Elites Grid 2026 Topic Roster ──────────────────────────
const SUBJECTS_CONFIG = {
  VARC: {
    ...SUBJECT_META.VARC,
    topics: [
      { id: 'rc-strategy',      name: 'RC — Strategy & Foundations',       defaultLectures: 10, defaultTests: 5  },
      { id: 'rc-practice',      name: 'RC — Advanced Practice (EG Sets)',   defaultLectures: 20, defaultTests: 20 },
      { id: 'va-para-jumbles',  name: 'Para Jumbles',                       defaultLectures: 8,  defaultTests: 10 },
      { id: 'va-odd-sentence',  name: 'Odd Sentence Out',                   defaultLectures: 6,  defaultTests: 8  },
      { id: 'va-para-summary',  name: 'Para Summary / Completion',          defaultLectures: 6,  defaultTests: 8  },
      { id: 'va-fill-blanks',   name: 'Fill in the Blanks / WK',            defaultLectures: 5,  defaultTests: 6  },
      { id: 'cr-reasoning',     name: 'Critical Reasoning',                 defaultLectures: 8,  defaultTests: 6  },
      { id: 'varc-1000',        name: 'VARC 1000 by Gejo (Gejo RC Series)', defaultLectures: 0,  defaultTests: 50 },
    ],
  },
  LRDI: {
    ...SUBJECT_META.LRDI,
    topics: [
      { id: 'lr-linear',        name: 'Linear Arrangements',                defaultLectures: 8,  defaultTests: 10 },
      { id: 'lr-circular',      name: 'Circular Arrangements',              defaultLectures: 6,  defaultTests: 8  },
      { id: 'lr-puzzles',       name: 'Complex Puzzles',                    defaultLectures: 10, defaultTests: 12 },
      { id: 'lr-games-tourney', name: 'Games & Tournaments',                defaultLectures: 8,  defaultTests: 10 },
      { id: 'lr-scheduling',    name: 'Scheduling & Timetables',            defaultLectures: 6,  defaultTests: 8  },
      { id: 'lr-networks',      name: 'Routes & Networks',                  defaultLectures: 5,  defaultTests: 6  },
      { id: 'lr-binary',        name: 'Binary Logic / Truth-Liars',         defaultLectures: 5,  defaultTests: 6  },
      { id: 'di-tables',        name: 'DI — Tables & Matrices',             defaultLectures: 8,  defaultTests: 10 },
      { id: 'di-bar-line',      name: 'DI — Bar & Line Charts',             defaultLectures: 6,  defaultTests: 8  },
      { id: 'di-pie',           name: 'DI — Pie / Radar Charts',            defaultLectures: 5,  defaultTests: 6  },
      { id: 'di-caselets',      name: 'DI — Caselets',                      defaultLectures: 8,  defaultTests: 10 },
      { id: 'di-mixed',         name: 'DI — Mixed / CAT-Style Sets',        defaultLectures: 6,  defaultTests: 8  },
    ],
  },
  Quant: {
    ...SUBJECT_META.Quant,
    topics: [
      { id: 'q-number-sys',     name: 'Number System',                      defaultLectures: 18, defaultTests: 12 },
      { id: 'q-ratio-percent',  name: 'Ratio, Proportion & Percentage',     defaultLectures: 12, defaultTests: 10 },
      { id: 'q-pnl',            name: 'Profit, Loss & Discount',            defaultLectures: 8,  defaultTests: 8  },
      { id: 'q-time-work',      name: 'Time & Work / Pipes',                defaultLectures: 8,  defaultTests: 8  },
      { id: 'q-tsd',            name: 'Time, Speed & Distance',             defaultLectures: 10, defaultTests: 10 },
      { id: 'q-averages-mix',   name: 'Averages, Mixtures & Alligation',    defaultLectures: 6,  defaultTests: 6  },
      { id: 'q-si-ci',          name: 'Simple & Compound Interest',         defaultLectures: 5,  defaultTests: 5  },
      { id: 'q-algebra',        name: 'Algebra (Eqns & Inequalities)',      defaultLectures: 15, defaultTests: 12 },
      { id: 'q-functions',      name: 'Functions & Graphs',                 defaultLectures: 8,  defaultTests: 8  },
      { id: 'q-geometry',       name: 'Geometry — Lines & Triangles',       defaultLectures: 12, defaultTests: 10 },
      { id: 'q-circles',        name: 'Geometry — Circles & Polygons',      defaultLectures: 8,  defaultTests: 8  },
      { id: 'q-mensuration',    name: 'Mensuration (2D & 3D)',              defaultLectures: 8,  defaultTests: 8  },
      { id: 'q-coordinate',     name: 'Coordinate Geometry',                defaultLectures: 6,  defaultTests: 6  },
      { id: 'q-pnc',            name: 'Permutation & Combination',          defaultLectures: 10, defaultTests: 10 },
      { id: 'q-probability',    name: 'Probability',                        defaultLectures: 8,  defaultTests: 8  },
      { id: 'q-progressions',   name: 'Progressions (AP, GP, HP)',          defaultLectures: 8,  defaultTests: 8  },
      { id: 'q-logs-surds',     name: 'Logarithms & Surds / Indices',       defaultLectures: 6,  defaultTests: 6  },
      { id: 'q-set-theory',     name: 'Set Theory & Venn Diagrams',         defaultLectures: 5,  defaultTests: 5  },
    ],
  },
};
