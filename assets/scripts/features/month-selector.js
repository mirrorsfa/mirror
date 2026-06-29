export function createMonthSelector({ store, showToast }) {
  const monthLabel = document.querySelector('#monthLabel');

  document.querySelector('#prevMonth').addEventListener('click', () => {
    store.changeMonth(-1);
    showToast('已切换到上个月');
  });
  document.querySelector('#nextMonth').addEventListener('click', () => {
    store.changeMonth(1);
    showToast('已切换到下个月');
  });

  function render(state) {
    const year = state.selectedMonth.getFullYear();
    const month = state.selectedMonth.getMonth() + 1;
    monthLabel.innerHTML = `${year}年 ${month}月 <span>⌄</span>`;
  }

  return { render };
}
