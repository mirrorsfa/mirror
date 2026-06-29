import { getTrend } from '../services/ledger-analytics.js';

function formatAxisValue(value) {
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return Math.round(value).toLocaleString('zh-CN');
}

export function createChart(store) {
  const chart = document.querySelector('#barChart');
  const axis = document.querySelector('#chartAxis');
  const rangeButtons = document.querySelectorAll('.segmented button');

  rangeButtons.forEach(button => {
    button.addEventListener('click', () => store.setChartRange(button.dataset.range));
  });

  function render(state) {
    const { buckets, maximum } = getTrend(state);

    rangeButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.range === state.chartRange);
    });

    axis.innerHTML = [1, .75, .5, .25, 0]
      .map(scale => `<span>${formatAxisValue(maximum * scale)}</span>`)
      .join('');

    chart.innerHTML = buckets.map((item, index) => `
      <div class="chart-day ${index === buckets.length - 1 ? 'today' : ''}">
        <i style="height:${item.income / maximum * 100}%" title="收入 ${item.income}"></i>
        <i style="height:${item.expense / maximum * 100}%" title="支出 ${item.expense}"></i>
        <span>${item.label}</span>
      </div>
    `).join('');
  }

  return { render };
}
