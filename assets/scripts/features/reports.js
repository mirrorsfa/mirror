import { escapeHtml, formatMoney } from '../core/formatters.js';

export function createReports() {
  const yearLabel = document.querySelector('#reportYearLabel');
  const incomeValue = document.querySelector('#reportIncome');
  const expenseValue = document.querySelector('#reportExpense');
  const balanceValue = document.querySelector('#reportBalance');
  const savingsRate = document.querySelector('#savingsRate');
  const chart = document.querySelector('#annualChart');
  const categoryList = document.querySelector('#reportCategoryList');

  function render(state) {
    const year = state.selectedMonth.getFullYear();
    const items = state.transactions.filter(item => new Date(item.date).getFullYear() === year);
    const income = items.filter(item => item.amount > 0).reduce((sum, item) => sum + item.amount, 0);
    const expense = items.filter(item => item.amount < 0).reduce((sum, item) => sum + Math.abs(item.amount), 0);
    const display = value => state.isMoneyHidden ? '¥ ••••••' : formatMoney(value);
    const months = Array.from({ length: 12 }, (_, month) => {
      const matching = items.filter(item => new Date(item.date).getMonth() === month);
      return {
        income: matching.filter(item => item.amount > 0).reduce((sum, item) => sum + item.amount, 0),
        expense: matching.filter(item => item.amount < 0).reduce((sum, item) => sum + Math.abs(item.amount), 0)
      };
    });
    const maximum = Math.max(1, ...months.flatMap(item => [item.income, item.expense]));

    yearLabel.textContent = `${year} 年度财务全景`;
    incomeValue.textContent = display(income);
    expenseValue.textContent = display(expense);
    balanceValue.textContent = display(income - expense);
    savingsRate.textContent = `储蓄率 ${income ? Math.round((income - expense) / income * 100) : 0}%`;
    chart.innerHTML = months.map((item, index) => `
      <div class="annual-month">
        <i style="height:${item.income / maximum * 100}%"></i>
        <i style="height:${item.expense / maximum * 100}%"></i>
        <span>${index + 1}月</span>
      </div>
    `).join('');

    const categories = new Map();
    items.filter(item => item.amount < 0).forEach(item => {
      const current = categories.get(item.category) ?? { amount: 0, color: item.color };
      current.amount += Math.abs(item.amount);
      categories.set(item.category, current);
    });
    const ranked = [...categories.entries()].sort((a, b) => b[1].amount - a[1].amount);
    const categoryMaximum = ranked[0]?.[1].amount ?? 1;
    categoryList.innerHTML = ranked.length ? ranked.slice(0, 7).map(([name, data]) => `
      <div class="report-category-item">
        <span>${escapeHtml(name)}</span><strong>${display(data.amount)}</strong>
        <div><i style="width:${data.amount / categoryMaximum * 100}%;--category-color:${data.color}"></i></div>
      </div>
    `).join('') : '<div class="empty-state">今年还没有支出数据。</div>';
  }

  return { render };
}
