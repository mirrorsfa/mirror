import { formatMoney } from '../core/formatters.js';
import { getSummary } from '../services/ledger-analytics.js';

export function createSummary(store) {
  const toggleButton = document.querySelector('#toggleMoney');
  const balanceValue = document.querySelector('#balanceValue');
  const incomeValue = document.querySelector('#incomeValue');
  const expenseValue = document.querySelector('#expenseValue');
  const incomeHint = document.querySelector('#incomeHint');
  const expenseHint = document.querySelector('#expenseHint');
  const activeDays = document.querySelector('#activeDays');

  toggleButton.addEventListener('click', () => {
    const { isMoneyHidden } = store.getState();
    store.setMoneyHidden(!isMoneyHidden);
  });

  function render(state) {
    const summary = getSummary(state);
    const display = value => state.isMoneyHidden ? '¥ ••••••' : formatMoney(value);

    balanceValue.textContent = display(summary.balance);
    incomeValue.textContent = display(summary.income);
    expenseValue.textContent = display(summary.expense);
    incomeHint.textContent = `共 ${summary.incomeCount} 笔收入`;
    expenseHint.textContent = `日均支出 ${display(summary.averageDailyExpense)}`;
    activeDays.textContent = `本月已记账 ${summary.activeDays} 天`;
    toggleButton.classList.toggle('hidden', state.isMoneyHidden);
    toggleButton.setAttribute('aria-label', state.isMoneyHidden ? '显示金额' : '隐藏金额');
  }

  return { render };
}
