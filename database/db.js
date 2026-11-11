require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

let pool = null;
let dbMode = 'mysql'; // 'mysql' | 'local'
let dbError = null;

// Initial Default Dataset for local fallback
const initialData = {
  categories: [
    { id: 1, name: 'Salary', type: 'income', icon: 'bi-cash-coin', color: '#10b981', is_default: 1 },
    { id: 2, name: 'Freelance', type: 'income', icon: 'bi-laptop', color: '#06b6d4', is_default: 1 },
    { id: 3, name: 'Investments', type: 'income', icon: 'bi-graph-up-arrow', color: '#8b5cf6', is_default: 1 },
    { id: 4, name: 'Business', type: 'income', icon: 'bi-briefcase', color: '#3b82f6', is_default: 1 },
    { id: 5, name: 'Side Hustle', type: 'income', icon: 'bi-stars', color: '#ec4899', is_default: 1 },
    { id: 6, name: 'Other Income', type: 'income', icon: 'bi-wallet2', color: '#64748b', is_default: 1 },
    { id: 7, name: 'Rent & Housing', type: 'expense', icon: 'bi-house-door', color: '#ef4444', is_default: 1 },
    { id: 8, name: 'Groceries', type: 'expense', icon: 'bi-cart4', color: '#f97316', is_default: 1 },
    { id: 9, name: 'Dining Out', type: 'expense', icon: 'bi-cup-hot', color: '#f59e0b', is_default: 1 },
    { id: 10, name: 'Utilities & Bills', type: 'expense', icon: 'bi-lightning-charge', color: '#eab308', is_default: 1 },
    { id: 11, name: 'Transportation', type: 'expense', icon: 'bi-car-front', color: '#84cc16', is_default: 1 },
    { id: 12, name: 'Entertainment', type: 'expense', icon: 'bi-film', color: '#06b6d4', is_default: 1 },
    { id: 13, name: 'Shopping', type: 'expense', icon: 'bi-bag-check', color: '#ec4899', is_default: 1 },
    { id: 14, name: 'Health & Medical', type: 'expense', icon: 'bi-heart-pulse', color: '#14b8a6', is_default: 1 },
    { id: 15, name: 'Education', type: 'expense', icon: 'bi-book', color: '#6366f1', is_default: 1 },
    { id: 16, name: 'Travel', type: 'expense', icon: 'bi-airplane', color: '#a855f7', is_default: 1 },
    { id: 17, name: 'Miscellaneous', type: 'expense', icon: 'bi-three-dots', color: '#94a3b8', is_default: 1 }
  ],
  budgets: [
    { id: 1, category_id: 7, month: 11, year: 2026, amount: 1200.00 },
    { id: 2, category_id: 8, month: 11, year: 2026, amount: 450.00 },
    { id: 3, category_id: 9, month: 11, year: 2026, amount: 250.00 },
    { id: 4, category_id: 10, month: 11, year: 2026, amount: 180.00 },
    { id: 5, category_id: 11, month: 11, year: 2026, amount: 160.00 },
    { id: 6, category_id: 12, month: 11, year: 2026, amount: 140.00 },
    { id: 7, category_id: 13, month: 11, year: 2026, amount: 200.00 },
    { id: 8, category_id: 14, month: 11, year: 2026, amount: 100.00 }
  ],
  transactions: [
    { id: 1, type: 'income', amount: 4500.00, category_id: 1, date: '2026-11-01', payment_method: 'Bank Transfer', description: 'Monthly Primary Salary' },
    { id: 2, type: 'income', amount: 850.00, category_id: 2, date: '2026-11-05', payment_method: 'PayPal', description: 'Web Design Client Project' },
    { id: 3, type: 'income', amount: 320.00, category_id: 3, date: '2026-11-08', payment_method: 'Bank Transfer', description: 'Quarterly Stock Dividend' },
    { id: 4, type: 'income', amount: 4500.00, category_id: 1, date: '2026-10-01', payment_method: 'Bank Transfer', description: 'Monthly Primary Salary' },
    { id: 5, type: 'income', amount: 600.00, category_id: 2, date: '2026-10-15', payment_method: 'PayPal', description: 'Client Consulting' },
    { id: 6, type: 'expense', amount: 1200.00, category_id: 7, date: '2026-10-02', payment_method: 'Bank Transfer', description: 'Apartment Rent' },
    { id: 7, type: 'expense', amount: 410.00, category_id: 8, date: '2026-10-12', payment_method: 'Debit Card', description: 'Monthly Groceries' },
    { id: 8, type: 'expense', amount: 230.00, category_id: 9, date: '2026-10-18', payment_method: 'Credit Card', description: 'Weekend Dinners' },
    { id: 9, type: 'expense', amount: 170.00, category_id: 10, date: '2026-10-20', payment_method: 'Direct Debit', description: 'Electric & Water Bills' },
    { id: 10, type: 'expense', amount: 130.00, category_id: 11, date: '2026-10-25', payment_method: 'Credit Card', description: 'Fuel & Public Transit' },
    { id: 11, type: 'expense', amount: 1200.00, category_id: 7, date: '2026-11-02', payment_method: 'Bank Transfer', description: 'Apartment Rent Payment' },
    { id: 12, type: 'expense', amount: 145.20, category_id: 8, date: '2026-11-03', payment_method: 'Credit Card', description: 'Weekly Supermarket Run' },
    { id: 13, type: 'expense', amount: 188.50, category_id: 8, date: '2026-11-07', payment_method: 'Credit Card', description: 'Organic Market Groceries' },
    { id: 14, type: 'expense', amount: 120.00, category_id: 8, date: '2026-11-10', payment_method: 'Debit Card', description: 'Fresh Bakery & Pantry Restock' },
    { id: 15, type: 'expense', amount: 65.00, category_id: 9, date: '2026-11-03', payment_method: 'Credit Card', description: 'Dinner with Coworkers' },
    { id: 16, type: 'expense', amount: 42.50, category_id: 9, date: '2026-11-06', payment_method: 'UPI / Mobile', description: 'Artisan Coffee & Lunch' },
    { id: 17, type: 'expense', amount: 110.00, category_id: 9, date: '2026-11-09', payment_method: 'Credit Card', description: 'Sushi Date Night' },
    { id: 18, type: 'expense', amount: 95.00, category_id: 10, date: '2026-11-04', payment_method: 'Direct Debit', description: 'High-Speed Fiber Internet' },
    { id: 19, type: 'expense', amount: 75.00, category_id: 10, date: '2026-11-08', payment_method: 'Direct Debit', description: 'Electricity Utility Bill' },
    { id: 20, type: 'expense', amount: 45.00, category_id: 11, date: '2026-11-04', payment_method: 'Credit Card', description: 'Metro Monthly Pass' },
    { id: 21, type: 'expense', amount: 55.00, category_id: 11, date: '2026-11-09', payment_method: 'Debit Card', description: 'Gas Station Refill' },
    { id: 22, type: 'expense', amount: 29.99, category_id: 12, date: '2026-11-02', payment_method: 'Credit Card', description: 'Streaming Subscriptions' },
    { id: 23, type: 'expense', amount: 85.00, category_id: 12, date: '2026-11-07', payment_method: 'Credit Card', description: 'Concert Tickets' },
    { id: 24, type: 'expense', amount: 149.00, category_id: 13, date: '2026-11-05', payment_method: 'Credit Card', description: 'Ergonomic Office Chair Cushion & Supplies' }
  ],
  nextTransactionId: 25,
  nextCategoryId: 18,
  nextBudgetId: 9
};

