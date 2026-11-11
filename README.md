# 🧈 ButterBudget - Personal Expense & Wealth Manager

A modern, responsive, and practical web application to manage monthly personal income, track expenses, visualize spending with interactive charts, and keep finances in check with proactive budget limit alerts. Features a warm **White & Butter Yellow** aesthetic with global currency support (₹ INR, $ USD, € EUR, £ GBP, AED, ¥ JPY, etc.).

---

## 🌟 Key Features

1. **Income & Expense Management**:
   - Easily log income sources and expense outflows with amounts, dates, categories, payment methods, and descriptions.
   - Edit, delete, and browse transaction histories.
   - Quick filtering by transaction type (Income/Expense), category, and live search keyword.
   - Export your financial records in **CSV** or **JSON** format, or print a monthly summary.

2. **Smart Spending Categorization**:
   - Pre-loaded with comprehensive default categories with custom color palettes and icons:
     - **Income**: Salary, Freelance, Investments, Business, Side Hustle, Other Income.
     - **Expense**: Rent & Housing, Groceries, Dining Out, Utilities & Bills, Transportation, Entertainment, Shopping, Health & Medical, Education, Travel, Miscellaneous.
   - Add custom categories with custom icons and color pickers.

3. **Monthly Expense Reports & Deep Analytics**:
   - Monthly high-level KPI cards: **Total Income**, **Total Expenses**, **Net Savings / Balance**, and **Savings Rate %**.
   - Month-over-month percentage growth indicator compared with prior months.
   - Category-wise spending table featuring percentage share bars and ranking.

4. **Interactive Charts (Powered by Chart.js 4.4)**:
   - **6-Month Cash Flow Trend**: Multi-bar historical chart comparing income vs. expenses over time.
   - **Spending by Category**: Interactive doughnut chart with percentage calculations and custom hover tooltips.
   - **Daily Spending Progression**: Area / line chart tracking daily cash flows across the selected month.
   - **Budget Limit vs. Actual Spending**: Horizontal comparative bar chart highlighting budget utilization per category.

5. **Proactive Budget Limit Alerts**:
   - Set monthly budget ceilings per category.
   - Real-time calculation of spending percentage:
     - 🟢 **Safe** (< 80% used)
     - 🟡 **Warning Alert** (80% – 99% used): Early reminder before exceeding limits.
     - 🔴 **Exceeded Alert** (≥ 100% used): Prominent alert card detailing exactly how much you are over budget.
   - Animated visual badges and color-coded progress bars.

6. **Dual Database Architecture (MySQL 8.0 + Resilient Local Fallback)**:
   - Native **MySQL 8.0** relational database schema with foreign keys, indexes, and constraints (`database/schema.sql`).
   - Automated setup & seeding script (`npm run db:setup`).
   - Seamless local storage fallback if MySQL is offline or during initial configuration, ensuring the app works immediately out of the box.

---

## 🛠️ Technology Stack

- **Frontend**:
  - HTML5 & CSS3 (Custom responsive styling, dark & light theme support)
  - **Bootstrap 5.3** & **Bootstrap Icons**
  - **Chart.js 4.4** (Bar, Doughnut, Line, Horizontal Bar)
  - Vanilla ES6+ JavaScript (Asynchronous API client, DOM rendering)
- **Backend**:
  - **Node.js** with **Express.js** REST API
  - `mysql2/promise` connection pooling
  - `dotenv` configuration management
  - `cors` cross-origin middleware
- **Database**:
  - **MySQL Server 8.0+**
  - Fully compatible with MySQL Workbench, phpMyAdmin, and standard SQL command lines.

---

## 🚀 Quick Start Guide

### 1. Installation

Navigate into the project directory:
```bash
cd expense-tracker
npm install
```

### 2. Configure Environment Variables

Inspect or update the `.env` file with your MySQL server credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=expense_tracker_db
PORT=3000
```

### 3. Setup MySQL Database (Optional / Recommended)

Make sure your MySQL service is running, then run the automated database migration and seed script:
```bash
npm run db:setup
```
*Note: If MySQL is not running or credentials are not yet set, the application will automatically run in local storage mode with full persistence until MySQL is connected.*

### 4. Start the Application

```bash
npm start
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 📁 Project Directory Structure

```
expense-tracker/
├── .env                  # Environment configuration
├── .env.example          # Environment template
├── package.json          # Node dependencies and scripts
├── server.js             # Express server and REST API routes
├── database/
│   ├── schema.sql        # MySQL table definitions and constraints
│   ├── seed.sql          # Sample data (categories, budgets, transactions)
│   ├── db.js             # MySQL driver with local fallback logic
│   └── data.json         # Local fallback persistence store
├── scripts/
│   └── setup-db.js       # Script to initialize MySQL database and tables
├── public/
│   ├── index.html        # Main dashboard SPA interface
│   ├── css/
│   │   └── styles.css    # Custom styling, dark mode, badges, and animations
│   └── js/
│       ├── api.js        # REST API fetch client
│       ├── charts.js     # Chart.js initialization and updates
│       └── app.js        # UI application controller and budget alert logic
└── README.md             # Documentation
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check & MySQL connection status |
| `GET` | `/api/summary?month=M&year=Y` | Monthly income, expense, balance, savings rate |
| `GET` | `/api/transactions?month=M&year=Y` | Filtered list of transactions |
| `POST` | `/api/transactions` | Create a new transaction |
| `PUT` | `/api/transactions/:id` | Update an existing transaction |
| `DELETE`| `/api/transactions/:id` | Delete a transaction |
| `GET` | `/api/budgets?month=M&year=Y` | Category budgets with spending & alert status |
| `POST` | `/api/budgets` | Set or update category budget ceiling |
| `GET` | `/api/categories` | Retrieve all active categories |
| `POST` | `/api/categories` | Create custom category |
| `DELETE`| `/api/categories/:id` | Delete custom category |
| `GET` | `/api/reports?month=M&year=Y` | Chart.js ready datasets (Historical, Categories, Daily) |
| `GET` | `/api/export?format=csv` | Export transactions to CSV or JSON |
