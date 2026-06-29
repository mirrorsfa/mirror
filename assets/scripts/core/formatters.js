export function formatMoney(value, showSign = false) {
  const absolute = Math.abs(value).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  if (!showSign) return `${value < 0 ? '- ' : ''}¥ ${absolute}`;
  return `${value >= 0 ? '+' : '-'} ¥ ${absolute}`;
}

export function escapeHtml(value) {
  const node = document.createElement('div');
  node.textContent = value;
  return node.innerHTML;
}