function readLocalData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading local data file:', err);
    return initialData;
  }
}

function writeLocalData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local data file:', err);
  }
}

async function initDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'expense_tracker_db';

  try {
    const testPool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 2000
    });

    // Test a basic query
    const [rows] = await testPool.query('SELECT 1 + 1 AS result');
    pool = testPool;
    dbMode = 'mysql';
    console.log(`[Database] Successfully connected to MySQL at ${host}:${port}/${database}`);
  } catch (err) {
    dbMode = 'local';
    dbError = err.message;
    console.warn(`[Database] MySQL connection failed (${err.message}). Using local JSON storage fallback.`);
    console.warn(`[Database] Full MySQL setup is available in ./database/schema.sql and ./database/seed.sql.`);
    // Ensure local store file exists
    readLocalData();
  }
}

function getDbStatus() {
  return {
    mode: dbMode,
    isMySQL: dbMode === 'mysql',
    database: process.env.DB_NAME || 'expense_tracker_db',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '3306',
    error: dbError
  };
}

// ----------------- Categories API -----------------
async function getCategories() {
  if (dbMode === 'mysql') {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY type DESC, name ASC');
    return rows;
  }
  const data = readLocalData();
  return [...data.categories].sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name));
}

async function addCategory({ name, type, icon, color }) {
  if (dbMode === 'mysql') {
    const [result] = await pool.query(
      'INSERT INTO categories (name, type, icon, color, is_default) VALUES (?, ?, ?, ?, 0)',
      [name, type, icon || 'bi-tag', color || '#6366f1']
    );
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [result.insertId]);
    return rows[0];
  }
  const data = readLocalData();
  const newCat = {
    id: data.nextCategoryId++,
    name,
    type,
    icon: icon || 'bi-tag',
    color: color || '#6366f1',
    is_default: 0
  };
  data.categories.push(newCat);
  writeLocalData(data);
  return newCat;
}

