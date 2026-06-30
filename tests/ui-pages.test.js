const results = [];
const result = document.querySelector('#testResult');
const frame = document.querySelector('#appFrame');

function assert(name, condition) {
  if (!condition) throw new Error(name);
  results.push(`✓ ${name}`);
}

function waitForLoad(target) {
  if (target.contentDocument?.querySelector('#overviewView')) return Promise.resolve();
  return new Promise(resolve => target.addEventListener('load', resolve, { once: true }));
}

function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

try {
  await waitForLoad(frame);
  const appWindow = frame.contentWindow;
  const appDocument = frame.contentDocument;

  const overview = appDocument.querySelector('#overviewView');
  const transactions = appDocument.querySelector('#transactions-page');
  const budget = appDocument.querySelector('#budget-page');
  assert('总览、全部流水和预算是三个独立容器', overview && transactions && budget && new Set([overview, transactions, budget]).size === 3);

  appWindow.location.hash = '#transactions-page';
  await nextFrame();
  assert('进入全部流水时只显示流水页', overview.hidden && !transactions.hidden && budget.hidden);

  appWindow.location.hash = '#budget-page';
  await nextFrame();
  assert('进入预算管理时只显示预算页', overview.hidden && transactions.hidden && !budget.hidden);

  const loginButton = appDocument.querySelector('[data-auth-mode="login"]');
  const registerButton = appDocument.querySelector('[data-auth-mode="register"]');
  const nameField = appDocument.querySelector('#displayNameField');
  const nameInput = appDocument.querySelector('#authDisplayName');
  const emailInput = appDocument.querySelector('#authEmail');
  const passwordInput = appDocument.querySelector('#authPassword');
  loginButton.click();
  assert('登录模式不显示昵称', nameField.hidden && !nameInput.required);
  assert('登录表单初始内容为空', !emailInput.value && !passwordInput.value);

  emailInput.value = 'temporary@example.com';
  passwordInput.value = 'temporary-password';
  registerButton.click();
  assert('注册模式显示并要求昵称', !nameField.hidden && nameInput.required);
  assert('切换注册时不保留预填内容', !nameInput.value && !emailInput.value && !passwordInput.value);

  const closeSelectors = [
    '#transactionDialog .close-dialog',
    '#accountDialog .close-account-dialog',
    '#budgetDialog .close-budget-dialog',
    '#authDialog .close-auth-dialog'
  ];
  assert('用户端所有弹窗都有可见关闭按钮', closeSelectors.every(selector => appDocument.querySelector(selector)));

  const adminHtml = await fetch('../admin.html').then(response => response.text());
  const adminDocument = new DOMParser().parseFromString(adminHtml, 'text/html');
  assert('管理后台使用独立页面与用户列表', adminDocument.querySelector('#adminUserList') && adminDocument.querySelector('#adminLoginDialog'));
  assert('管理员登录弹窗有直接关闭按钮', adminDocument.querySelector('#closeAdminLogin'));

  result.dataset.status = 'passed';
  result.textContent = `${results.join('\n')}\n\n${results.length} 项测试全部通过`;
} catch (error) {
  result.dataset.status = 'failed';
  result.textContent = `${results.join('\n')}\n✗ ${error.message}`;
  throw error;
}
