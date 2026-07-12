# TransitOps — Smart Transport Operations Platform

A modern, role-based fleet and transport management platform developed for ODOO-HACKATHON2026. This project includes a robust Node.js/MySQL backend API for authentication and a sleek, dynamic frontend dashboard designed for various organizational roles.

## 🚀 Features

- **Role-Based Access Control (RBAC):** Custom dashboard views for different roles (`fleet_manager`, `driver`, `safety_officer`, `financial_analyst`).
- **Secure Authentication:** JWT-based stateless authentication with password hashing (bcrypt) and rate-limiting.
- **Dynamic Frontend:** Vanilla JS + CSS implementation with a high-fidelity dark-mode UI inspired by modern design systems.
- **Automated Database Seeding:** Instant demo environment setup with interrelated demo accounts upon server startup.
- **RESTful API:** Clear, structured endpoints for user management and authentication.

## 🛠 Tech Stack

### Frontend
- HTML5, CSS3, Vanilla JavaScript
- Modular Architecture with Role-Based UI Rendering
- Responsive design with custom CSS tokens

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL 8
- **Security:** Helmet, CORS, Express Rate Limit, bcryptjs, jsonwebtoken

## 📦 Project Structure

```text
signup-raajit/
├── backend/
│   ├── src/           # Controllers, Middleware, Routes, DB Config
│   ├── app.js         # Express App Setup
│   ├── server.js      # Server Entry Point & Seeding trigger
│   ├── schema.sql     # Database Schema
│   └── initDb.js      # Script to initialize Database
└── frontend/
    ├── css/           # Styling (Dark mode UI tokens)
    ├── js/            # API client, Auth logic, Dashboard controller
    ├── index.html     # Sign Up Page
    ├── login.html     # Sign In Page
    └── dashboard.html # Role-Based Dashboard
```

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- MySQL (v8+)

### 1. Database Setup
1. Start your local MySQL server.
2. Navigate to the `backend` directory and configure the environment variables:
   ```bash
   cd backend
   cp .env.example .env
   ```
3. Update `backend/.env` with your MySQL credentials (ensure `DB_PASS` is set correctly).
4. Run the database initialization script to create the database and tables:
   ```bash
   node initDb.js
   ```

### 2. Running the Backend
```bash
cd backend
npm install
npm run dev
```
*The backend will run on `http://localhost:3005` and automatically seed demo accounts.*

### 3. Running the Frontend
You can serve the `frontend` folder using any local web server. If you have `serve` installed globally or via npx:
```bash
cd frontend
npx serve . -p 5500
```
*Access the app at `http://localhost:5500`*

## 👥 Demo Accounts
Upon starting the backend, 4 interconnected demo accounts are automatically provisioned. Use the password `password123` for all of them:

- **Fleet Manager:** `fleet@transitops.demo`
- **Driver:** `driver@transitops.demo`
- **Safety Officer:** `safety@transitops.demo`
- **Financial Analyst:** `finance@transitops.demo`

## 🛡️ Security Features
- **Rate Limiting:** Prevents brute force login attempts (max 5 requests / 15 mins).
- **Helmet JS:** Hardens response headers.
- **JWT Protection:** Short-lived JWTs govern access to secure dashboard routes.
