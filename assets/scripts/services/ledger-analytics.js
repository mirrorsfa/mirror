import { isSameMonth, toDateInputValue, toMonthKey } from '../core/date.js';

export function getMonthTransactions(state) {
  return state.transactions
    .filter(item => isSameMonth(item.date, state.selectedMonth))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getSummary(state) {
  const transactions = getMonthTransactions(state);
  const incomeTransactions = transactions.filter(item => item.amount > 0);
  const expenseTransactions = transactions.filter(item => item.amount < 0);
  const income = incomeTransactions.reduce((sum, item) => sum + item.amount, 0);
  const expense = expenseTransactions.reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const activeDays = new Set(transactions.map(item => item.date.slice(0, 10))).size;
  const daysInMonth = new Date(
    state.selectedMonth.getFullYear(),
    state.selectedMonth.getMonth() + 1,
    0
  ).getDate();

  return {
    transactions,
    income,
    expense,
    balance: income - expense,
    incomeCount: incomeTransactions.length,
    expenseCount: expenseTransactions.length,
    activeDays,
    averageDailyExpense: expense / daysInMonth
  };
}

export function getCategoryBreakdown(state) {
  const { transactions, expense } = getSummary(state);
  const groups = new Map();

  transactions.filter(item => item.amount < 0).forEach(item => {
    const current = groups.get(item.category) ?? {
      category: item.category,
      amount: 0,
      color: item.color
    };
    current.amount += Math.abs(item.amount);
    groups.set(item.category, current);
  });

  return [...groups.values()]
    .sort((a, b) => b.amount - a.amount)
    .map(item => ({
      ...item,
      percentage: expense ? item.amount / expense * 100 : 0
    }));
}

function getTrendWindow(state, range) {
  const selectedYear = state.selectedMonth.getFullYear();
  const selectedMonth = state.selectedMonth.getMonth();
  const all = state.transactions;

  if (range === 'year') {
    return Array.from({ length: 12 }, (_, month) => ({
      label: `${month + 1}月`,
      matches: item => {
        const date = new Date(item.date);
        return date.getFullYear() === selectedYear && date.getMonth() === month;
      }
    }));
  }

  if (range === 'month') {
    return Array.from({ length: 5 }, (_, week) => ({
      label: `第${week + 1}周`,
      matches: item => {
        const date = new Date(item.date);
        return date.getFullYear() === selectedYear
          && date.getMonth() === selectedMonth
          && Math.floor((date.getDate() - 1) / 7) === week;
      }
    }));
  }

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === selectedYear && today.getMonth() === selectedMonth;
  const end = isCurrentMonth
    ? today
    : new Date(selectedYear, selectedMonth + 1, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(end);
    date.setDate(end.getDate() - (6 - index));
    const key = toDateInputValue(date);
    return {
      label: index === 6 && isCurrentMonth ? '今天' : `${date.getMonth() + 1}/${date.getDate()}`,
      matches: item => item.date.slice(0, 10) === key
    };
  });
}

export function getTrend(state) {
  const buckets = getTrendWindow(state, state.chartRange).map(bucket => {
    const matching = state.transactions.filter(bucket.matches);
    return {
      label: bucket.label,
      income: matching.filter(item => item.amount > 0).reduce((sum, item) => sum + item.amount, 0),
      expense: matching.filter(item => item.amount < 0).reduce((sum, item) => sum + Math.abs(item.amount), 0)
    };
  });
  const maximum = Math.max(1, ...buckets.flatMap(item => [item.income, item.expense]));
  return { buckets, maximum };
}

export function getBudgetStatus(state) {
  const budget = Number(state.budgets[toMonthKey(state.selectedMonth)] ?? 10000);
  const { expense } = getSummary(state);
  return {
    budget,
    spent: expense,
    remaining: budget - expense,
    percentage: budget ? expense / budget * 100 : 0
  };
}
