import { formatMoney } from '../core/formatters.js';
import { getBudgetStatus } from '../services/ledger-analytics.js';

export function createBudget({ store, showToast }) {
  const dialog = document.querySelector('#budgetDialog');
  const form = document.querySelector('#budgetForm');
  const input = document.querySelector('#budgetInput');
  const budgetValue = document.querySelector('#budgetValue');
  const spentValue = document.querySelector('#budgetSpent');
  const remainingValue = document.querySelector('#budgetRemaining');
  const sideBudget = document.querySelector('#sideBudget');
  const progress = document.querySelector('#budgetProgress');
  const hint = document.querySelector('#budgetHint');
  const tipTitle = document.querySelector('#budgetTipTitle');
  const tipText = document.querySelector('#budgetTipText');

  document.querySelector('#editBudget').addEventListener('click', () => {
    input.value = getBudgetStatus(store.getState()).budget;
    dialog.showModal();
    window.setTimeout(() => input.select(), 100);
  });
  document.querySelector('.close-budget-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const amount = Number(input.value);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast('预算金额需要大于 0');
      return;
    }
    store.setBudget(amount);
    dialog.close();
    showToast('本月预算已更新');
  });

  function render(state) {
    const status = getBudgetStatus(state);
    const hide = state.isMoneyHidden;
    const display = value => hide ? '¥ ••••••' : formatMoney(value);
    const percentage = Math.round(status.percentage * 10) / 10;

    budgetValue.textContent = display(status.budget);
    spentValue.textContent = display(status.spent);
    remainingValue.textContent = display(status.remaining);
    sideBudget.textContent = display(status.remaining);
    progress.style.width = `${Math.min(100, status.percentage)}%`;
    progress.classList.toggle('over-budget', status.remaining < 0);
    hint.textContent = status.remaining < 0
      ? `已超出预算 ${Math.abs(percentage - 100).toFixed(1)}%`
      : `已使用 ${percentage.toFixed(1)}%`;

    if (status.remaining < 0) {
      tipTitle.textContent = '预算已超支';
      tipText.textContent = '可以检查大额支出，或调整一个更符合实际的月度预算。';
    } else if (status.percentage >= 80) {
      tipTitle.textContent = '接近预算上限';
      tipText.textContent = '接下来的非必要支出，值得多想十秒再决定。';
    } else {
      tipTitle.textContent = '节奏不错';
      tipText.textContent = '预算仍在健康范围，每一笔记录都会实时更新这里。';
    }
  }

  return { render };
}
