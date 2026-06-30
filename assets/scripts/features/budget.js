import { formatMoney } from '../core/formatters.js';
import { getBudgetStatus, getCategoryBreakdown } from '../services/ledger-analytics.js';

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
  const pageTotal = document.querySelector('#budgetPageTotal');
  const pageSpent = document.querySelector('#budgetPageSpent');
  const pageRemaining = document.querySelector('#budgetPageRemaining');
  const pagePercent = document.querySelector('#budgetPagePercent');
  const pageRing = document.querySelector('#budgetPageRing');
  const pageStatus = document.querySelector('#budgetPageStatus');
  const pagePeriod = document.querySelector('#budgetPagePeriod');
  const categoryList = document.querySelector('#budgetCategoryList');

  function openDialog() {
    input.value = getBudgetStatus(store.getState()).budget;
    dialog.showModal();
    window.setTimeout(() => input.select(), 100);
  }
  document.querySelector('#editBudget').addEventListener('click', openDialog);
  document.querySelector('#editBudgetPage').addEventListener('click', openDialog);
  document.querySelector('.close-budget-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const amount = Number(input.value);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast('预算金额需要大于 0');
      return;
    }
    const submitButton = form.querySelector('[type="submit"]');
    submitButton.disabled = true;
    try {
      await store.setBudget(amount);
      dialog.close();
      showToast('本月预算已更新');
    } catch (error) {
      showToast(error.message);
    } finally {
      submitButton.disabled = false;
    }
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
    pageTotal.textContent = display(status.budget);
    pageSpent.textContent = display(status.spent);
    pageRemaining.textContent = display(status.remaining);
    pagePercent.textContent = `${percentage.toFixed(1)}%`;
    pageRing.style.background = `conic-gradient(${status.remaining < 0 ? 'var(--orange)' : 'var(--green)'} ${Math.min(100, status.percentage)}%, #e8ece7 0)`;
    pageStatus.textContent = status.remaining < 0 ? '本月预算已经超支' : `还可使用 ${display(status.remaining)}`;
    pagePeriod.textContent = `${state.selectedMonth.getFullYear()}年 ${state.selectedMonth.getMonth() + 1}月预算规划`;
    const categories = getCategoryBreakdown(state);
    categoryList.innerHTML = categories.length ? categories.map(item => `<div class="budget-category-row">
      <span><i style="--category-color:${item.color}"></i>${item.category}</span>
      <div><i style="width:${Math.min(100, item.percentage)}%;--category-color:${item.color}"></i></div>
      <strong>${display(item.amount)} <small>${Math.round(item.percentage)}%</small></strong>
    </div>`).join('') : '<div class="empty-state">记下支出后，这里会展示分类预算占用。</div>';

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
