export function toMonthKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function fromMonthKey(key) {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

export function toDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isSameMonth(isoDate, monthDate) {
  const date = new Date(isoDate);
  return date.getFullYear() === monthDate.getFullYear()
    && date.getMonth() === monthDate.getMonth();
}

export function formatTransactionTime(isoDate) {
  const date = new Date(isoDate);
  const today = new Date();
  const datePart = toDateInputValue(date);
  const todayPart = toDateInputValue(today);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const prefix = datePart === todayPart
    ? '今天'
    : datePart === toDateInputValue(yesterday)
      ? '昨天'
      : `${date.getMonth() + 1}月${date.getDate()}日`;

  return `${prefix} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
