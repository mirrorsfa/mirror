import { formatTransactionTime } from '../core/date.js';
import { escapeHtml, formatMoney } from '../core/formatters.js';
import { getMonthTransactions } from '../services/ledger-analytics.js';

export function createTransactionList({ onEdit }) {
  const list = document.querySelector('#transactionList');
  const emptyState = document.querySelector('#emptyState');
  const searchInput = document.querySelector('#searchInput');
  const transactionHint = document.querySelector('#transactionHint');
  const showAllButton = document.querySelector('#showAllTransactions');
  let showAll = false;
  let currentState;

  function getVisibleTransactions(state) {
    const keyword = searchInput.value.trim().toLowerCase();
    const matching = getMonthTransactions(state).filter(item =>
      !keyword || [item.name, item.category, item.account]
        .some(value => value.toLowerCase().includes(keyword))
    );
    return showAll || keyword ? matching : matching.slice(0, 5);
  }

  function render(state = currentState) {
    currentState = state;
    const monthTransactions = getMonthTransactions(state);
    const visibleTransactions = getVisibleTransactions(state);

    transactionHint.textContent = `本月共 ${monthTransactions.length} 笔记录`;
    showAllButton.innerHTML = `${showAll ? '收起' : '查看全部'} <svg><use href="#i-chevron"/></svg>`;
    showAllButton.hidden = monthTransactions.length <= 5 && !searchInput.value;

    list.innerHTML = visibleTransactions.map(item => `
      <button class="transaction-item" type="button" data-id="${item.id}" aria-label="编辑${escapeHtml(item.name)}">
        <span class="transaction-icon" style="--icon-bg:${item.color}">${item.icon}</span>
        <span class="transaction-name">
          <strong>${escapeHtml(item.name)}</strong>
          <small>${escapeHtml(item.category)}</small>
        </span>
        <span class="transaction-account">${escapeHtml(item.account)}</span>
        <time class="transaction-time">${formatTransactionTime(item.date)}</time>
        <span class="transaction-amount ${item.amount > 0 ? 'income' : ''}">
          ${state.isMoneyHidden ? '••••••' : formatMoney(item.amount, true)}
        </span>
      </button>
    `).join('');

    emptyState.hidden = visibleTransactions.length > 0;
  }

  list.addEventListener('click', event => {
    const item = event.target.closest('[data-id]');
    if (item) onEdit(item.dataset.id);
  });

  searchInput.addEventListener('input', () => render());
  showAllButton.addEventListener('click', () => {
    showAll = !showAll;
    render();
  });

  return { render };
}
