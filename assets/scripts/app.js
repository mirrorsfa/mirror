import { createLedgerApi } from './api/ledger-api.js';
import { createStorage } from './core/storage.js';
import { createToast } from './core/toast.js';
import { seedBudgets, seedTransactions } from './data/seed-data.js';
import { createBudget } from './features/budget.js';
import { createAuth } from './features/auth.js';
import { createAccounts } from './features/accounts.js';
import { createCategoryBreakdown } from './features/category-breakdown.js';
import { createChart } from './features/chart.js';
import { createConnectionStatus } from './features/connection-status.js';
import { createEntryDialog } from './features/entry-dialog.js';
import { createMonthSelector } from './features/month-selector.js';
import { createReports } from './features/reports.js';
import { initNavigation } from './features/navigation.js';
import { createSummary } from './features/summary.js';
import { createTransactionList } from './features/transactions.js';
import { createLedgerStore } from './stores/ledger-store.js';

const storage = createStorage();
const gateway = createLedgerApi();
const store = createLedgerStore({
  storage,
  seedData: {
    transactions: seedTransactions,
    budgets: seedBudgets
  },
  initialMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  gateway
});
const showToast = createToast(document.querySelector('#toast'));
const entryDialog = createEntryDialog({ store, showToast });

const components = [
  createAuth({ store, showToast }),
  createAccounts({ store, showToast }),
  createSummary(store),
  createConnectionStatus(),
  createChart(store),
  createCategoryBreakdown(),
  createBudget({ store, showToast }),
  createMonthSelector({ store, showToast }),
  createReports(),
  createTransactionList({ onEdit: entryDialog.openEdit })
];

store.subscribe(state => {
  components.forEach(component => component.render(state));
});
store.initialize();

initNavigation(showToast);
document.querySelector('#todayText').textContent = new Intl.DateTimeFormat('zh-CN', {
  weekday: 'long',
  month: 'long',
  day: 'numeric'
}).format(new Date());
