/**
 * Main Application Logic for ButterBudget
 */

const CURRENCIES = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)', locale: 'en-IN' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar ($)', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro (€)', locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound (£)', locale: 'en-GB' },
  AED: { code: 'AED', symbol: 'AED ', name: 'UAE Dirham (AED)', locale: 'ar-AE' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen (¥)', locale: 'ja-JP' },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CA$)', locale: 'en-CA' },
  AUD: { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar (AU$)', locale: 'en-AU' }
};

const App = {
  state: {
    month: 11,
    year: 2026,
    activeTab: 'dashboard',
    currency: CURRENCIES.INR, // Default to INR
    categories: [],
    transactions: [],
    budgets: [],
    summary: {},
    reports: {},
    editingTransactionId: null
  },

  async init() {
    this.initTheme();
    this.initCurrency();
    this.initMonthPicker();
    this.bindEvents();
    await this.checkHealth();
    await this.loadAll();
  },

  // ---------------- Currency Management ----------------
  initCurrency() {
    const savedCode = localStorage.getItem('butterbudget_currency');
    if (savedCode && CURRENCIES[savedCode]) {
      this.state.currency = CURRENCIES[savedCode];
    } else {
      // Default to INR
      this.state.currency = CURRENCIES.INR;
      // Show onboarding prompt to ask for currency first!
      setTimeout(() => this.openCurrencyModal(true), 300);
    }
    this.applyCurrency();
  },

  setCurrency(code) {
    if (!CURRENCIES[code]) return;
    this.state.currency = CURRENCIES[code];
    localStorage.setItem('butterbudget_currency', code);
    this.applyCurrency();
    this.renderAll();
    this.showToast(`Currency changed to ${this.state.currency.name}`, 'warning');
  },

  applyCurrency() {
    const cur = this.state.currency;
    ChartsManager.setCurrencySymbol(cur.symbol);

    // Update navbar select if present
    const navSelect = document.getElementById('navbar-currency-select');
    if (navSelect) navSelect.value = cur.code;

    // Update modal inputs & labels
    document.querySelectorAll('.currency-symbol-label').forEach(el => {
      el.textContent = cur.symbol.trim();
    });

    // Highlight active option in modal
    document.querySelectorAll('.currency-card-option').forEach(card => {
      card.classList.toggle('active-currency', card.getAttribute('data-code') === cur.code);
    });
  },

  openCurrencyModal(isOnboarding = false) {
    const modalEl = document.getElementById('currencyModal');
    if (!modalEl) return;
    const modal = new bootstrap.Modal(modalEl, {
      backdrop: isOnboarding ? 'static' : true,
      keyboard: !isOnboarding
    });
    this.applyCurrency();
    modal.show();
  },

  formatMoney(val) {
    const num = Number(val) || 0;
    const cur = this.state.currency;
    return `${cur.symbol}${num.toLocaleString(cur.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },

  // ---------------- Theme Management ----------------
  initTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-bs-theme', saved);
    this.updateThemeIcon(saved);
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-bs-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-bs-theme', next);
    localStorage.setItem('theme', next);
    this.updateThemeIcon(next);
    ChartsManager.updateAllThemeColors();
  },

  updateThemeIcon(theme) {
    const icon = document.getElementById('theme-icon');
    if (!icon) return;
    if (theme === 'dark') {
      icon.className = 'bi bi-sun-fill text-warning';
    } else {
      icon.className = 'bi bi-moon-stars-fill text-butter-dark';
    }
  },

  // ---------------- Month & Year Controls ----------------
  initMonthPicker() {
    this.state.month = 11;
    this.state.year = 2026;
    this.updateMonthDisplay();
  },

  updateMonthDisplay() {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const label = `${monthNames[this.state.month - 1]} ${this.state.year}`;
    const el = document.getElementById('current-month-display');
    if (el) el.textContent = label;

    const reportMonthEl = document.getElementById('report-month-title');
    if (reportMonthEl) reportMonthEl.textContent = label;

    const budgetMonthEl = document.getElementById('budget-month-title');
    if (budgetMonthEl) budgetMonthEl.textContent = label;
  },

  prevMonth() {
    if (this.state.month === 1) {
      this.state.month = 12;
      this.state.year -= 1;
    } else {
      this.state.month -= 1;
    }
    this.updateMonthDisplay();
    this.loadAll();
  },

  nextMonth() {
    if (this.state.month === 12) {
      this.state.month = 1;
      this.state.year += 1;
    } else {
      this.state.month += 1;
    }
    this.updateMonthDisplay();
    this.loadAll();
  },

  resetToCurrentMonth() {
    const now = new Date();
    this.state.month = now.getMonth() + 1;
    this.state.year = now.getFullYear();
    this.updateMonthDisplay();
    this.loadAll();
  },

  // ---------------- Health & Database Status ----------------
  async checkHealth() {
    try {
      const data = await API.getHealth();
      const badge = document.getElementById('db-status-badge');
      if (badge && data.database) {
        if (data.database.isMySQL) {
          badge.className = 'badge bg-success-subtle text-success border border-success-subtle d-inline-flex align-items-center gap-1';
          badge.innerHTML = `<i class="bi bi-database-check"></i> MySQL Connected`;
          badge.title = `Host: ${data.database.host}:${data.database.port} | DB: ${data.database.database}`;
        } else {
          badge.className = 'badge bg-warning-subtle text-dark border border-warning-subtle d-inline-flex align-items-center gap-1';
          badge.innerHTML = `<i class="bi bi-hdd-network"></i> Local DB (MySQL Ready)`;
          badge.title = `Operating in local resilient storage. Run 'npm run db:setup' when MySQL is configured.`;
        }
      }
    } catch (err) {
      console.warn('Health check error:', err);
    }
  },

  // ---------------- Data Loading ----------------
  async loadAll() {
    try {
      this.showLoading(true);
      await Promise.all([
        this.loadCategories(),
        this.loadSummary(),
        this.loadTransactions(),
        this.loadBudgets(),
        this.loadReports()
      ]);
      this.renderAll();
    } catch (err) {
      this.showToast('Error loading data: ' + err.message, 'danger');
    } finally {
      this.showLoading(false);
    }
  },

  async loadCategories() {
    this.state.categories = await API.getCategories();
    this.populateCategorySelects();
  },

  async loadSummary() {
    this.state.summary = await API.getSummary(this.state.month, this.state.year);
  },

  async loadTransactions() {
    const search = document.getElementById('search-input')?.value || '';
    const type = document.getElementById('filter-type')?.value || 'all';
    const category_id = document.getElementById('filter-category')?.value || 'all';

    this.state.transactions = await API.getTransactions({
      month: this.state.month,
      year: this.state.year,
      type,
      category_id,
      search
    });
  },

  async loadBudgets() {
    this.state.budgets = await API.getBudgets(this.state.month, this.state.year);
  },

  async loadReports() {
    this.state.reports = await API.getReports(this.state.month, this.state.year);
  },

  // ---------------- UI Rendering ----------------
  renderAll() {
    this.renderSummary();
    this.renderBudgetAlerts();
    this.renderCharts();
    this.renderTransactions();
    this.renderBudgetsList();
    this.renderCategoriesList();
    this.renderMonthlyReportTable();
  },

  renderSummary() {
    const s = this.state.summary || {};
    const income = s.income || 0;
    const expense = s.expense || 0;
    const balance = s.balance || 0;
    const savingsRate = s.savingsRate || 0;

    const incomeEl = document.getElementById('metric-income');
    const expenseEl = document.getElementById('metric-expense');
    const balanceEl = document.getElementById('metric-balance');
    const savingsRateEl = document.getElementById('metric-savings-rate');
    const savingsBarEl = document.getElementById('savings-rate-bar');

    if (incomeEl) incomeEl.textContent = this.formatMoney(income);
    if (expenseEl) expenseEl.textContent = this.formatMoney(expense);
    if (balanceEl) {
      balanceEl.textContent = this.formatMoney(balance);
      balanceEl.className = balance >= 0 ? 'fw-bold text-success' : 'fw-bold text-danger';
    }
    if (savingsRateEl) savingsRateEl.textContent = `${savingsRate}%`;
    if (savingsBarEl) {
      const clampPct = Math.min(100, Math.max(0, savingsRate));
      savingsBarEl.style.width = `${clampPct}%`;
      savingsBarEl.className = `progress-bar ${savingsRate >= 20 ? 'bg-success' : savingsRate > 0 ? 'bg-warning' : 'bg-danger'}`;
    }

    // Comparison Badges
    const incGrowthEl = document.getElementById('income-growth-badge');
    if (incGrowthEl) {
      if (s.incomeGrowth !== null) {
        const isPos = s.incomeGrowth >= 0;
        incGrowthEl.className = `badge ${isPos ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`;
        incGrowthEl.innerHTML = `<i class="bi bi-arrow-${isPos ? 'up' : 'down'}"></i> ${Math.abs(s.incomeGrowth)}% vs last mo`;
      } else {
        incGrowthEl.className = 'badge bg-secondary-subtle text-secondary';
        incGrowthEl.textContent = 'No prior data';
      }
    }

    const expGrowthEl = document.getElementById('expense-growth-badge');
    if (expGrowthEl) {
      if (s.expenseGrowth !== null) {
        const isUp = s.expenseGrowth >= 0;
        expGrowthEl.className = `badge ${isUp ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'}`;
        expGrowthEl.innerHTML = `<i class="bi bi-arrow-${isUp ? 'up' : 'down'}"></i> ${Math.abs(s.expenseGrowth)}% vs last mo`;
      } else {
        expGrowthEl.className = 'badge bg-secondary-subtle text-secondary';
        expGrowthEl.textContent = 'No prior data';
      }
    }
  },

  // ---------------- Budget Limit Alerts ----------------
  renderBudgetAlerts() {
    const alertsContainer = document.getElementById('budget-alerts-container');
    if (!alertsContainer) return;

    const budgets = this.state.budgets || [];
    const exceeded = budgets.filter(b => b.status === 'exceeded');
    const warning = budgets.filter(b => b.status === 'warning');

    if (exceeded.length === 0 && warning.length === 0) {
      alertsContainer.innerHTML = '';
      alertsContainer.classList.add('d-none');
      return;
    }

    alertsContainer.classList.remove('d-none');

    let html = '';
    // Exceeded alerts
    exceeded.forEach(b => {
      html += `
        <div class="budget-alert-card mb-2 d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div class="d-flex align-items-center gap-3">
            <div class="fs-3 text-danger"><i class="bi bi-exclamation-octagon-fill"></i></div>
            <div>
              <div class="fw-bold text-danger d-flex align-items-center gap-2">
                <span>Budget Limit Exceeded!</span>
                <span class="badge bg-danger pulse-badge">${b.percentage}% used</span>
              </div>
              <div class="small text-muted">
                You have spent <strong>${this.formatMoney(b.spent)}</strong> on <strong>${b.category_name}</strong>, exceeding your monthly limit of <strong>${this.formatMoney(b.amount)}</strong> by <span class="text-danger fw-bold">+${this.formatMoney(b.overBy)}</span>.
              </div>
            </div>
          </div>
          <button class="btn btn-sm btn-outline-danger" onclick="App.openBudgetModal(${b.category_id}, ${b.amount})">
            Adjust Limit
          </button>
        </div>
      `;
    });

    // Warning alerts (80% - 99%)
    warning.forEach(b => {
      html += `
        <div class="budget-alert-card warning-level mb-2 d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div class="d-flex align-items-center gap-3">
            <div class="fs-3 text-warning"><i class="bi bi-exclamation-triangle-fill"></i></div>
            <div>
              <div class="fw-bold text-warning d-flex align-items-center gap-2">
                <span>Budget Approaching Limit</span>
                <span class="badge bg-warning text-dark">${b.percentage}% used</span>
              </div>
              <div class="small text-muted">
                <strong>${b.category_name}</strong> is at <strong>${b.percentage}%</strong> of budget (${this.formatMoney(b.spent)} of ${this.formatMoney(b.amount)}). Only <strong>${this.formatMoney(b.remaining)}</strong> remaining for this month.
              </div>
            </div>
          </div>
          <button class="btn btn-sm btn-outline-warning text-dark" onclick="App.openBudgetModal(${b.category_id}, ${b.amount})">
            Adjust Limit
          </button>
        </div>
      `;
    });

    alertsContainer.innerHTML = html;
  },

  // ---------------- Charts ----------------
  renderCharts() {
    const rep = this.state.reports || {};
    if (rep.historyMonths) {
      ChartsManager.renderHistoryChart('chart-history', rep.historyMonths);
    }
    if (rep.expenseByCategory) {
      ChartsManager.renderDoughnutChart('chart-categories', rep.expenseByCategory);
    }
    if (rep.dailySpending) {
      ChartsManager.renderDailyTrendChart('chart-daily-trend', rep.dailySpending);
    }
    if (rep.budgets && rep.budgets.length > 0) {
      ChartsManager.renderBudgetBarChart('chart-budgets-bar', rep.budgets);
    }
  },

  // ---------------- Transactions List ----------------
  renderTransactions() {
    const listEl = document.getElementById('transactions-table-body');
    const recentEl = document.getElementById('recent-transactions-list');
    const txs = this.state.transactions || [];

    if (listEl) {
      if (txs.length === 0) {
        listEl.innerHTML = `
          <tr>
            <td colspan="7" class="text-center py-5 text-muted">
              <i class="bi bi-inbox fs-1 d-block mb-2 text-secondary opacity-50"></i>
              No transactions found for this period. Click "+ Add Transaction" to create one.
            </td>
          </tr>
        `;
      } else {
        listEl.innerHTML = txs.map(t => `
          <tr>
            <td class="text-nowrap fw-semibold">${t.date}</td>
            <td>
              <span class="badge ${t.type === 'income' ? 'badge-income' : 'badge-expense'}">
                <i class="bi bi-${t.type === 'income' ? 'arrow-down-left' : 'arrow-up-right'}"></i> ${t.type.toUpperCase()}
              </span>
            </td>
            <td>
              <span class="badge-category" style="background-color: ${t.category_color}22; color: ${t.category_color}">
                <i class="bi ${t.category_icon || 'bi-tag'}"></i> ${t.category_name}
              </span>
            </td>
            <td>
              <span class="fw-medium">${this.escapeHtml(t.description || '-')}</span>
            </td>
            <td>
              <span class="text-muted small"><i class="bi bi-credit-card me-1"></i>${t.payment_method || 'Cash'}</span>
            </td>
            <td class="text-end fw-bold ${t.type === 'income' ? 'amount-income' : 'amount-expense'}">
              ${t.type === 'income' ? '+' : '-'}${this.formatMoney(t.amount)}
            </td>
            <td class="text-end text-nowrap">
              <button class="btn btn-sm btn-light border me-1" title="Edit" onclick="App.openEditTransactionModal(${t.id})">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" title="Delete" onclick="App.deleteTransaction(${t.id})">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        `).join('');
      }
    }

    if (recentEl) {
      const top5 = txs.slice(0, 5);
      if (top5.length === 0) {
        recentEl.innerHTML = `<div class="text-center py-4 text-muted small">No recent activity.</div>`;
      } else {
        recentEl.innerHTML = top5.map(t => `
          <div class="d-flex align-items-center justify-content-between p-3 border-bottom">
            <div class="d-flex align-items-center gap-3">
              <div class="rounded-circle d-flex align-items-center justify-content-center" 
                   style="width: 40px; height: 40px; background-color: ${t.category_color}22; color: ${t.category_color}; font-size: 1.1rem;">
                <i class="bi ${t.category_icon || 'bi-tag'}"></i>
              </div>
              <div>
                <div class="fw-semibold text-truncate" style="max-width: 200px;">${this.escapeHtml(t.description || t.category_name)}</div>
                <div class="small text-muted">${t.date} &bull; ${t.payment_method}</div>
              </div>
            </div>
            <div class="text-end">
              <div class="fw-bold ${t.type === 'income' ? 'amount-income' : 'amount-expense'}">
                ${t.type === 'income' ? '+' : '-'}${this.formatMoney(t.amount)}
              </div>
              <span class="badge ${t.type === 'income' ? 'badge-income' : 'badge-expense'} py-0">${t.category_name}</span>
            </div>
          </div>
        `).join('');
      }
    }

    const countEl = document.getElementById('transaction-count');
    if (countEl) countEl.textContent = `${txs.length} transactions`;
  },

  // ---------------- Budgets List Tab ----------------
  renderBudgetsList() {
    const container = document.getElementById('budgets-grid');
    if (!container) return;

    const budgets = this.state.budgets || [];
    if (budgets.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5 text-muted">
          <i class="bi bi-bullseye fs-1 d-block mb-2 text-secondary opacity-50"></i>
          <h5>No budgets set for this month</h5>
          <p class="small">Click "Set Budget Limit" above to add spending guardrails for your categories.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = budgets.map(b => {
      let progressColor = 'bg-success';
      let statusBadge = '<span class="badge bg-success-subtle text-success">Within Budget</span>';

      if (b.status === 'exceeded') {
        progressColor = 'bg-danger';
        statusBadge = `<span class="badge bg-danger pulse-badge">Over Limit by ${this.formatMoney(b.overBy)}</span>`;
      } else if (b.status === 'warning') {
        progressColor = 'bg-warning';
        statusBadge = `<span class="badge bg-warning text-dark">Warning (Near Limit)</span>`;
      }

      return `
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="card h-100 p-3 ${b.status === 'exceeded' ? 'border-danger' : ''}">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <div class="d-flex align-items-center gap-2">
                <div class="rounded-circle d-flex align-items-center justify-content-center"
                     style="width: 38px; height: 38px; background-color: ${b.category_color}22; color: ${b.category_color};">
                  <i class="bi ${b.category_icon || 'bi-tag'}"></i>
                </div>
                <div>
                  <h6 class="mb-0 fw-bold">${b.category_name}</h6>
                  <span class="small text-muted">Monthly Limit: ${this.formatMoney(b.amount)}</span>
                </div>
              </div>
              <button class="btn btn-sm btn-light border" title="Edit Budget" onclick="App.openBudgetModal(${b.category_id}, ${b.amount})">
                <i class="bi bi-pencil"></i>
              </button>
            </div>

            <div class="my-3">
              <div class="d-flex justify-content-between small mb-1">
                <span class="text-muted">Spent: <strong>${this.formatMoney(b.spent)}</strong></span>
                <span class="fw-bold ${b.status === 'exceeded' ? 'text-danger' : ''}">${b.percentage}%</span>
              </div>
              <div class="progress progress-budget">
                <div class="progress-bar ${progressColor}" role="progressbar" 
                     style="width: ${Math.min(100, b.percentage)}%" 
                     aria-valuenow="${b.percentage}" aria-valuemin="0" aria-valuemax="100">
                </div>
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
              <span class="small text-muted">
                ${b.status === 'exceeded' 
                  ? `<span class="text-danger fw-semibold">-${this.formatMoney(b.overBy)} over</span>` 
                  : `<span>${this.formatMoney(b.remaining)} left</span>`}
              </span>
              ${statusBadge}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // ---------------- Monthly Report Table ----------------
  renderMonthlyReportTable() {
    const tableBody = document.getElementById('report-category-breakdown');
    if (!tableBody) return;

    const rep = this.state.reports || {};
    const categories = rep.expenseByCategory || [];
    const totalExpense = this.state.summary.expense || 1;

    if (categories.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No expenses recorded for this month.</td></tr>`;
      return;
    }

    tableBody.innerHTML = categories.map((cat, idx) => {
      const pct = ((cat.total / totalExpense) * 100).toFixed(1);
      return `
        <tr>
          <td><span class="fw-bold text-muted">${idx + 1}</span></td>
          <td>
            <span class="badge-category" style="background-color: ${cat.color}22; color: ${cat.color}">
              <i class="bi ${cat.icon || 'bi-tag'}"></i> ${cat.name}
            </span>
          </td>
          <td class="fw-bold">${this.formatMoney(cat.total)}</td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <div class="progress flex-grow-1" style="height: 8px;">
                <div class="progress-bar" style="width: ${pct}%; background-color: ${cat.color};"></div>
              </div>
              <span class="small fw-semibold" style="width: 45px;">${pct}%</span>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  // ---------------- Categories Management Tab ----------------
  renderCategoriesList() {
    const incomeListEl = document.getElementById('income-categories-list');
    const expenseListEl = document.getElementById('expense-categories-list');

    const cats = this.state.categories || [];
    const incomeCats = cats.filter(c => c.type === 'income');
    const expenseCats = cats.filter(c => c.type === 'expense');

    if (incomeListEl) {
      incomeListEl.innerHTML = incomeCats.map(c => `
        <div class="d-flex align-items-center justify-content-between p-2 border-bottom">
          <div class="d-flex align-items-center gap-2">
            <div class="rounded-circle d-flex align-items-center justify-content-center"
                 style="width: 32px; height: 32px; background-color: ${c.color}22; color: ${c.color};">
              <i class="bi ${c.icon}"></i>
            </div>
            <span class="fw-semibold">${c.name}</span>
          </div>
          <div>
            ${!c.is_default ? `
              <button class="btn btn-sm btn-outline-danger py-0 px-2" onclick="App.deleteCategory(${c.id})">
                <i class="bi bi-trash"></i>
              </button>
            ` : '<span class="badge bg-secondary-subtle text-secondary small">Default</span>'}
          </div>
        </div>
      `).join('');
    }

    if (expenseListEl) {
      expenseListEl.innerHTML = expenseCats.map(c => `
        <div class="d-flex align-items-center justify-content-between p-2 border-bottom">
          <div class="d-flex align-items-center gap-2">
            <div class="rounded-circle d-flex align-items-center justify-content-center"
                 style="width: 32px; height: 32px; background-color: ${c.color}22; color: ${c.color};">
              <i class="bi ${c.icon}"></i>
            </div>
            <span class="fw-semibold">${c.name}</span>
          </div>
          <div>
            ${!c.is_default ? `
              <button class="btn btn-sm btn-outline-danger py-0 px-2" onclick="App.deleteCategory(${c.id})">
                <i class="bi bi-trash"></i>
              </button>
            ` : '<span class="badge bg-secondary-subtle text-secondary small">Default</span>'}
          </div>
        </div>
      `).join('');
    }
  },

  populateCategorySelects() {
    const txCatSelect = document.getElementById('tx-category');
    const filterCatSelect = document.getElementById('filter-category');
    const budgetCatSelect = document.getElementById('budget-category');

    const txType = document.querySelector('input[name="tx-type"]:checked')?.value || 'expense';
    const cats = this.state.categories || [];

    if (txCatSelect) {
      const filtered = cats.filter(c => c.type === txType);
      txCatSelect.innerHTML = filtered.map(c => `
        <option value="${c.id}">${c.name}</option>
      `).join('');
    }

    if (filterCatSelect) {
      const currentVal = filterCatSelect.value;
      filterCatSelect.innerHTML = `
        <option value="all">All Categories</option>
        ${cats.map(c => `<option value="${c.id}">${c.name} (${c.type})</option>`).join('')}
      `;
      filterCatSelect.value = currentVal || 'all';
    }

    if (budgetCatSelect) {
      const expCats = cats.filter(c => c.type === 'expense');
      budgetCatSelect.innerHTML = expCats.map(c => `
        <option value="${c.id}">${c.name}</option>
      `).join('');
    }
  },

  // ---------------- Modals & CRUD Actions ----------------
  openAddTransactionModal(defaultType = 'expense') {
    this.state.editingTransactionId = null;
    document.getElementById('txModalLabel').textContent = defaultType === 'income' ? 'Add New Income' : 'Add New Expense';

    const typeRadio = document.getElementById(`tx-type-${defaultType}`);
    if (typeRadio) typeRadio.checked = true;

    this.populateCategorySelects();

    document.getElementById('tx-amount').value = '';
    document.getElementById('tx-date').value = new Date().toISOString().substring(0, 10);
    document.getElementById('tx-payment-method').value = 'UPI / Mobile';
    document.getElementById('tx-description').value = '';

    const modal = new bootstrap.Modal(document.getElementById('transactionModal'));
    modal.show();
  },

  openEditTransactionModal(id) {
    const tx = this.state.transactions.find(t => t.id === id);
    if (!tx) return;

    this.state.editingTransactionId = id;
    document.getElementById('txModalLabel').textContent = 'Edit Transaction';

    const typeRadio = document.getElementById(`tx-type-${tx.type}`);
    if (typeRadio) typeRadio.checked = true;

    this.populateCategorySelects();

    document.getElementById('tx-amount').value = tx.amount;
    document.getElementById('tx-category').value = tx.category_id;
    document.getElementById('tx-date').value = tx.date;
    document.getElementById('tx-payment-method').value = tx.payment_method || 'Cash';
    document.getElementById('tx-description').value = tx.description || '';

    const modal = new bootstrap.Modal(document.getElementById('transactionModal'));
    modal.show();
  },

  async saveTransaction() {
    const type = document.querySelector('input[name="tx-type"]:checked')?.value;
    const amount = parseFloat(document.getElementById('tx-amount').value);
    const category_id = parseInt(document.getElementById('tx-category').value, 10);
    const date = document.getElementById('tx-date').value;
    const payment_method = document.getElementById('tx-payment-method').value;
    const description = document.getElementById('tx-description').value.trim();

    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }
    if (!date) {
      alert('Please select a valid date.');
      return;
    }

    try {
      if (this.state.editingTransactionId) {
        await API.updateTransaction(this.state.editingTransactionId, {
          type, amount, category_id, date, payment_method, description
        });
        this.showToast('Transaction updated successfully!', 'success');
      } else {
        await API.addTransaction({
          type, amount, category_id, date, payment_method, description
        });
        this.showToast('Transaction added successfully!', 'success');
      }

      bootstrap.Modal.getInstance(document.getElementById('transactionModal')).hide();
      await this.loadAll();
    } catch (err) {
      alert(err.message);
    }
  },

  async deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await API.deleteTransaction(id);
      this.showToast('Transaction deleted', 'info');
      await this.loadAll();
    } catch (err) {
      alert(err.message);
    }
  },

  openBudgetModal(categoryId = null, currentAmount = null) {
    this.populateCategorySelects();
    const catSelect = document.getElementById('budget-category');
    const amtInput = document.getElementById('budget-amount');

    if (categoryId && catSelect) {
      catSelect.value = categoryId;
    }
    if (currentAmount !== null && amtInput) {
      amtInput.value = currentAmount;
    } else if (amtInput) {
      amtInput.value = '';
    }

    const modal = new bootstrap.Modal(document.getElementById('budgetModal'));
    modal.show();
  },

  async saveBudget() {
    const category_id = parseInt(document.getElementById('budget-category').value, 10);
    const amount = parseFloat(document.getElementById('budget-amount').value);

    if (isNaN(amount) || amount < 0) {
      alert('Please enter a valid budget limit amount.');
      return;
    }

    try {
      await API.setBudget({
        category_id,
        month: this.state.month,
        year: this.state.year,
        amount
      });
      this.showToast('Budget limit saved successfully!', 'success');
      bootstrap.Modal.getInstance(document.getElementById('budgetModal')).hide();
      await this.loadAll();
    } catch (err) {
      alert(err.message);
    }
  },

  openAddCategoryModal() {
    document.getElementById('cat-name').value = '';
    document.getElementById('cat-type').value = 'expense';
    document.getElementById('cat-color').value = '#facc15';
    document.getElementById('cat-icon').value = 'bi-tag';

    const modal = new bootstrap.Modal(document.getElementById('categoryModal'));
    modal.show();
  },

  async saveCategory() {
    const name = document.getElementById('cat-name').value.trim();
    const type = document.getElementById('cat-type').value;
    const color = document.getElementById('cat-color').value;
    const icon = document.getElementById('cat-icon').value;

    if (!name) {
      alert('Please enter a category name');
      return;
    }

    try {
      await API.addCategory({ name, type, color, icon });
      this.showToast(`Category "${name}" created!`, 'success');
      bootstrap.Modal.getInstance(document.getElementById('categoryModal')).hide();
      await this.loadAll();
    } catch (err) {
      alert(err.message);
    }
  },

  async deleteCategory(id) {
    if (!confirm('Are you sure you want to delete this custom category?')) return;
    try {
      await API.deleteCategory(id);
      this.showToast('Category deleted', 'info');
      await this.loadAll();
    } catch (err) {
      alert(err.message);
    }
  },

  // ---------------- Exporting ----------------
  exportData(format) {
    const m = this.state.month;
    const y = this.state.year;
    window.location.href = `/api/export?format=${format}&month=${m}&year=${y}`;
  },

  printReport() {
    window.print();
  },

  // ---------------- Utilities ----------------
  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  showLoading(isLoading) {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
      loader.classList.toggle('d-none', !isLoading);
    }
  },

  showToast(message, type = 'success') {
    const toastEl = document.getElementById('app-toast');
    const toastBody = document.getElementById('app-toast-body');
    if (toastEl && toastBody) {
      toastBody.textContent = message;
      toastEl.className = `toast align-items-center text-bg-${type} border-0`;
      const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
      toast.show();
    }
  },

  // ---------------- Event Listeners ----------------
  bindEvents() {
    // Theme Switch
    document.getElementById('theme-toggle')?.addEventListener('click', () => this.toggleTheme());

    // Currency Switcher in Navbar
    document.getElementById('navbar-currency-select')?.addEventListener('change', (e) => {
      this.setCurrency(e.target.value);
    });

    // Month Navigation
    document.getElementById('prev-month-btn')?.addEventListener('click', () => this.prevMonth());
    document.getElementById('next-month-btn')?.addEventListener('click', () => this.nextMonth());
    document.getElementById('current-month-btn')?.addEventListener('click', () => this.resetToCurrentMonth());

    // Transaction Type Radio Switch inside Modal updates category dropdown
    document.querySelectorAll('input[name="tx-type"]').forEach(r => {
      r.addEventListener('change', () => this.populateCategorySelects());
    });

    // Filters
    document.getElementById('search-input')?.addEventListener('input', () => this.loadTransactions().then(() => this.renderTransactions()));
    document.getElementById('filter-type')?.addEventListener('change', () => this.loadTransactions().then(() => this.renderTransactions()));
    document.getElementById('filter-category')?.addEventListener('change', () => this.loadTransactions().then(() => this.renderTransactions()));
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
