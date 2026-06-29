import { escapeHtml, formatMoney } from '../core/formatters.js';
import { getCategoryBreakdown, getSummary } from '../services/ledger-analytics.js';

const fallbackColors = ['#ee8468', '#476d63', '#eebd65', '#95aaa2', '#8d82b4', '#67a0b0'];

export function createCategoryBreakdown() {
  const total = document.querySelector('#categoryTotal');
  const donut = document.querySelector('#categoryDonut');
  const topCategory = document.querySelector('#topCategory');
  const topPercent = document.querySelector('#topCategoryPercent');
  const list = document.querySelector('#categoryList');

  function render(state) {
    const summary = getSummary(state);
    const categories = getCategoryBreakdown(state);
    const visibleCategories = categories.slice(0, 4);
    const totalLabel = state.isMoneyHidden ? '¥ ••••••' : formatMoney(summary.expense);
    total.textContent = `本月共支出 ${totalLabel}`;

    if (!categories.length) {
      donut.style.background = '#e9ede9';
      topCategory.textContent = '暂无';
      topPercent.textContent = '0%';
      list.innerHTML = '<div class="category-empty">记下一笔支出后，这里会出现分类分析。</div>';
      return;
    }

    let start = 0;
    const segments = categories.map((item, index) => {
      const end = start + item.percentage;
      const color = item.color || fallbackColors[index % fallbackColors.length];
      const segment = `${color} ${start}% ${end}%`;
      start = end;
      return segment;
    });
    donut.style.background = `conic-gradient(${segments.join(',')})`;
    topCategory.textContent = categories[0].category;
    topPercent.textContent = `${Math.round(categories[0].percentage)}%`;

    list.innerHTML = visibleCategories.map((item, index) => `
      <div>
        <i style="--color:${item.color || fallbackColors[index]}"></i>
        <span>${escapeHtml(item.category)}</span>
        <strong>${state.isMoneyHidden ? '••••' : formatMoney(item.amount)}</strong>
        <small>${Math.round(item.percentage)}%</small>
      </div>
    `).join('');
  }

  return { render };
}
