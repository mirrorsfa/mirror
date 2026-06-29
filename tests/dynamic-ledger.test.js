import { createStorage } from '../assets/scripts/core/storage.js';
import { getBudgetStatus, getCategoryBreakdown, getSummary } from '../assets/scripts/services/ledger-analytics.js';
import { createLedgerStore } from '../assets/scripts/stores/ledger-store.js';

const results = [];

function assert(name, condition) {
  if (!condition) throw new Error(name);
  results.push(`✓ ${name}`);
}

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
}

function createTestStore(memoryStorage) {
  return createLedgerStore({
    storage: createStorage(memoryStorage),
    seedData: { transactions: [], budgets: {} },
    initialMonth: new Date(2026, 5, 1)
  });
}

try {
  const memoryStorage = createMemoryStorage();
  const store = createTestStore(memoryStorage);
  let notifications = 0;
  store.subscribe(() => { notifications += 1; });

  store.addTransaction({
    name: '测试午餐', category: '餐饮', account: '现金',
    date: '2026-06-12T12:00', amount: -100, icon: '🍜', color: '#fae5dd'
  });
  store.addTransaction({
    name: '测试收入', category: '工资', account: '招商银行',
    date: '2026-06-15T09:00', amount: 500, icon: '💼', color: '#e1eee8'
  });

  let summary = getSummary(store.getState());
  assert('新增流水后正确汇总收入', summary.income === 500);
  assert('新增流水后正确汇总支出', summary.expense === 100);
  assert('新增流水后正确计算结余', summary.balance === 400);
  assert('分类统计来自真实流水', getCategoryBreakdown(store.getState())[0].amount === 100);

  const expenseId = store.getState().transactions.find(item => item.amount < 0).id;
  store.updateTransaction(expenseId, { amount: -150 });
  summary = getSummary(store.getState());
  assert('修改流水后汇总实时更新', summary.expense === 150 && summary.balance === 350);

  store.setBudget(1000);
  const budget = getBudgetStatus(store.getState());
  assert('预算进度由实际支出计算', budget.percentage === 15 && budget.remaining === 850);

  store.changeMonth(1);
  assert('月份切换会过滤流水', getSummary(store.getState()).transactions.length === 0);
  store.changeMonth(-1);

  store.removeTransaction(expenseId);
  assert('删除流水后支出归零', getSummary(store.getState()).expense === 0);
  assert('每次数据变化都会通知界面', notifications >= 7);

  const reloadedStore = createTestStore(memoryStorage);
  const reloadedSummary = getSummary(reloadedStore.getState());
  assert('刷新后流水仍从本地存储恢复', reloadedSummary.income === 500);
  assert('刷新后预算仍从本地存储恢复', getBudgetStatus(reloadedStore.getState()).budget === 1000);

  const result = document.querySelector('#testResult');
  result.dataset.status = 'passed';
  result.textContent = `${results.join('\n')}\n\n${results.length} 项测试全部通过`;
} catch (error) {
  const result = document.querySelector('#testResult');
  result.dataset.status = 'failed';
  result.textContent = `${results.join('\n')}\n✗ ${error.message}`;
  throw error;
}
