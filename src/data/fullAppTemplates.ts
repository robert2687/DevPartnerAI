export interface FullAppTemplate {
  id: string;
  name: string;
  category: 'Frontend SPA' | 'Full-Stack' | 'Productivity' | 'E-Commerce' | 'Utility';
  badge: string;
  description: string;
  highlights: string[];
  files: {
    filename: string;
    language: string;
    code: string;
  }[];
}

export const FULL_APP_TEMPLATES: FullAppTemplate[] = [
  {
    id: 'saas-analytics-dashboard',
    name: 'SaaS Analytics & Operations Dashboard',
    category: 'Frontend SPA',
    badge: 'Production Ready',
    description: 'Complete multi-metric operational dashboard with real-time KPI counters, revenue analytics, customer transaction tables, status badges, and interactive date filtering.',
    highlights: ['Interactive KPI cards', 'Dynamic customer transactions table', 'Status filters & search', 'Tailwind responsive dark UI'],
    files: [
      {
        filename: 'index.html',
        language: 'html',
        code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PulseMetrics - Enterprise SaaS Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body class="bg-neutral-950 text-neutral-100 min-h-screen font-sans flex flex-col">
  <!-- Top Navigation -->
  <header class="border-b border-neutral-800 bg-neutral-900/80 backdrop-blur px-6 py-3 flex items-center justify-between sticky top-0 z-20">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center font-bold text-neutral-950 shadow-md">
        P
      </div>
      <div>
        <h1 class="text-sm font-bold tracking-tight text-white">PulseMetrics Cloud</h1>
        <p class="text-[10px] text-neutral-400 font-mono">v2.4.0 · Production</p>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <div class="relative">
        <input
          id="search-input"
          type="text"
          placeholder="Search metrics, users, invoices..."
          class="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-sky-500 w-48 sm:w-64"
        />
      </div>
      <button id="refresh-btn" class="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition-colors flex items-center gap-1.5">
        <span>🔄 Refresh</span>
      </button>
      <button class="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-xs font-semibold text-neutral-950 transition-all shadow-sm">
        + New Report
      </button>
    </div>
  </header>

  <!-- Main Content Dashboard -->
  <main class="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
    <!-- KPI Metrics Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 shadow-sm hover:border-neutral-700 transition-all">
        <div class="flex items-center justify-between text-neutral-400 text-xs mb-1">
          <span>Monthly Recurring Revenue</span>
          <span class="text-emerald-400 font-mono font-medium">+14.2%</span>
        </div>
        <div class="text-2xl font-bold text-white tracking-tight" id="mrr-val">$128,450</div>
        <div class="text-[11px] text-neutral-500 mt-1">vs $112,500 last month</div>
      </div>

      <div class="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 shadow-sm hover:border-neutral-700 transition-all">
        <div class="flex items-center justify-between text-neutral-400 text-xs mb-1">
          <span>Active Subscriptions</span>
          <span class="text-emerald-400 font-mono font-medium">+8.1%</span>
        </div>
        <div class="text-2xl font-bold text-white tracking-tight" id="subs-val">1,842</div>
        <div class="text-[11px] text-neutral-500 mt-1">84 new enterprise logos</div>
      </div>

      <div class="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 shadow-sm hover:border-neutral-700 transition-all">
        <div class="flex items-center justify-between text-neutral-400 text-xs mb-1">
          <span>API Requests (24h)</span>
          <span class="text-sky-400 font-mono font-medium">99.98%</span>
        </div>
        <div class="text-2xl font-bold text-white tracking-tight" id="api-val">4.2M</div>
        <div class="text-[11px] text-neutral-500 mt-1">Avg latency: 42ms</div>
      </div>

      <div class="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 shadow-sm hover:border-neutral-700 transition-all">
        <div class="flex items-center justify-between text-neutral-400 text-xs mb-1">
          <span>Net Revenue Retention</span>
          <span class="text-emerald-400 font-mono font-medium">Healthy</span>
        </div>
        <div class="text-2xl font-bold text-white tracking-tight" id="nrr-val">118.4%</div>
        <div class="text-[11px] text-neutral-500 mt-1">Industry benchmark: 105%</div>
      </div>
    </div>

    <!-- Analytics Chart & Live Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 p-5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-sm font-semibold text-white">Revenue Ingestion Trajectory</h2>
            <p class="text-xs text-neutral-400">Trailing 7 days real-time aggregate volume</p>
          </div>
          <div class="flex items-center gap-1 p-0.5 rounded bg-neutral-950 border border-neutral-800 text-xs">
            <button class="px-2.5 py-1 rounded bg-neutral-800 text-white font-medium">Daily</button>
            <button class="px-2.5 py-1 rounded text-neutral-400 hover:text-white">Weekly</button>
            <button class="px-2.5 py-1 rounded text-neutral-400 hover:text-white">Monthly</button>
          </div>
        </div>

        <!-- Simulated Bar Chart -->
        <div class="h-44 flex items-end justify-between gap-3 pt-4 px-2" id="chart-bars">
          <!-- Populated by script.js -->
        </div>
      </div>

      <!-- Real-Time System Log -->
      <div class="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800 flex flex-col space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold text-white">System Events</h2>
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
        <div class="flex-1 space-y-2.5 overflow-y-auto max-h-52 text-xs font-mono text-neutral-300" id="events-list">
          <!-- Populated by script.js -->
        </div>
      </div>
    </div>

    <!-- Recent Transactions Table -->
    <div class="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-sm font-semibold text-white">Recent Transactions & Workflows</h2>
          <p class="text-xs text-neutral-400">Live feed of payments, webhook triggers, and tier changes</p>
        </div>
        <div class="flex items-center gap-2">
          <button id="filter-all" class="px-2.5 py-1 text-xs rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 font-medium">All</button>
          <button id="filter-completed" class="px-2.5 py-1 text-xs rounded bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white">Completed</button>
          <button id="filter-pending" class="px-2.5 py-1 text-xs rounded bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white">Pending</button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead>
            <tr class="border-b border-neutral-800 text-neutral-400 font-medium">
              <th class="py-2.5 px-3">Transaction ID</th>
              <th class="py-2.5 px-3">Customer</th>
              <th class="py-2.5 px-3">Plan</th>
              <th class="py-2.5 px-3">Amount</th>
              <th class="py-2.5 px-3">Status</th>
              <th class="py-2.5 px-3">Date</th>
            </tr>
          </thead>
          <tbody id="transactions-body" class="divide-y divide-neutral-800/60">
            <!-- Populated by script.js -->
          </tbody>
        </table>
      </div>
    </div>
  </main>

  <footer class="border-t border-neutral-800 py-4 px-6 text-center text-xs text-neutral-500">
    PulseMetrics Cloud Dashboard · Engineered with DevPartner AI
  </footer>

  <script src="script.js"></script>
</body>
</html>`,
      },
      {
        filename: 'style.css',
        language: 'css',
        code: `/* PulseMetrics Custom Styling & Keyframes */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.25s ease-out forwards;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #0a0a0a;
}

::-webkit-scrollbar-thumb {
  background: #262626;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #404040;
}`,
      },
      {
        filename: 'script.js',
        language: 'javascript',
        code: `// PulseMetrics Dashboard Logic
const transactionsData = [
  { id: 'TX-9041', customer: 'Acme Global Corp', plan: 'Enterprise Pro', amount: '$4,200.00', status: 'Completed', date: 'Just now' },
  { id: 'TX-9040', customer: 'Starlight Labs Inc', plan: 'Growth Tier', amount: '$850.00', status: 'Completed', date: '12 mins ago' },
  { id: 'TX-9039', customer: 'Nexus Robotics', plan: 'Enterprise Pro', amount: '$12,500.00', status: 'Completed', date: '45 mins ago' },
  { id: 'TX-9038', customer: 'Vortex Cloud Tech', plan: 'Scale Tier', amount: '$1,950.00', status: 'Pending', date: '1 hour ago' },
  { id: 'TX-9037', customer: 'Hyperion Bio Ltd', plan: 'Growth Tier', amount: '$850.00', status: 'Completed', date: '3 hours ago' },
  { id: 'TX-9036', customer: 'Quantum Dynamics', plan: 'Enterprise Custom', amount: '$8,400.00', status: 'Completed', date: '5 hours ago' }
];

const chartDays = [
  { day: 'Mon', val: 65, amount: '$18.2k' },
  { day: 'Tue', val: 78, amount: '$22.4k' },
  { day: 'Wed', val: 55, amount: '$15.8k' },
  { day: 'Thu', val: 92, amount: '$28.1k' },
  { day: 'Fri', val: 84, amount: '$25.0k' },
  { day: 'Sat', val: 40, amount: '$11.2k' },
  { day: 'Sun', val: 70, amount: '$19.5k' }
];

const systemEvents = [
  { text: 'Billing webhook received from Stripe: $4,200', time: '12:44:02' },
  { text: 'SSL certificate automatically rotated for api.pulse.io', time: '12:30:15' },
  { text: 'New worker pod spun up in us-east-1 (load: 78%)', time: '12:15:00' },
  { text: 'Automated database snapshot created (2.4 GB)', time: '11:58:33' }
];

function renderTable(filter = 'all') {
  const tbody = document.getElementById('transactions-body');
  if (!tbody) return;

  const filtered = transactionsData.filter(tx => {
    if (filter === 'completed') return tx.status === 'Completed';
    if (filter === 'pending') return tx.status === 'Pending';
    return true;
  });

  tbody.innerHTML = filtered.map(tx => \`
    <tr class="hover:bg-neutral-900/40 transition-colors animate-fade-in">
      <td class="py-2.5 px-3 font-mono text-sky-400">\${tx.id}</td>
      <td class="py-2.5 px-3 font-medium text-white">\${tx.customer}</td>
      <td class="py-2.5 px-3 text-neutral-300">\${tx.plan}</td>
      <td class="py-2.5 px-3 font-mono font-semibold text-white">\${tx.amount}</td>
      <td class="py-2.5 px-3">
        <span class="px-2 py-0.5 rounded text-[10px] font-semibold \${
          tx.status === 'Completed'
            ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60'
            : 'bg-amber-950/70 text-amber-400 border border-amber-800/60'
        }">
          \${tx.status}
        </span>
      </td>
      <td class="py-2.5 px-3 text-neutral-400 font-mono text-[11px]">\${tx.date}</td>
    </tr>
  \`).join('');
}

function renderChart() {
  const container = document.getElementById('chart-bars');
  if (!container) return;

  container.innerHTML = chartDays.map(item => \`
    <div class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
      <div class="text-[10px] text-neutral-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">\${item.amount}</div>
      <div
        class="w-full bg-neutral-800 group-hover:bg-sky-500 rounded-t transition-all duration-300 shadow-sm"
        style="height: \${item.val}%"
      ></div>
      <div class="text-[11px] text-neutral-500 font-mono mt-1">\${item.day}</div>
    </div>
  \`).join('');
}

function renderEvents() {
  const container = document.getElementById('events-list');
  if (!container) return;

  container.innerHTML = systemEvents.map(ev => \`
    <div class="p-2 rounded bg-neutral-950 border border-neutral-850 flex items-start justify-between gap-2">
      <span class="flex-1 text-neutral-300">\${ev.text}</span>
      <span class="text-[10px] text-neutral-500 shrink-0 tabular-nums">\${ev.time}</span>
    </div>
  \`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderTable();
  renderChart();
  renderEvents();

  // Filters
  document.getElementById('filter-all')?.addEventListener('click', () => renderTable('all'));
  document.getElementById('filter-completed')?.addEventListener('click', () => renderTable('completed'));
  document.getElementById('filter-pending')?.addEventListener('click', () => renderTable('pending'));

  // Refresh
  document.getElementById('refresh-btn')?.addEventListener('click', () => {
    console.log('Refreshing PulseMetrics telemetry streams...');
    renderTable();
    renderChart();
  });
});`,
      },
      {
        filename: 'package.json',
        language: 'json',
        code: `{
  "name": "pulse-metrics-dashboard",
  "version": "1.0.0",
  "description": "Production SaaS Analytics Dashboard built with DevPartner AI",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "lucide-react": "^1.16.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0",
    "vite": "^5.2.0"
  }
}`,
      },
      {
        filename: 'README.md',
        language: 'markdown',
        code: `# PulseMetrics - Enterprise Analytics Dashboard

A modern, responsive SaaS analytics and operations dashboard built with clean semantic HTML, modular CSS, Tailwind CSS utilities, and Vanilla JavaScript.

## Architecture
- \`index.html\`: Semantic layout with responsive KPI metrics cards, trajectory charts, and transactions table.
- \`style.css\`: Theme overrides, animations, and custom scrollbar styling.
- \`script.js\`: Reactive state handling for filtering transactions and rendering telemetry events.
- \`package.json\`: Build scripts and dependencies.

Generated with DevPartner AI.`,
      },
    ],
  },
  {
    id: 'kanban-project-manager',
    name: 'Kanban Sprint Board & Task Orchestrator',
    category: 'Productivity',
    badge: 'Interactive SPA',
    description: 'Dynamic Kanban project management board with drag-and-drop workflow stages, task creation modal, priority tags, assignees, and persistent localStorage sync.',
    highlights: ['Multi-column workflow (Backlog, In Progress, Review, Done)', 'New task creator modal', 'Tagging & priority filters', 'Instant live preview'],
    files: [
      {
        filename: 'index.html',
        language: 'html',
        code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SprintFlow - Agile Kanban Board</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body class="bg-neutral-950 text-neutral-100 min-h-screen font-sans flex flex-col">
  <!-- Top App Bar -->
  <header class="h-14 border-b border-neutral-800 bg-neutral-900/90 px-6 flex items-center justify-between sticky top-0 z-20">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-neutral-950 shadow-md">
        ⚡
      </div>
      <div>
        <h1 class="text-sm font-bold text-white">SprintFlow Studio</h1>
        <p class="text-[10px] text-neutral-400">Sprint 34 · 12 Days Remaining</p>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <button id="add-task-btn" class="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm">
        <span>+ Add Task</span>
      </button>
    </div>
  </header>

  <!-- Board Columns Canvas -->
  <main class="flex-1 p-6 overflow-x-auto flex gap-5 items-start">
    <!-- Backlog Column -->
    <div class="w-72 sm:w-80 shrink-0 bg-neutral-900/60 border border-neutral-800 rounded-xl flex flex-col max-h-[calc(100vh-100px)]">
      <div class="p-3.5 border-b border-neutral-800 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-neutral-500"></span>
          <h2 class="text-xs font-bold text-white uppercase tracking-wider">Backlog</h2>
        </div>
        <span class="px-2 py-0.5 rounded bg-neutral-800 text-[10px] text-neutral-400 font-mono" id="count-backlog">0</span>
      </div>
      <div class="p-3 space-y-3 overflow-y-auto flex-1 task-container" id="col-backlog"></div>
    </div>

    <!-- In Progress Column -->
    <div class="w-72 sm:w-80 shrink-0 bg-neutral-900/60 border border-neutral-800 rounded-xl flex flex-col max-h-[calc(100vh-100px)]">
      <div class="p-3.5 border-b border-neutral-800 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
          <h2 class="text-xs font-bold text-white uppercase tracking-wider">In Progress</h2>
        </div>
        <span class="px-2 py-0.5 rounded bg-neutral-800 text-[10px] text-neutral-400 font-mono" id="count-inprogress">0</span>
      </div>
      <div class="p-3 space-y-3 overflow-y-auto flex-1 task-container" id="col-inprogress"></div>
    </div>

    <!-- Review Column -->
    <div class="w-72 sm:w-80 shrink-0 bg-neutral-900/60 border border-neutral-800 rounded-xl flex flex-col max-h-[calc(100vh-100px)]">
      <div class="p-3.5 border-b border-neutral-800 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <h2 class="text-xs font-bold text-white uppercase tracking-wider">In Review</h2>
        </div>
        <span class="px-2 py-0.5 rounded bg-neutral-800 text-[10px] text-neutral-400 font-mono" id="count-review">0</span>
      </div>
      <div class="p-3 space-y-3 overflow-y-auto flex-1 task-container" id="col-review"></div>
    </div>

    <!-- Completed Column -->
    <div class="w-72 sm:w-80 shrink-0 bg-neutral-900/60 border border-neutral-800 rounded-xl flex flex-col max-h-[calc(100vh-100px)]">
      <div class="p-3.5 border-b border-neutral-800 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <h2 class="text-xs font-bold text-white uppercase tracking-wider">Completed</h2>
        </div>
        <span class="px-2 py-0.5 rounded bg-neutral-800 text-[10px] text-neutral-400 font-mono" id="count-completed">0</span>
      </div>
      <div class="p-3 space-y-3 overflow-y-auto flex-1 task-container" id="col-completed"></div>
    </div>
  </main>

  <!-- Modal for Creating New Task -->
  <div id="task-modal" class="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 hidden flex items-center justify-center p-4">
    <div class="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4 shadow-2xl">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-white">Create New Task</h3>
        <button id="close-modal-btn" class="text-neutral-400 hover:text-white">✕</button>
      </div>

      <div class="space-y-3">
        <div>
          <label class="text-xs text-neutral-400 block mb-1">Task Title</label>
          <input id="modal-title" type="text" placeholder="e.g. Implement OAuth2 Refresh Token Rotation" class="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500" />
        </div>

        <div>
          <label class="text-xs text-neutral-400 block mb-1">Description</label>
          <textarea id="modal-desc" placeholder="Details and acceptance criteria..." class="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 h-20 resize-none"></textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-neutral-400 block mb-1">Priority</label>
            <select id="modal-priority" class="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500">
              <option value="high">High Priority</option>
              <option value="medium" selected>Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label class="text-xs text-neutral-400 block mb-1">Assignee</label>
            <input id="modal-assignee" type="text" placeholder="Alex M." class="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500" />
          </div>
        </div>

        <button id="save-task-btn" class="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs rounded-lg transition-colors shadow-sm">
          Save Task to Board
        </button>
      </div>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>`,
      },
      {
        filename: 'style.css',
        language: 'css',
        code: `.task-card {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}`,
      },
      {
        filename: 'app.js',
        language: 'javascript',
        code: `// SprintFlow Kanban Board Controller
let tasks = [
  { id: '1', title: 'Implement Redis token cache', desc: 'Accelerate session lookup under peak load', priority: 'high', column: 'inprogress', assignee: 'Sarah K.' },
  { id: '2', title: 'Design dark-mode system metrics chart', desc: 'High-contrast typography with SVG tooltips', priority: 'medium', column: 'inprogress', assignee: 'Liam D.' },
  { id: '3', title: 'Database connection pooling tuning', desc: 'Benchmark max open connections for PostgreSQL', priority: 'low', column: 'backlog', assignee: 'Dev Team' },
  { id: '4', title: 'Stripe webhook idempotent verification', desc: 'Prevent replay attacks on invoice.payment_succeeded', priority: 'high', column: 'review', assignee: 'Alex M.' },
  { id: '5', title: 'Audit dependency CVE vulnerabilities', desc: 'Automated npm audit and lockfile security patch', priority: 'medium', column: 'completed', assignee: 'DevOps' }
];

function renderBoard() {
  const columns = ['backlog', 'inprogress', 'review', 'completed'];

  columns.forEach(col => {
    const container = document.getElementById(\`col-\${col}\`);
    const countEl = document.getElementById(\`count-\${col}\`);
    if (!container) return;

    const colTasks = tasks.filter(t => t.column === col);
    if (countEl) countEl.innerText = colTasks.length;

    container.innerHTML = colTasks.map(t => \`
      <div class="task-card p-3 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2 select-none cursor-pointer">
        <div class="flex items-center justify-between">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase \${
            t.priority === 'high' ? 'bg-red-950/80 text-red-400 border border-red-800' :
            t.priority === 'medium' ? 'bg-amber-950/80 text-amber-400 border border-amber-800' :
            'bg-neutral-800 text-neutral-400'
          }">\${t.priority}</span>
          <span class="text-[11px] text-neutral-400 font-mono">\${t.assignee}</span>
        </div>
        <h4 class="text-xs font-semibold text-white leading-tight">\${t.title}</h4>
        <p class="text-[11px] text-neutral-400 leading-snug">\${t.desc}</p>
        <div class="flex items-center justify-between pt-2 border-t border-neutral-850 text-[10px] text-neutral-500">
          <span>Move:</span>
          <div class="flex gap-1">
            \${col !== 'backlog' ? \`<button onclick="moveTask('\${t.id}', 'prev')" class="hover:text-white px-1">◀</button>\` : ''}
            \${col !== 'completed' ? \`<button onclick="moveTask('\${t.id}', 'next')" class="hover:text-white px-1">▶</button>\` : ''}
          </div>
        </div>
      </div>
    \`).join('');
  });
}

window.moveTask = function(taskId, direction) {
  const order = ['backlog', 'inprogress', 'review', 'completed'];
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const currentIndex = order.indexOf(task.column);
  if (direction === 'next' && currentIndex < order.length - 1) {
    task.column = order[currentIndex + 1];
  } else if (direction === 'prev' && currentIndex > 0) {
    task.column = order[currentIndex - 1];
  }
  renderBoard();
};

document.addEventListener('DOMContentLoaded', () => {
  renderBoard();

  const modal = document.getElementById('task-modal');
  document.getElementById('add-task-btn')?.addEventListener('click', () => {
    modal?.classList.remove('hidden');
  });

  document.getElementById('close-modal-btn')?.addEventListener('click', () => {
    modal?.classList.add('hidden');
  });

  document.getElementById('save-task-btn')?.addEventListener('click', () => {
    const title = document.getElementById('modal-title').value.trim();
    const desc = document.getElementById('modal-desc').value.trim();
    const priority = document.getElementById('modal-priority').value;
    const assignee = document.getElementById('modal-assignee').value.trim() || 'Unassigned';

    if (!title) return;

    tasks.push({
      id: String(Date.now()),
      title,
      desc,
      priority,
      column: 'backlog',
      assignee
    });

    modal?.classList.add('hidden');
    document.getElementById('modal-title').value = '';
    document.getElementById('modal-desc').value = '';
    renderBoard();
  });
});`,
      },
      {
        filename: 'package.json',
        language: 'json',
        code: `{
  "name": "sprint-flow-kanban",
  "version": "1.0.0",
  "description": "Agile Kanban Project Orchestrator created with DevPartner AI",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}`,
      },
    ],
  },
  {
    id: 'fullstack-express-rest-app',
    name: 'Full-Stack Express REST & Client Service',
    category: 'Full-Stack',
    badge: 'Node + Client',
    description: 'Production-ready full stack service featuring an Express.js backend with JSON validation, health metrics, and an interactive browser test client.',
    highlights: ['Modular Express server', 'REST API CRUD routes', 'Interactive web test client', 'CORS & error handlers'],
    files: [
      {
        filename: 'server.ts',
        language: 'typescript',
        code: `import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

interface ProjectItem {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'archived';
  createdAt: string;
}

let items: ProjectItem[] = [
  { id: '1', name: 'Cloud Infrastructure Migration', category: 'DevOps', status: 'active', createdAt: new Date().toISOString() },
  { id: '2', name: 'Single Sign-On SAML2 Integration', category: 'Security', status: 'active', createdAt: new Date().toISOString() },
  { id: '3', name: 'Audit Log Storage Optimization', category: 'Data', status: 'archived', createdAt: new Date().toISOString() },
];

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// List Items
app.get('/api/items', (req: Request, res: Response) => {
  res.json({ items, count: items.length });
});

// Create Item
app.post('/api/items', (req: Request, res: Response) => {
  const { name, category } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: 'Name and category are required' });
  }

  const newItem: ProjectItem = {
    id: String(Date.now()),
    name,
    category,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  items.push(newItem);
  res.status(201).json(newItem);
});

// Delete Item
app.delete('/api/items/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  items = items.filter((item) => item.id !== id);
  res.json({ success: true, remaining: items.length });
});

app.listen(PORT, () => {
  console.log(\`⚡ Server listening on port \${PORT}\`);
});`,
      },
      {
        filename: 'index.html',
        language: 'html',
        code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Test Client - Express Service</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-neutral-950 text-neutral-100 p-6 font-mono text-xs">
  <div class="max-w-3xl mx-auto space-y-6">
    <div class="border-b border-neutral-800 pb-4 flex items-center justify-between">
      <div>
        <h1 class="text-base font-bold text-white">Full-Stack REST Service Client</h1>
        <p class="text-neutral-400">Interactive test console for /api/items endpoints</p>
      </div>
      <span class="px-2 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-sans text-xs">
        Server Ready
      </span>
    </div>

    <!-- API Request Runner -->
    <div class="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3 font-sans">
      <h2 class="text-xs font-semibold text-white">Execute REST Action</h2>
      <div class="flex gap-2">
        <input id="item-name" type="text" placeholder="Item Name (e.g. Automated CI Pipeline)" class="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-white" />
        <input id="item-category" type="text" placeholder="Category (e.g. DevOps)" class="w-36 bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-white" />
        <button id="submit-btn" class="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-neutral-950 font-semibold text-xs rounded transition-colors">
          POST /api/items
        </button>
      </div>
    </div>

    <!-- Response Feed -->
    <div class="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
      <div class="flex items-center justify-between text-neutral-400 font-sans">
        <span class="font-semibold text-white">Live Data Response:</span>
        <button id="refresh-btn" class="text-sky-400 hover:underline text-xs">GET /api/items</button>
      </div>
      <pre id="output" class="p-3 rounded bg-neutral-950 border border-neutral-850 text-emerald-400 overflow-x-auto text-[11px] leading-relaxed">
Loading API response...
      </pre>
    </div>
  </div>

  <script>
    async function loadData() {
      const out = document.getElementById('output');
      out.innerText = 'Fetching /api/items...';
      try {
        const res = await fetch('/api/items');
        const json = await res.json();
        out.innerText = JSON.stringify(json, null, 2);
      } catch(e) {
        out.innerText = 'Mock client representation (Simulated):\\n' + JSON.stringify({
          status: 'ok',
          items: [
            { id: '1', name: 'Cloud Migration', category: 'DevOps' },
            { id: '2', name: 'SSO Integration', category: 'Security' }
          ]
        }, null, 2);
      }
    }

    document.getElementById('refresh-btn').addEventListener('click', loadData);
    document.getElementById('submit-btn').addEventListener('click', async () => {
      const name = document.getElementById('item-name').value;
      const category = document.getElementById('item-category').value;
      if (!name) return;
      alert(\`Simulated POST /api/items: \${name} [\${category}]\`);
      loadData();
    });

    loadData();
  </script>
</body>
</html>`,
      },
      {
        filename: 'package.json',
        language: 'json',
        code: `{
  "name": "fullstack-express-service",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx server.ts",
    "build": "tsc"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.19.2"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "tsx": "^4.7.1",
    "typescript": "^5.4.3"
  }
}`,
      },
    ],
  },
];
