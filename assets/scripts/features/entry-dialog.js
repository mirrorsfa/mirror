import { toDateInputValue } from '../core/date.js';
import { categoryMeta } from '../data/seed-data.js';

const expenseCategories = ['餐饮', '交通', '购物', '娱乐', '居住', '医疗', '学习', '其他'];
const incomeCategories = ['工资', '奖金', '其他'];

export function createEntryDialog({ store, showToast }) {
  const dialog = document.querySelector('#transactionDialog');
  const form = document.querySelector('#transactionForm');
  const amountInput = document.querySelector('#amountInput');
  const noteInput = document.querySelector('#noteInput');
  const dateInput = document.querySelector('#dateInput');
  const accountInput = document.querySelector('#accountInput');
  const categoryOptions = document.querySelector('#categoryOptions');
  const typeButtons = document.querySelectorAll('.type-switch button');
  const deleteButton = document.querySelector('#deleteTransaction');
  const dialogTitle = document.querySelector('#dialogTitle');
  const dialogEyebrow = document.querySelector('#dialogEyebrow');
  const saveButton = document.querySelector('#saveTransaction');
  let editingId = null;
  let transactionType = 'expense';
  let selectedCategory = '餐饮';

  function renderType() {
    typeButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.type === transactionType);
    });
    const categories = transactionType === 'income' ? incomeCategories : expenseCategories;
    if (!categories.includes(selectedCategory)) selectedCategory = categories[0];
    categoryOptions.innerHTML = categories.map(category => `
      <button type="button" class="${category === selectedCategory ? 'active' : ''}" data-category="${category}">
        ${categoryMeta[category].icon}<span>${category}</span>
      </button>
    `).join('');
  }

  function openCreate() {
    const { selectedMonth } = store.getState();
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === selectedMonth.getFullYear()
      && now.getMonth() === selectedMonth.getMonth();
    const defaultDate = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth(),
      isCurrentMonth ? now.getDate() : 1
    );

    editingId = null;
    transactionType = 'expense';
    selectedCategory = '餐饮';
    form.reset();
    dateInput.value = toDateInputValue(defaultDate);
    dialogEyebrow.textContent = 'QUICK ENTRY';
    dialogTitle.textContent = '记下这一笔';
    saveButton.textContent = '保存记录';
    deleteButton.hidden = true;
    renderType();
    dialog.showModal();
    window.setTimeout(() => amountInput.focus(), 120);
  }

  function openEdit(id) {
    const transaction = store.getState().transactions.find(item => item.id === id);
    if (!transaction) return;

    editingId = id;
    transactionType = transaction.amount > 0 ? 'income' : 'expense';
    selectedCategory = transaction.category;
    amountInput.value = Math.abs(transaction.amount);
    noteInput.value = transaction.name;
    dateInput.value = transaction.date.slice(0, 10);
    accountInput.value = transaction.account;
    dialogEyebrow.textContent = 'EDIT ENTRY';
    dialogTitle.textContent = '编辑这笔记录';
    saveButton.textContent = '保存修改';
    deleteButton.hidden = false;
    renderType();
    dialog.showModal();
  }

  function getTransactionDraft() {
    const amount = Number(amountInput.value);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    const isIncome = transactionType === 'income';
    const meta = categoryMeta[selectedCategory];
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    return {
      icon: meta.icon,
      color: meta.color,
      name: noteInput.value.trim() || (isIncome ? '一笔新收入' : selectedCategory),
      category: selectedCategory,
      account: accountInput.value,
      date: `${dateInput.value}T${time}`,
      amount: isIncome ? amount : -amount
    };
  }

  document.querySelector('#addTransaction').addEventListener('click', openCreate);
  document.querySelector('#mobileAdd').addEventListener('click', openCreate);
  document.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
  typeButtons.forEach(button => {
    button.addEventListener('click', () => {
      transactionType = button.dataset.type;
      renderType();
    });
  });
  categoryOptions.addEventListener('click', event => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    selectedCategory = button.dataset.category;
    renderType();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const draft = getTransactionDraft();
    if (!draft) {
      amountInput.focus();
      showToast('先写下正确的金额吧');
      return;
    }
    if (editingId) store.updateTransaction(editingId, draft);
    else store.addTransaction(draft);
    dialog.close();
    showToast(editingId ? '这笔记录已更新' : '已保存，认真生活的证据 +1');
  });
  deleteButton.addEventListener('click', () => {
    if (!editingId || !window.confirm('确定删除这笔记录吗？')) return;
    store.removeTransaction(editingId);
    dialog.close();
    showToast('这笔记录已删除');
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });

  return { openEdit };
}
