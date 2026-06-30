const DEFAULT_API_BASE = 'http://127.0.0.1:8000/api/v1';
const TOKEN_KEY = 'today-ledger:access-token';

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function fromApiTransaction(item) {
  const amount = Number(item.amount);
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    account: item.account,
    accountId: item.account_id,
    date: item.occurred_at,
    amount: item.transaction_type === 'income' ? amount : -amount,
    icon: item.icon,
    color: item.color
  };
}

function toApiTransaction(item) {
  return {
    name: item.name,
    transaction_type: item.amount > 0 ? 'income' : 'expense',
    category: item.category,
    account: item.account,
    account_id: item.accountId ?? null,
    amount: Math.abs(item.amount).toFixed(2),
    occurred_at: item.date,
    icon: item.icon,
    color: item.color
  };
}

export function createLedgerApi(
  baseUrl = globalThis.LEDGER_API_BASE ?? DEFAULT_API_BASE,
  tokenKey = TOKEN_KEY
) {
  let accessToken = window.localStorage.getItem(tokenKey);

  async function request(path, options = {}) {
    let response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...options.headers
        },
        ...options
      });
    } catch (error) {
      const apiError = new ApiError('无法连接数据服务，请确认后端已经启动。');
      apiError.cause = error;
      throw apiError;
    }

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const detail = typeof body?.detail === 'string' ? body.detail : '数据服务请求失败';
      if (response.status === 401) {
        accessToken = null;
        window.localStorage.removeItem(tokenKey);
      }
      throw new ApiError(detail, response.status);
    }
    if (response.status === 204) return null;
    return response.json();
  }

  return {
    hasToken() {
      return Boolean(accessToken);
    },

    async register(payload) {
      const result = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      accessToken = result.access_token;
      window.localStorage.setItem(tokenKey, accessToken);
      return result.user;
    },

    async login(payload) {
      const result = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      accessToken = result.access_token;
      window.localStorage.setItem(tokenKey, accessToken);
      return result.user;
    },

    async me() {
      return request('/auth/me');
    },

    logout() {
      accessToken = null;
      window.localStorage.removeItem(tokenKey);
    },

    async health() {
      return request('/health');
    },

    async listTransactions(year) {
      const items = await request(`/transactions?year=${year}&limit=500`);
      return items.map(fromApiTransaction);
    },

    async listAccounts() {
      return request('/accounts');
    },

    async createAccount(account) {
      return request('/accounts', {
        method: 'POST',
        body: JSON.stringify(account)
      });
    },

    async updateAccount(id, account) {
      return request(`/accounts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(account)
      });
    },

    async removeAccount(id) {
      await request(`/accounts/${id}`, { method: 'DELETE' });
    },

    async getAdminSummary() {
      return request('/admin/summary');
    },

    async listAdminUsers() {
      return request('/admin/users');
    },

    async updateAdminUser(id, changes) {
      return request(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(changes)
      });
    },

    async createTransaction(transaction) {
      const item = await request('/transactions', {
        method: 'POST',
        body: JSON.stringify(toApiTransaction(transaction))
      });
      return fromApiTransaction(item);
    },

    async updateTransaction(id, transaction) {
      const item = await request(`/transactions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(toApiTransaction(transaction))
      });
      return fromApiTransaction(item);
    },

    async removeTransaction(id) {
      await request(`/transactions/${id}`, { method: 'DELETE' });
    },

    async getBudget(period) {
      const budget = await request(`/budgets/${period}`);
      return Number(budget.amount);
    },

    async setBudget(period, amount) {
      const budget = await request(`/budgets/${period}`, {
        method: 'PUT',
        body: JSON.stringify({ amount: Number(amount).toFixed(2) })
      });
      return Number(budget.amount);
    }
  };
}
