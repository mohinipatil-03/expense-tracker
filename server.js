require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------------- API Routes ----------------

// System & Database Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: db.getDbStatus()
  });
});

// Summary Stats
app.get('/api/summary', async (req, res) => {
  try {
    const month = req.query.month || new Date().getMonth() + 1;
    const year = req.query.year || new Date().getFullYear();
    const summary = await db.getSummary(month, year);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await db.getCategories();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name, type, icon, color } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }
    const cat = await db.addCategory({ name, type, icon, color });
    res.status(201).json(cat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await db.deleteCategory(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Transactions
app.get('/api/transactions', async (req, res) => {
  try {
    const { month, year, type, category_id, search, limit, offset } = req.query;
    const transactions = await db.getTransactions({
      month,
      year,
      type,
      category_id,
      search,
      limit: limit ? parseInt(limit, 10) : 500,
      offset: offset ? parseInt(offset, 10) : 0
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const { type, amount, category_id, date, payment_method, description } = req.body;
    if (!type || !amount || !category_id || !date) {
      return res.status(400).json({ error: 'Type, amount, category, and date are required' });
    }
    const tx = await db.addTransaction({
      type,
      amount: parseFloat(amount),
      category_id: parseInt(category_id, 10),
      date,
      payment_method: payment_method || 'Cash',
      description: description || ''
    });
    res.status(201).json(tx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/transactions/:id', async (req, res) => {
  try {
    const { type, amount, category_id, date, payment_method, description } = req.body;
    const updated = await db.updateTransaction(req.params.id, {
      type,
      amount: parseFloat(amount),
      category_id: parseInt(category_id, 10),
      date,
      payment_method,
      description
    });
    if (!updated) return res.status(404).json({ error: 'Transaction not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    await db.deleteTransaction(req.params.id);
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Budgets
app.get('/api/budgets', async (req, res) => {
  try {
    const month = req.query.month || new Date().getMonth() + 1;
    const year = req.query.year || new Date().getFullYear();
    const budgets = await db.getBudgets(month, year);
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/budgets', async (req, res) => {
  try {
    const { category_id, month, year, amount } = req.body;
    if (!category_id || !month || !year || amount === undefined) {
      return res.status(400).json({ error: 'Category, month, year, and amount are required' });
    }
    const budget = await db.setBudget({
      category_id: parseInt(category_id, 10),
      month: parseInt(month, 10),
      year: parseInt(year, 10),
      amount: parseFloat(amount)
    });
    res.json(budget);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Analytical Reports (for Chart.js)
app.get('/api/reports', async (req, res) => {
  try {
    const month = req.query.month || new Date().getMonth() + 1;
    const year = req.query.year || new Date().getFullYear();
    const reportData = await db.getReportData(month, year);
    res.json(reportData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export (CSV / JSON)
app.get('/api/export', async (req, res) => {
  try {
    const { format = 'csv', month, year } = req.query;
    const transactions = await db.getTransactions({ month, year, limit: 10000 });

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="transactions_${year || 'all'}_${month || 'all'}.json"`);
      return res.send(JSON.stringify(transactions, null, 2));
    }

    // Default: CSV format
    const headers = ['ID', 'Date', 'Type', 'Category', 'Amount', 'Payment Method', 'Description'];
    const rows = transactions.map(t => [
      t.id,
      t.date,
      t.type,
      `"${(t.category_name || '').replace(/"/g, '""')}"`,
      t.amount,
      `"${(t.payment_method || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="transactions_${year || 'all'}_${month || 'all'}.csv"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback to SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
    if (err && !res.headersSent) {
      res.status(err.status || 404).end();
    }
  });
});

// Start Server
async function start() {
  await db.initDatabase();
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🧈 ButterBudget running at:`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}

start();