async function deleteCategory(id) {
  const catId = parseInt(id, 10);
  if (dbMode === 'mysql') {
    await pool.query('DELETE FROM categories WHERE id = ?', [catId]);
    return true;
  }
  const data = readLocalData();
  data.categories = data.categories.filter(c => c.id !== catId);
  data.budgets = data.budgets.filter(b => b.category_id !== catId);
  writeLocalData(data);
  return true;
}

// ----------------- Budgets API -----------------
async function getBudgets(month, year) {
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);

  if (dbMode === 'mysql') {
    const sql = `
      SELECT 
        b.id,
        b.category_id,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        b.month,
        b.year,
        CAST(b.amount AS DOUBLE) AS amount,
        COALESCE(SUM(t.amount), 0) AS spent
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      LEFT JOIN transactions t ON t.category_id = b.category_id 
        AND MONTH(t.date) = b.month 
        AND YEAR(t.date) = b.year 
        AND t.type = 'expense'
      WHERE b.month = ? AND b.year = ?
      GROUP BY b.id, b.category_id, c.name, c.icon, c.color, b.month, b.year, b.amount
      ORDER BY b.amount DESC
    `;
    const [rows] = await pool.query(sql, [m, y]);
    return rows.map(r => {
      const spent = parseFloat(r.spent) || 0;
      const amount = parseFloat(r.amount) || 0;
      const percentage = amount > 0 ? (spent / amount) * 100 : 0;
      let status = 'safe';
      if (percentage >= 100) status = 'exceeded';
      else if (percentage >= 80) status = 'warning';

      return {
        ...r,
        amount,
        spent,
        remaining: Math.max(0, amount - spent),
        overBy: Math.max(0, spent - amount),
        percentage: Number(percentage.toFixed(1)),
        status
      };
    });
  }

  const data = readLocalData();
  const catMap = new Map(data.categories.map(c => [c.id, c]));

  const monthBudgets = data.budgets.filter(b => b.month === m && b.year === y);
  return monthBudgets.map(b => {
    const cat = catMap.get(b.category_id) || { name: 'Unknown', icon: 'bi-tag', color: '#6366f1' };
    const spent = data.transactions
      .filter(t => t.category_id === b.category_id && t.type === 'expense')
      .filter(t => {
        const d = new Date(t.date);
        return (d.getMonth() + 1) === m && d.getFullYear() === y;
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const amount = Number(b.amount);
    const percentage = amount > 0 ? (spent / amount) * 100 : 0;
    let status = 'safe';
    if (percentage >= 100) status = 'exceeded';
    else if (percentage >= 80) status = 'warning';

    return {
      id: b.id,
      category_id: b.category_id,
      category_name: cat.name,
      category_icon: cat.icon,
      category_color: cat.color,
      month: b.month,
      year: b.year,
      amount,
      spent: Number(spent.toFixed(2)),
      remaining: Number(Math.max(0, amount - spent).toFixed(2)),
      overBy: Number(Math.max(0, spent - amount).toFixed(2)),
      percentage: Number(percentage.toFixed(1)),
      status
    };
  }).sort((a, b) => b.amount - a.amount);
}

async function setBudget({ category_id, month, year, amount }) {
  const catId = parseInt(category_id, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  const amt = parseFloat(amount);

  if (dbMode === 'mysql') {
    const sql = `
      INSERT INTO budgets (category_id, month, year, amount)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE amount = VALUES(amount)
    `;
    await pool.query(sql, [catId, m, y, amt]);
    return { category_id: catId, month: m, year: y, amount: amt };
  }

  const data = readLocalData();
  const existing = data.budgets.find(b => b.category_id === catId && b.month === m && b.year === y);
  if (existing) {
    existing.amount = amt;
  } else {
    data.budgets.push({
      id: data.nextBudgetId++,
      category_id: catId,
      month: m,
      year: y,
      amount: amt
    });
  }
  writeLocalData(data);
  return { category_id: catId, month: m, year: y, amount: amt };
}

// ----------------- Transactions API -----------------
async function getTransactions({ month, year, type, category_id, search, limit = 500, offset = 0 }) {
  if (dbMode === 'mysql') {
    const conditions = [];
    const params = [];

    if (month && year) {
      conditions.push('MONTH(t.date) = ? AND YEAR(t.date) = ?');
      params.push(parseInt(month, 10), parseInt(year, 10));
    } else if (year) {
      conditions.push('YEAR(t.date) = ?');
      params.push(parseInt(year, 10));
    }

    if (type && type !== 'all') {
      conditions.push('t.type = ?');
      params.push(type);
    }

    if (category_id && category_id !== 'all') {
      conditions.push('t.category_id = ?');
      params.push(parseInt(category_id, 10));
    }

    if (search && search.trim()) {
      conditions.push('(t.description LIKE ? OR t.payment_method LIKE ? OR c.name LIKE ?)');
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT 
        t.id,
        t.type,
        CAST(t.amount AS DOUBLE) as amount,
        t.category_id,
        DATE_FORMAT(t.date, '%Y-%m-%d') AS date,
        t.payment_method,
        t.description,
        t.created_at,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      ${whereClause}
      ORDER BY t.date DESC, t.id DESC
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit, 10), parseInt(offset, 10));
    const [rows] = await pool.query(sql, params);
    return rows;
  }

  const data = readLocalData();
  const catMap = new Map(data.categories.map(c => [c.id, c]));

  let filtered = data.transactions.map(t => {
    const cat = catMap.get(t.category_id) || { name: 'Unknown', icon: 'bi-tag', color: '#6366f1' };
    return {
      ...t,
      amount: Number(t.amount),
      category_name: cat.name,
      category_icon: cat.icon,
      category_color: cat.color
    };
  });

  if (month && year) {
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    filtered = filtered.filter(t => {
      const d = new Date(t.date);
      return (d.getMonth() + 1) === m && d.getFullYear() === y;
    });
  } else if (year) {
    const y = parseInt(year, 10);
    filtered = filtered.filter(t => new Date(t.date).getFullYear() === y);
  }

  if (type && type !== 'all') {
    filtered = filtered.filter(t => t.type === type);
  }

  if (category_id && category_id !== 'all') {
    const cId = parseInt(category_id, 10);
    filtered = filtered.filter(t => t.category_id === cId);
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(t => 
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.payment_method && t.payment_method.toLowerCase().includes(q)) ||
      (t.category_name && t.category_name.toLowerCase().includes(q))
    );
  }

  filtered.sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id);
  return filtered.slice(offset, offset + limit);
}

