export function createConnectionStatus() {
  const element = document.querySelector('#connectionStatus');

  function render(state) {
    element.className = 'connection-status';
    if (state.isLoading || state.dataSource === 'connecting') {
      element.classList.add('syncing');
      element.textContent = '正在同步…';
      return;
    }
    if (state.dataSource === 'auth-required') {
      element.classList.add('offline');
      element.textContent = '请先登录';
      element.title = '登录后使用云端账本';
      return;
    }
    if (state.dataSource === 'remote' && !state.error) {
      element.classList.add('online');
      element.textContent = '云端已同步';
      element.title = '数据已保存到后端数据库';
      return;
    }
    element.classList.add(state.error ? 'offline' : 'local');
    element.textContent = state.error ? '本地模式' : '仅本地保存';
    element.title = state.error ?? '数据仅保存在当前浏览器';
  }

  return { render };
}
