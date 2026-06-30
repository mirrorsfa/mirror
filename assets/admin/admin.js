import { createLedgerApi } from '../scripts/api/ledger-api.js';
import { escapeHtml } from '../scripts/core/formatters.js';

const api = createLedgerApi(undefined, 'today-ledger:admin-token');
const elements = {
  dialog: document.querySelector('#adminLoginDialog'),
  form: document.querySelector('#adminLoginForm'),
  email: document.querySelector('#adminEmail'),
  password: document.querySelector('#adminPassword'),
  error: document.querySelector('#adminLoginError'),
  submit: document.querySelector('#adminLoginSubmit'),
  profile: document.querySelector('#adminProfile'),
  list: document.querySelector('#adminUserList'),
  empty: document.querySelector('#adminEmpty'),
  search: document.querySelector('#adminUserSearch'),
  toast: document.querySelector('#adminToast')
};
let users = [];
let currentAdmin = null;

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => elements.toast.classList.remove('show'), 2000);
}

function openLogin(message = '') {
  elements.form.reset();
  elements.email.value = '';
  elements.password.value = '';
  elements.error.textContent = message;
  elements.error.hidden = !message;
  if (!elements.dialog.open) elements.dialog.showModal();
}

async function loadDashboard() {
  const [summary, loadedUsers] = await Promise.all([
    api.getAdminSummary(), api.listAdminUsers()
  ]);
  users = loadedUsers;
  document.querySelector('#totalUsers').textContent = summary.total_users;
  document.querySelector('#activeUsers').textContent = summary.active_users;
  document.querySelector('#adminUsers').textContent = summary.admin_users;
  document.querySelector('#totalTransactions').textContent = summary.total_transactions;
  renderUsers();
}

function renderUsers() {
  const keyword = elements.search.value.trim().toLowerCase();
  const visible = users.filter(user => !keyword
    || user.email.toLowerCase().includes(keyword)
    || user.display_name.toLowerCase().includes(keyword));
  elements.list.innerHTML = visible.map(user => `<div class="user-row" data-user-id="${user.id}">
    <span class="user-identity"><i class="user-avatar">${escapeHtml(user.display_name.slice(0,1))}</i><span><strong>${escapeHtml(user.display_name)}</strong><small>${escapeHtml(user.email)}</small></span></span>
    <span class="badge ${user.is_admin ? 'admin' : ''}">${user.is_admin ? '管理员' : '普通用户'}</span>
    <span class="badge ${user.is_active ? 'active' : 'disabled'}">${user.is_active ? '正常' : '已停用'}</span>
    <span>${user.account_count} 个账户 · ${user.transaction_count} 笔流水</span>
    <time>${new Date(user.created_at).toLocaleDateString('zh-CN')}</time>
    <span class="user-actions">
      <button data-action="role">${user.is_admin ? '取消管理员' : '设为管理员'}</button>
      <button class="${user.is_active ? 'danger' : ''}" data-action="status">${user.is_active ? '停用' : '启用'}</button>
    </span>
  </div>`).join('');
  elements.empty.hidden = visible.length > 0;
}

elements.form.addEventListener('submit', async event => {
  event.preventDefault();
  elements.submit.disabled = true;
  elements.error.hidden = true;
  try {
    const user = await api.login({ email: elements.email.value.trim(), password: elements.password.value });
    if (!user.is_admin) {
      api.logout();
      throw new Error('该账号没有管理员权限');
    }
    currentAdmin = user;
    elements.profile.textContent = `${user.display_name} · 管理员`;
    await loadDashboard();
    elements.dialog.close();
  } catch (error) {
    elements.error.textContent = error.message;
    elements.error.hidden = false;
  } finally {
    elements.submit.disabled = false;
  }
});

elements.list.addEventListener('click', async event => {
  const button = event.target.closest('[data-action]');
  const row = event.target.closest('[data-user-id]');
  if (!button || !row) return;
  const user = users.find(item => item.id === row.dataset.userId);
  const changes = button.dataset.action === 'role'
    ? { is_admin: !user.is_admin }
    : { is_active: !user.is_active };
  if (!window.confirm(`确定${button.textContent}“${user.display_name}”吗？`)) return;
  try {
    await api.updateAdminUser(user.id, changes);
    await loadDashboard();
    showToast('用户状态已更新');
  } catch (error) { showToast(error.message); }
});

elements.search.addEventListener('input', renderUsers);
document.querySelector('#closeAdminLogin').addEventListener('click', () => elements.dialog.close());
document.querySelector('#adminLogout').addEventListener('click', () => { api.logout(); currentAdmin = null; openLogin(); });

async function initialize() {
  try {
    await api.health();
    if (!api.hasToken()) return openLogin();
    const user = await api.me();
    if (!user.is_admin) { api.logout(); return openLogin('当前账号没有管理员权限'); }
    currentAdmin = user;
    elements.profile.textContent = `${user.display_name} · 管理员`;
    await loadDashboard();
  } catch (error) { openLogin(error.message); }
}

initialize();
