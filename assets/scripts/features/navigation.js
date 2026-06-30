export function initNavigation(showToast) {
  const navigationItems = document.querySelectorAll('.main-nav .nav-item, .mobile-nav a');
  const overviewView = document.querySelector('#overviewView');
  const standaloneViews = new Map([
    ['#transactions-page', document.querySelector('#transactions-page')],
    ['#budget-page', document.querySelector('#budget-page')],
    ['#reports', document.querySelector('#reports')],
    ['#accounts', document.querySelector('#accounts')]
  ]);

  function showView(hash) {
    const standaloneView = standaloneViews.get(hash) ?? null;
    overviewView.hidden = Boolean(standaloneView);
    standaloneViews.forEach(view => { view.hidden = standaloneView !== view; });

    document.querySelectorAll('.main-nav .nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('href') === hash);
    });
    document.querySelectorAll('.mobile-nav a').forEach(item => {
      item.classList.toggle('active', item.getAttribute('href') === hash);
    });

    if (standaloneView) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const target = document.querySelector(hash);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function navigate(hash) {
    if (window.location.hash === hash) showView(hash);
    else window.location.hash = hash;
  }

  navigationItems.forEach(item => {
    item.addEventListener('click', event => {
      event.preventDefault();
      navigate(item.getAttribute('href'));
    });
  });

  document.querySelector('.brand').addEventListener('click', event => {
    event.preventDefault();
    navigate('#overview');
  });

  window.addEventListener('hashchange', () => {
    showView(standaloneViews.has(window.location.hash) ? window.location.hash : '#overview');
  });

  const initialHash = standaloneViews.has(window.location.hash)
    ? window.location.hash
    : '#overview';
  showView(initialHash);
}
