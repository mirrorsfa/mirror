const STORAGE_KEY = 'today-ledger:v1';

export function createStorage(storage = window.localStorage) {
  function load(fallback) {
    try {
      const saved = storage.getItem(STORAGE_KEY);
      if (!saved) return structuredClone(fallback);
      const parsed = JSON.parse(saved);
      return {
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : fallback.transactions,
        budgets: parsed.budgets && typeof parsed.budgets === 'object' ? parsed.budgets : fallback.budgets
      };
    } catch (error) {
      console.warn('无法读取本地账本，已使用初始数据。', error);
      return structuredClone(fallback);
    }
  }

  function save(data) {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  return { load, save };
}
