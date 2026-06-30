export function createAuth({ store, showToast }) {
  const dialog = document.querySelector('#authDialog');
  const form = document.querySelector('#authForm');
  const modeButtons = document.querySelectorAll('[data-auth-mode]');
  const displayNameField = document.querySelector('#displayNameField');
  const displayNameInput = document.querySelector('#authDisplayName');
  const emailInput = document.querySelector('#authEmail');
  const passwordInput = document.querySelector('#authPassword');
  const title = document.querySelector('#authTitle');
  const subtitle = document.querySelector('#authSubtitle');
  const errorElement = document.querySelector('#authError');
  const submitButton = document.querySelector('#authSubmit');
  const profileName = document.querySelector('#profileName');
  const profileEmail = document.querySelector('#profileEmail');
  const profileAvatar = document.querySelector('#profileAvatar');
  const logoutButton = document.querySelector('#logoutButton');
  let mode = 'login';

  function setMode(nextMode) {
    mode = nextMode;
    const isRegister = mode === 'register';
    modeButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.authMode === mode);
    });
    displayNameField.hidden = !isRegister;
    displayNameInput.required = isRegister;
    passwordInput.autocomplete = isRegister ? 'new-password' : 'current-password';
    title.textContent = isRegister ? '创建你的账本' : '登录你的账本';
    subtitle.textContent = isRegister
      ? '注册后会自动创建四个常用账户'
      : '数据会安全地保存在你的专属账户中';
    submitButton.textContent = isRegister ? '注册并开始记账' : '登录';
    errorElement.hidden = true;
    displayNameInput.value = '';
    emailInput.value = '';
    passwordInput.value = '';
  }

  modeButtons.forEach(button => {
    button.addEventListener('click', () => setMode(button.dataset.authMode));
  });
  document.querySelector('.close-auth-dialog').addEventListener('click', () => {
    dialog.dataset.dismissed = 'true';
    dialog.close();
  });
  document.querySelector('#connectionStatus').addEventListener('click', () => {
    if (store.getState().dataSource !== 'auth-required') return;
    delete dialog.dataset.dismissed;
    setMode('login');
    dialog.showModal();
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    submitButton.disabled = true;
    errorElement.hidden = true;
    try {
      await store.authenticate(mode, {
        email: emailInput.value.trim(),
        password: passwordInput.value,
        ...(mode === 'register' ? { display_name: displayNameInput.value.trim() } : {})
      });
      form.reset();
      dialog.close();
      showToast(mode === 'register' ? '欢迎加入，账本已经准备好了' : '欢迎回来');
    } catch (error) {
      errorElement.textContent = error.message;
      errorElement.hidden = false;
    } finally {
      submitButton.disabled = false;
    }
  });

  logoutButton.addEventListener('click', () => {
    if (!store.getState().user || !window.confirm('确定退出当前账号吗？')) return;
    store.logout();
    showToast('已安全退出');
  });

  function render(state) {
    if (state.user) {
      profileName.textContent = state.user.display_name;
      profileEmail.textContent = state.user.email;
      profileAvatar.textContent = state.user.display_name.slice(0, 1);
      logoutButton.hidden = false;
    } else {
      profileName.textContent = state.dataSource === 'local' ? '本地体验' : '尚未登录';
      profileEmail.textContent = state.dataSource === 'local' ? '数据保存在浏览器' : '登录后同步数据';
      profileAvatar.textContent = state.dataSource === 'local' ? '本' : '?';
      logoutButton.hidden = true;
    }
    if (state.dataSource === 'auth-required' && !dialog.open && !dialog.dataset.dismissed) {
      setMode('login');
      dialog.showModal();
    }
  }

  return { render };
}
