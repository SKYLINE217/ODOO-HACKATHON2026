/**
 * Environment configuration — loads .env and exports validated config.
 * security.md §1: All secrets in .env, never committed.
 */

const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'transitops',
  },

  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },

  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  rateLimit: {
    windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 10) || 900000,
    max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX, 10) || 5,
  },
};

module.exports = config;
