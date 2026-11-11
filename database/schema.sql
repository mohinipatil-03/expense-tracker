-- ===================================================
-- Personal Expense Tracker - MySQL Database Schema
-- Compatible with MySQL 8.0+
-- ===================================================

CREATE DATABASE IF NOT EXISTS `expense_tracker_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `expense_tracker_db`;

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('income', 'expense') NOT NULL,
  `icon` VARCHAR(50) NOT NULL DEFAULT 'bi-tag',
  `color` VARCHAR(20) NOT NULL DEFAULT '#6366f1',
  `is_default` BOOLEAN NOT NULL DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_category_name_type` (`name`, `type`)
) ENGINE=InnoDB;

-- 2. Budgets Table (Per Category, Per Month/Year)
CREATE TABLE IF NOT EXISTS `budgets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT NOT NULL,
  `month` TINYINT UNSIGNED NOT NULL, -- 1 to 12
  `year` SMALLINT UNSIGNED NOT NULL,  -- e.g. 2026
  `amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_budget_category_month_year` (`category_id`, `month`, `year`)
) ENGINE=InnoDB;

-- 3. Transactions Table
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` ENUM('income', 'expense') NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `category_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'Credit Card',
  `description` VARCHAR(255) NOT NULL DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Indexes for optimal querying
CREATE INDEX `idx_transactions_date` ON `transactions` (`date`);
CREATE INDEX `idx_transactions_category_id` ON `transactions` (`category_id`);
CREATE INDEX `idx_transactions_type_date` ON `transactions` (`type`, `date`);
CREATE INDEX `idx_budgets_lookup` ON `budgets` (`year`, `month`, `category_id`);
