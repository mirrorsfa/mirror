import { createStorage } from './core/storage.js';
import { createToast } from './core/toast.js';
import { seedBudgets, seedTransactions } from './data/seed-data.js';
import { createBudget } from './features/budget.js';
import { createCategoryBreakdown } from './features/category-breakdown.js';
import { createChart } from './features/chart.js';
import { createEntryDialog } from './features/entry-dialog.js';
import { createMonthSelector } from './features/month-selector.js';
import { initNavigation } from './features/navigation.js';
import { createSummary } from './features/summary.js';
import { createTransactionList } from './features/transactions.js';
import { createLedgerStore } from './stores/ledger-store.js';

const storage = createStorage();
const store = createLedgerStore({
  storage,
  seedData: {
    transactions: seedTransactions,
    budgets: seedBudgets
  },
  initialMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
});
const showToast = createToast(document.querySelector('#toast'));
const entryDialog = createEntryDialog({ store, showToast });

const components = [
  createSummary(store),
  createChart(store),
  createCategoryBreakdown(),
  createBudget({ store, showToast }),
  createMonthSelector({ store, showToast }),
  createTransactionList({ onEdit: entryDialog.openEdit })
];

store.subscribe(state => {
  components.forEach(component => component.render(state));
});

initNavigation(showToast);
document.querySelector('#todayText').textContent = new Intl.DateTimeFormat('zh-CN', {
  weekday: 'long',
  month: 'long',
  day: 'numeric'
}).format(new Date());
