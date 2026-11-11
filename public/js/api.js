/**
 * API Service for Personal Expense Tracker
 */

const API = {
  // Database status
  async getHealth() {
    const res = await fetch('/api/health');
    return res.json();
  },

  // Monthly Summary
  async getSummary(month, year) {
    const res = await fetch(`/api/summary?month=${month}&year=${year}`);
    if (!res.ok) throw new Error('Failed to fetch summary');
    return res.json();
  },

  // Categories
  async getCategories() {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async addCategory(categoryData) {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add category');
    }
    return res.json();
  },

  async deleteCategory(id) {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete category');
    return res.json();
  },

  // Transactions
  async getTransactions(filters = {}) {
    const query = new URLSearchParams();
    if (filters.month) query.append('month', filters.month);
    if (filters.year) query.append('year', filters.year);
    if (filters.type && filters.type !== 'all') query.append('type', filters.type);
    if (filters.category_id && filters.category_id !== 'all') query.append('category_id', filters.category_id);
    if (filters.search) query.append('search', filters.search);
    if (filters.limit) query.append('limit', filters.limit);
    if (filters.offset) query.append('offset', filters.offset);

    const res = await fetch(`/api/transactions?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  async addTransaction(txData) {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add transaction');
    }
    return res.json();
  },

  async updateTransaction(id, txData) {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update transaction');
    }
    return res.json();
  },

  async deleteTransaction(id) {
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete transaction');
    return res.json();
  },

  // Budgets
  async getBudgets(month, year) {
    const res = await fetch(`/api/budgets?month=${month}&year=${year}`);
    if (!res.ok) throw new Error('Failed to fetch budgets');
    return res.json();
  },

  async setBudget(budgetData) {
    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(budgetData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save budget');
    }
    return res.json();
  },

  // Analytical Reports
  async getReports(month, year) {
    const res = await fetch(`/api/reports?month=${month}&year=${year}`);
    if (!res.ok) throw new Error('Failed to fetch report data');
    return res.json();
  }
};
