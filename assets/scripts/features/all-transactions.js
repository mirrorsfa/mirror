import { formatTransactionTime } from '../core/date.js';
import { escapeHtml, formatMoney } from '../core/formatters.js';
import { getMonthTransactions } from '../services/ledger-analytics.js';

export function createAllTransactions({ store, onCreate, onEdit, showToast }) {
  const list = document.querySelector('#allTransactionList');
  const empty = document.querySelector('#allTransactionEmpty');
  const search = document.querySelector('#allTransactionSearch');
  const typeFilter = document.querySelector('#transactionTypeFilter');
  const accountFilter = document.querySelector('#transactionAccountFilter');
  const monthLabel = document.querySelector('#transactionMonthLabel');
  const period = document.querySelector('#allTransactionPeriod');
  let currentState;

  document.querySelector('#addTransactionPage').addEventListener('click', onCreate);
  document.querySelector('#transactionPrevMonth').addEventListener('click', async () => {
    try { await store.changeMonth(-1); } catch (error) { showToast(error.message); }
  });
  document.querySelector('#transactionNextMonth').addEventListener('click', async () => {
    try { await store.changeMonth(1); } catch (error) { showToast(error.message); }
  });
  [search, typeFilter, accountFilter].forEach(control => {
    control.addEventListener(control === search ? 'input' : 'change', () => render());
  });
  list.addEventListener('click', event => {
    const row = event.target.closest('[data-id]');
    if (row) onEdit(row.dataset.id);
  });

  function render(state = currentState) {
    currentState = state;
    const year = state.selectedMonth.getFullYear();
    const month = state.selectedMonth.getMonth() + 1;
    const previousAccount = accountFilter.value;
    accountFilter.innerHTML = '<option value="all">全部账户</option>'
      + state.accounts.map(account => `<option value="${account.id}">${escapeHtml(account.name)}</option>`).join('');
    accountFilter.value = [...accountFilter.options].some(option => option.value === previousAccount)
      ? previousAccount : 'all';

    const keyword = search.value.trim().toLowerCase();
    const items = getMonthTransactions(state).filter(item => {
      const matchesType = typeFilter.value === 'all'
        || (typeFilter.value === 'income' ? item.amount > 0 : item.amount < 0);
      const matchesAccount = accountFilter.value === 'all'
        || item.accountId === accountFilter.value;
      const matchesSearch = !keyword
        || [item.name, item.category, item.account].some(value => value.toLowerCase().includes(keyword));
      return matchesType && matchesAccount && matchesSearch;
    });

    monthLabel.textContent = `${year}年 ${month}月`;
    period.textContent = `${month} 月共 ${items.length} 笔匹配记录`;
    list.innerHTML = items.map(item => `<button class="full-transaction-row" type="button" data-id="${item.id}">
      <span class="full-transaction-name"><i style="--icon-bg:${item.color}">${item.icon}</i><span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.category)}</small></span></span>
      <span>${escapeHtml(item.account)}</span>
      <time>${formatTransactionTime(item.date)}</time>
      <b class="${item.amount > 0 ? 'income' : ''}">${state.isMoneyHidden ? '••••••' : formatMoney(item.amount, true)}</b>
    </button>`).join('');
    empty.hidden = items.length > 0;
  }

  return { render };
}