async function addTransaction({ type, amount, category_id, date, payment_method, description }) {
  const amt = parseFloat(amount);
  const catId = parseInt(category_id, 10);

  if (dbMode === 'mysql') {
    const sql = `
      INSERT INTO transactions (type, amount, category_id, date, payment_method, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [type, amt, catId, date, payment_method || 'Cash', description || '']);
    const [rows] = await pool.query(`
      SELECT 
        t.id, t.type, CAST(t.amount AS DOUBLE) as amount, t.category_id,
        DATE_FORMAT(t.date, '%Y-%m-%d') AS date, t.payment_method, t.description,
        c.name AS category_name, c.icon AS category_icon, c.color AS category_color
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `, [result.insertId]);
    return rows[0];
  }

  const data = readLocalData();
  const cat = data.categories.find(c => c.id === catId) || { name: 'Unknown', icon: 'bi-tag', color: '#6366f1' };
  const newTx = {
    id: data.nextTransactionId++,
    type,
    amount: amt,
    category_id: catId,
    date,
    payment_method: payment_method || 'Cash',
    description: description || '',
    category_name: cat.name,
    category_icon: cat.icon,
    category_color: cat.color
  };
  data.transactions.push(newTx);
  writeLocalData(data);
  return newTx;
}

async function updateTransaction(id, { type, amount, category_id, date, payment_method, description }) {
  const txId = parseInt(id, 10);
  const amt = parseFloat(amount);
  const catId = parseInt(category_id, 10);

  if (dbMode === 'mysql') {
    const sql = `
      UPDATE transactions 
      SET type = ?, amount = ?, category_id = ?, date = ?, payment_method = ?, description = ?
      WHERE id = ?
    `;
    await pool.query(sql, [type, amt, catId, date, payment_method, description, txId]);
    const [rows] = await pool.query(`
      SELECT 
        t.id, t.type, CAST(t.amount AS DOUBLE) as amount, t.category_id,
        DATE_FORMAT(t.date, '%Y-%m-%d') AS date, t.payment_method, t.description,
        c.name AS category_name, c.icon AS category_icon, c.color AS category_color
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `, [txId]);
    return rows[0];
  }

  const data = readLocalData();
  const tx = data.transactions.find(t => t.id === txId);
  if (!tx) return null;

  const cat = data.categories.find(c => c.id === catId) || { name: 'Unknown', icon: 'bi-tag', color: '#6366f1' };
  tx.type = type;
  tx.amount = amt;
  tx.category_id = catId;
  tx.date = date;
  tx.payment_method = payment_method;
  tx.description = description;

  writeLocalData(data);
  return {
    ...tx,
    category_name: cat.name,
    category_icon: cat.icon,
    category_color: cat.color
  };
}

async function deleteTransaction(id) {
  const txId = parseInt(id, 10);
  if (dbMode === 'mysql') {
    await pool.query('DELETE FROM transactions WHERE id = ?', [txId]);
    return true;
  }
  const data = readLocalData();
  data.transactions = data.transactions.filter(t => t.id !== txId);
  writeLocalData(data);
  return true;
}

// ----------------- Reports & Analytics API -----------------
async function getSummary(month, year) {
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);

  // Previous month calculation
  let prevM = m - 1;
  let prevY = y;
  if (prevM === 0) {
    prevM = 12;
    prevY = y - 1;
  }

  const currentTxs = await getTransactions({ month: m, year: y, limit: 10000 });
  const prevTxs = await getTransactions({ month: prevM, year: prevY, limit: 10000 });

  let income = 0;
  let expense = 0;
  for (const t of currentTxs) {
    if (t.type === 'income') income += Number(t.amount);
    else if (t.type === 'expense') expense += Number(t.amount);
  }

  let prevIncome = 0;
  let prevExpense = 0;
  for (const t of prevTxs) {
    if (t.type === 'income') prevIncome += Number(t.amount);
    else if (t.type === 'expense') prevExpense += Number(t.amount);
  }

  const balance = income - expense;
  const savingsRate = income > 0 ? ((balance / income) * 100) : 0;

  const incomeGrowth = prevIncome > 0 ? (((income - prevIncome) / prevIncome) * 100) : null;
  const expenseGrowth = prevExpense > 0 ? (((expense - prevExpense) / prevExpense) * 100) : null;

  return {
    month: m,
    year: y,
    income: Number(income.toFixed(2)),
    expense: Number(expense.toFixed(2)),
    balance: Number(balance.toFixed(2)),
    savingsRate: Number(savingsRate.toFixed(1)),
    prevIncome: Number(prevIncome.toFixed(2)),
    prevExpense: Number(prevExpense.toFixed(2)),
    incomeGrowth: incomeGrowth !== null ? Number(incomeGrowth.toFixed(1)) : null,
    expenseGrowth: expenseGrowth !== null ? Number(expenseGrowth.toFixed(1)) : null,
    transactionCount: currentTxs.length
  };
}

async function getReportData(month, year) {
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);

  // 1. Current month category breakdowns
  const transactions = await getTransactions({ month: m, year: y, limit: 10000 });

  const expenseByCategory = {};
  const incomeByCategory = {};
  const dailySpending = {};

  // Days in month
  const daysInMonth = new Date(y, m, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    dailySpending[dayStr] = { date: dayStr, income: 0, expense: 0 };
  }

  for (const t of transactions) {
    const amt = Number(t.amount);
    const dateKey = typeof t.date === 'string' ? t.date.substring(0, 10) : new Date(t.date).toISOString().substring(0, 10);

    if (t.type === 'expense') {
      if (!expenseByCategory[t.category_name]) {
        expenseByCategory[t.category_name] = {
          name: t.category_name,
          color: t.category_color,
          icon: t.category_icon,
          total: 0
        };
      }
      expenseByCategory[t.category_name].total += amt;

      if (dailySpending[dateKey]) {
        dailySpending[dateKey].expense += amt;
      }
    } else if (t.type === 'income') {
      if (!incomeByCategory[t.category_name]) {
        incomeByCategory[t.category_name] = {
          name: t.category_name,
          color: t.category_color,
          icon: t.category_icon,
          total: 0
        };
      }
      incomeByCategory[t.category_name].total += amt;

      if (dailySpending[dateKey]) {
        dailySpending[dateKey].income += amt;
      }
    }
  }

  // 2. Six Month Historical Comparison (Income vs Expense)
  const historyMonths = [];
  for (let i = 5; i >= 0; i--) {
    const targetDate = new Date(y, m - 1 - i, 1);
    const tm = targetDate.getMonth() + 1;
    const ty = targetDate.getFullYear();
    const monthName = targetDate.toLocaleString('default', { month: 'short' });
    const label = `${monthName} ${ty}`;

    const txs = await getTransactions({ month: tm, year: ty, limit: 10000 });
    let inc = 0;
    let exp = 0;
    for (const t of txs) {
      if (t.type === 'income') inc += Number(t.amount);
      if (t.type === 'expense') exp += Number(t.amount);
    }
    historyMonths.push({
      label,
      month: tm,
      year: ty,
      income: Number(inc.toFixed(2)),
      expense: Number(exp.toFixed(2)),
      net: Number((inc - exp).toFixed(2))
    });
  }

  // 3. Budgets with alerts
  const budgets = await getBudgets(m, y);

  return {
    expenseByCategory: Object.values(expenseByCategory).sort((a, b) => b.total - a.total),
    incomeByCategory: Object.values(incomeByCategory).sort((a, b) => b.total - a.total),
    dailySpending: Object.values(dailySpending),
    historyMonths,
    budgets
  };
}

module.exports = {
  initDatabase,
  getDbStatus,
  getCategories,
  addCategory,
  deleteCategory,
  getBudgets,
  setBudget,
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary,
  getReportData
};
