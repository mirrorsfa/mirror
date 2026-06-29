import { escapeHtml, formatMoney } from '../core/formatters.js';

const typeMeta = {
  wechat: ['微信', '微'], alipay: ['支付宝', '支'], bank: ['银行卡', '卡'],
  cash: ['现金', '¥'], other: ['其他', '账']
};

export function createAccounts({ store, showToast }) {
  const grid = document.querySelector('#accountGrid');
  const empty = document.querySelector('#accountEmpty');
  const totalAssets = document.querySelector('#totalAssets');
  const count = document.querySelector('#accountCount');
  const dialog = document.querySelector('#accountDialog');
  const form = document.querySelector('#accountForm');
  const title = document.querySelector('#accountDialogTitle');
  const nameInput = document.querySelector('#accountNameInput');
  const typeInput = document.querySelector('#accountTypeInput');
  const balanceInput = document.querySelector('#openingBalanceInput');
  const colorInput = document.querySelector('#accountColorInput');
  const errorElement = document.querySelector('#accountError');
  const deleteButton = document.querySelector('#deleteAccount');
  const saveButton = document.querySelector('#saveAccount');
  let editingId = null;

  function openCreate() {
    if (store.getState().dataSource !== 'remote') {
      showToast('账户管理需要连接后端并登录');
      return;
    }
    editingId = null;
    form.reset();
    colorInput.value = '#2f6658';
    balanceInput.value = '0';
    title.textContent = '添加账户';
    deleteButton.hidden = true;
    errorElement.hidden = true;
    dialog.showModal();
  }

  function openEdit(id) {
    const account = store.getState().accounts.find(item => item.id === id);
    if (!account) return;
    editingId = id;
    nameInput.value = account.name;
    typeInput.value = account.account_type;
    balanceInput.value = account.opening_balance;
    colorInput.value = account.color;
    title.textContent = '编辑账户';
    deleteButton.hidden = false;
    errorElement.hidden = true;
    dialog.showModal();
  }

  document.querySelector('#addAccount').addEventListener('click', openCreate);
  document.querySelector('.close-account-dialog').addEventListener('click', () => dialog.close());
  grid.addEventListener('click', event => {
    const card = event.target.closest('[data-account-id]');
    if (card) openEdit(card.dataset.accountId);
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    saveButton.disabled = true;
    errorElement.hidden = true;
    const payload = {
      name: nameInput.value.trim(),
      account_type: typeInput.value,
      opening_balance: Number(balanceInput.value || 0).toFixed(2),
      currency: 'CNY',
      color: colorInput.value
    };
    try {
      if (editingId) await store.updateAccount(editingId, payload);
      else await store.createAccount(payload);
      dialog.close();
      showToast(editingId ? '账户已更新' : '账户已添加');
    } catch (error) {
      errorElement.textContent = error.message;
      errorElement.hidden = false;
    } finally {
      saveButton.disabled = false;
    }
  });
  deleteButton.addEventListener('click', async () => {
    if (!editingId || !window.confirm('确定删除这个账户吗？')) return;
    try {
      await store.removeAccount(editingId);
      dialog.close();
      showToast('账户已删除');
    } catch (error) {
      errorElement.textContent = error.message;
      errorElement.hidden = false;
    }
  });

  function render(state) {
    const display = value => state.isMoneyHidden ? '¥ ••••••' : formatMoney(Number(value));
    const total = state.accounts.reduce((sum, account) => sum + Number(account.current_balance), 0);
    totalAssets.textContent = display(total);
    count.textContent = `共 ${state.accounts.length} 个账户`;
    grid.innerHTML = state.accounts.map(account => {
      const [typeLabel, icon] = typeMeta[account.account_type] ?? typeMeta.other;
      return `<button class="account-card" type="button" data-account-id="${account.id}" style="--account-color:${account.color}">
        <span class="account-card-top"><i class="account-card-icon">${icon}</i><small class="account-card-type">${typeLabel}</small></span>
        <strong class="account-card-name">${escapeHtml(account.name)}</strong>
        <b class="account-card-balance">${display(account.current_balance)}</b>
        <small>初始余额 ${display(account.opening_balance)}</small>
      </button>`;
    }).join('');
    empty.hidden = state.accounts.length > 0;
  }

  return { render };
}
