-- TransitOps Signup — MySQL 8 Schema
-- Run this against your MySQL server before starting the backend.

CREATE DATABASE IF NOT EXISTS transitops
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE transitops;

-- ============================================================
-- users table — database.md §1
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('fleet_manager','driver','safety_officer','financial_analyst') NOT NULL,
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
