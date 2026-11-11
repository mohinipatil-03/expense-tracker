-- ===================================================
-- Personal Expense Tracker - Seed Data
-- ===================================================

USE `expense_tracker_db`;

-- Seed Income Categories
INSERT IGNORE INTO `categories` (`id`, `name`, `type`, `icon`, `color`, `is_default`) VALUES
(1, 'Salary', 'income', 'bi-cash-coin', '#10b981', 1),
(2, 'Freelance', 'income', 'bi-laptop', '#06b6d4', 1),
(3, 'Investments', 'income', 'bi-graph-up-arrow', '#8b5cf6', 1),
(4, 'Business', 'income', 'bi-briefcase', '#3b82f6', 1),
(5, 'Side Hustle', 'income', 'bi-stars', '#ec4899', 1),
(6, 'Other Income', 'income', 'bi-wallet2', '#64748b', 1);

-- Seed Expense Categories
INSERT IGNORE INTO `categories` (`id`, `name`, `type`, `icon`, `color`, `is_default`) VALUES
(7, 'Rent & Housing', 'expense', 'bi-house-door', '#ef4444', 1),
(8, 'Groceries', 'expense', 'bi-cart4', '#f97316', 1),
(9, 'Dining Out', 'expense', 'bi-cup-hot', '#f59e0b', 1),
(10, 'Utilities & Bills', 'expense', 'bi-lightning-charge', '#eab308', 1),
(11, 'Transportation', 'expense', 'bi-car-front', '#84cc16', 1),
(12, 'Entertainment', 'expense', 'bi-film', '#06b6d4', 1),
(13, 'Shopping', 'expense', 'bi-bag-check', '#ec4899', 1),
(14, 'Health & Medical', 'expense', 'bi-heart-pulse', '#14b8a6', 1),
(15, 'Education', 'expense', 'bi-book', '#6366f1', 1),
(16, 'Travel', 'expense', 'bi-airplane', '#a855f7', 1),
(17, 'Miscellaneous', 'expense', 'bi-three-dots', '#94a3b8', 1);

-- Seed Monthly Budgets for November 2026 (Month 11, Year 2026)
INSERT INTO `budgets` (`category_id`, `month`, `year`, `amount`) VALUES
(7, 11, 2026, 1200.00), -- Rent & Housing
(8, 11, 2026, 450.00),  -- Groceries
(9, 11, 2026, 250.00),  -- Dining Out
(10, 11, 2026, 180.00), -- Utilities
(11, 11, 2026, 160.00), -- Transportation
(12, 11, 2026, 140.00), -- Entertainment
(13, 11, 2026, 200.00), -- Shopping
(14, 11, 2026, 100.00)  -- Health
ON DUPLICATE KEY UPDATE `amount` = VALUES(`amount`);

-- Seed Transactions for November 2026 (and late October 2026)
INSERT INTO `transactions` (`type`, `amount`, `category_id`, `date`, `payment_method`, `description`) VALUES
-- Incomes (November 2026)
('income', 4500.00, 1, '2026-11-01', 'Bank Transfer', 'Monthly Primary Salary'),
('income', 850.00, 2, '2026-11-05', 'PayPal', 'Web Design Client Project'),
('income', 320.00, 3, '2026-11-08', 'Bank Transfer', 'Quarterly Stock Dividend'),

-- Incomes (October 2026 for month-over-month comparison)
('income', 4500.00, 1, '2026-10-01', 'Bank Transfer', 'Monthly Primary Salary'),
('income', 600.00, 2, '2026-10-15', 'PayPal', 'Client Consulting'),

-- Expenses (October 2026)
('expense', 1200.00, 7, '2026-10-02', 'Bank Transfer', 'Apartment Rent'),
('expense', 410.00, 8, '2026-10-12', 'Debit Card', 'Monthly Groceries'),
('expense', 230.00, 9, '2026-10-18', 'Credit Card', 'Weekend Dinners'),
('expense', 170.00, 10, '2026-10-20', 'Direct Debit', 'Electric & Water Bills'),
('expense', 130.00, 11, '2026-10-25', 'Credit Card', 'Fuel & Public Transit'),

-- Expenses (November 2026 - Current Month)
('expense', 1200.00, 7, '2026-11-02', 'Bank Transfer', 'Apartment Rent Payment'),
('expense', 145.20, 8, '2026-11-03', 'Credit Card', 'Weekly Supermarket Run'),
('expense', 188.50, 8, '2026-11-07', 'Credit Card', 'Organic Market Groceries'),
('expense', 120.00, 8, '2026-11-10', 'Debit Card', 'Fresh Bakery & Pantry Restock'), -- Total Groceries: $453.70 (Alert: Exceeded $450 budget!)
('expense', 65.00, 9, '2026-11-03', 'Credit Card', 'Dinner with Coworkers'),
('expense', 42.50, 9, '2026-11-06', 'UPI / Mobile', 'Artisan Coffee & Lunch'),
('expense', 110.00, 9, '2026-11-09', 'Credit Card', 'Sushi Date Night'), -- Total Dining Out: $217.50 (Warning: 87% of $250 budget!)
('expense', 95.00, 10, '2026-11-04', 'Direct Debit', 'High-Speed Fiber Internet'),
('expense', 75.00, 10, '2026-11-08', 'Direct Debit', 'Electricity Utility Bill'),
('expense', 45.00, 11, '2026-11-04', 'Credit Card', 'Metro Monthly Pass'),
('expense', 55.00, 11, '2026-11-09', 'Debit Card', 'Gas Station Refill'),
('expense', 29.99, 12, '2026-11-02', 'Credit Card', 'Streaming Subscriptions'),
('expense', 85.00, 12, '2026-11-07', 'Credit Card', 'Concert Tickets'),
('expense', 149.00, 13, '2026-11-05', 'Credit Card', 'Ergonomic Office Chair Cushion & Supplies');
