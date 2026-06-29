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

  const remoteStorage = createMemoryStorage();
  const gatewayCalls = [];
  const gateway = {
    hasToken: () => true,
    health: async () => ({ status: 'ok' }),
    me: async () => ({ id: 'user-1', email: 'test@example.com', display_name: '测试用户' }),
    listTransactions: async year => {
      gatewayCalls.push(['list', year]);
      return [{
        id: 'remote-1', name: '云端早餐', category: '餐饮', account: '微信支付',
        date: '2026-06-29T08:00:00', amount: -20, icon: '🍜', color: '#fae5dd'
      }];
    },
    getBudget: async period => {
      gatewayCalls.push(['getBudget', period]);
      return 2000;
    },
    listAccounts: async () => [],
    createTransaction: async item => ({ ...item, id: 'remote-2' }),
    updateTransaction: async (id, item) => ({ ...item, id }),
    removeTransaction: async id => gatewayCalls.push(['remove', id]),
    setBudget: async (period, amount) => {
      gatewayCalls.push(['setBudget', period, amount]);
      return amount;
    }
  };
  const remoteStore = createLedgerStore({
    storage: createStorage(remoteStorage),
    seedData: { transactions: [], budgets: {} },
    initialMonth: new Date(2026, 5, 1),
    gateway
  });
  await remoteStore.initialize();
  assert('连接成功后切换为云端数据源', remoteStore.getState().dataSource === 'remote');
  assert('初始化会恢复当前登录用户', remoteStore.getState().user.id === 'user-1');
  assert('初始化会从后端加载年度流水', remoteStore.getState().transactions[0].id === 'remote-1');
  assert('初始化会同步当前月预算', getBudgetStatus(remoteStore.getState()).budget === 2000);

  await remoteStore.addTransaction({
    name: '云端午餐', category: '餐饮', account: '现金',
    date: '2026-06-29T12:00:00', amount: -35, icon: '🍜', color: '#fae5dd'
  });
  assert('新增流水使用后端返回的标识', remoteStore.getState().transactions[0].id === 'remote-2');
  await remoteStore.setBudget(3000);
  assert('修改预算会写入远程网关', gatewayCalls.some(call => call[0] === 'setBudget'));

  const result = document.querySelector('#testResult');
  result.dataset.status = 'passed';
  result.textContent = `${results.join('\n')}\n\n${results.length} 项测试全部通过`;
} catch (error) {
  const result = document.querySelector('#testResult');
  result.dataset.status = 'failed';
  result.textContent = `${results.join('\n')}\n✗ ${error.message}`;
  throw error;
}
