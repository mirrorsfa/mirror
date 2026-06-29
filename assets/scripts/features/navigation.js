export function initNavigation(showToast) {
  const navigationItems = document.querySelectorAll('.main-nav .nav-item, .mobile-nav a');
  const overviewView = document.querySelector('#overviewView');
  const reportsView = document.querySelector('#reports');
  const accountsView = document.querySelector('#accounts');

  function showView(hash) {
    const standaloneView = hash === '#reports' ? reportsView : hash === '#accounts' ? accountsView : null;
    overviewView.hidden = Boolean(standaloneView);
    reportsView.hidden = standaloneView !== reportsView;
    accountsView.hidden = standaloneView !== accountsView;

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

  navigationItems.forEach(item => {
    item.addEventListener('click', event => {
      event.preventDefault();
      showView(item.getAttribute('href'));
    });
  });

  document.querySelector('.brand').addEventListener('click', event => {
    event.preventDefault();
    showView('#overview');
  });

  const initialHash = ['#reports', '#accounts'].includes(window.location.hash)
    ? window.location.hash
    : '#overview';
  showView(initialHash);
}
