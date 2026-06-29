import { toMonthKey } from '../core/date.js';

function createId() {
  return globalThis.crypto?.randomUUID?.()
    ?? `transaction-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createLedgerStore({ storage, seedData, initialMonth }) {
  const persisted = storage.load(seedData);
  const listeners = new Set();
  const state = {
    transactions: persisted.transactions,
    budgets: persisted.budgets,
    selectedMonth: initialMonth,
    isMoneyHidden: false,
    chartRange: 'week'
  };

  function persist() {
    storage.save({
      transactions: state.transactions,
      budgets: state.budgets
    });
  }

  function notify() {
    listeners.forEach(listener => listener(state));
  }

  function subscribe(listener) {
    listeners.add(listener);
    listener(state);
    return () => listeners.delete(listener);
  }

  function addTransaction(transaction) {
    state.transactions.unshift({ ...transaction, id: createId() });
    persist();
    notify();
  }

  function updateTransaction(id, changes) {
    const index = state.transactions.findIndex(item => item.id === id);
    if (index === -1) return;
    state.transactions[index] = { ...state.transactions[index], ...changes, id };
    persist();
    notify();
  }

  function removeTransaction(id) {
    state.transactions = state.transactions.filter(item => item.id !== id);
    persist();
    notify();
  }

  function changeMonth(offset) {
    state.selectedMonth = new Date(
      state.selectedMonth.getFullYear(),
      state.selectedMonth.getMonth() + offset,
      1
    );
    notify();
  }

  function setMoneyHidden(hidden) {
    state.isMoneyHidden = hidden;
    notify();
  }

  function setChartRange(range) {
    state.chartRange = range;
    notify();
  }

  function setBudget(amount) {
    state.budgets[toMonthKey(state.selectedMonth)] = amount;
    persist();
    notify();
  }

  return {
    getState: () => state,
    subscribe,
    addTransaction,
    updateTransaction,
    removeTransaction,
    changeMonth,
    setMoneyHidden,
    setChartRange,
    setBudget
  };
}
