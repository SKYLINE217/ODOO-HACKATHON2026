<div align="center">
  <img src="https://img.shields.io/badge/Odoo-Hackathon%202026-714B67?style=for-the-badge&logo=odoo" alt="Odoo Hackathon" />
  <h1>🚀 TransitOps</h1>
  <p><b>Smart, Secure, and Scalable Fleet Operations Platform</b></p>
  
  <p>
    <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" />
    <img src="https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white" />
    <img src="https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white" />
    <img src="https://img.shields.io/badge/Vanilla_JS-F7DF1E?style=flat-square&logo=javascript&logoColor=black" />
    <img src="https://img.shields.io/badge/Status-Production_Ready-success?style=flat-square" />
  </p>
</div>

<br/>

## 🌟 Overview
**TransitOps** is a modern, enterprise-grade fleet and transport management platform developed specifically for the **ODOO-HACKATHON2026**. Featuring a robust Node.js/MySQL backend API and a sleek, dynamic high-fidelity frontend, TransitOps delivers an uncompromising experience for managing multi-vehicle fleets, drivers, complex trips, and financial analytics.

---

## ✨ Key Features

- 🔐 **Strict Role-Based Access Control (RBAC)**  
  Customized views and isolated data permissions for `Fleet Manager`, `Dispatcher`, `Safety Officer`, and `Financial Analyst`. Each role sees only what they need.
- 📊 **Dynamic Financial & Trip Analytics**  
  Interrelated data architecture powers real-time charts via Chart.js. Track monthly fleet distance, fuel efficiency, ROI, and identify your costliest vehicles instantly.
- 🛣️ **Intelligent Dispatching**  
  Advanced trip creation with real-time vehicle capacity validation and driver availability checking.
- 📋 **Automated Public Registration**  
  Public signups automatically provision new users as *Drivers*, simultaneously registering their vehicle and driver profile in the system to reduce onboarding friction.
- 🎨 **High-Fidelity UI/UX**  
  A premium, cinematic dark-mode interface built with Vanilla HTML/CSS/JS, prioritizing typography, micro-animations, and a clutter-free experience.
- 🛡️ **Enterprise Security**  
  JWT-based stateless authentication, bcrypt password hashing, XSS sanitization, rate-limiting, and Helmet.js HTTP header protection.
- 💾 **Instant Database Seeding**  
  Startup the server to instantly generate 10 vehicles, 8 drivers, 15 trips, fuel logs, and interrelated expenses for immediate demonstration.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, Vanilla JS | Modular UI components, Chart.js for analytics, responsive layout. |
| **Backend** | Node.js, Express.js | RESTful API, authentication middleware, rate-limiting, RBAC routing. |
| **Database** | MySQL 8 | Relational database with Foreign Key constraints and cascading data. |
| **Security** | JWT, bcryptjs, Helmet | Stateless auth tokens, robust password encryption, header hardening. |

---

## 🚦 Getting Started

Follow these instructions to get your local environment up and running in minutes.

### Prerequisites
- **Node.js** (v18.x or higher)
- **MySQL** (v8.0 or higher)
- **Git**

### 1️⃣ Database Setup
1. Start your local MySQL server.
2. Navigate to the `backend` directory and set up your environment variables:
   ```bash
   cd backend
   cp .env.example .env
   ```
3. Open `backend/.env` and update the database credentials (specifically `DB_PASS`).
4. Initialize the tables and database schema:
   ```bash
   node initDb.js
   ```

### 2️⃣ Start the Backend Server
```bash
cd backend
npm install
npm run dev
```
> **Note:** The server will run on `http://localhost:3001`. Upon startup, it will automatically populate the database with extensive demo data and users!

### 3️⃣ Launch the Frontend
You can serve the frontend folder using any local web server. The easiest method using `npx`:
```bash
cd frontend
npx serve . -p 5500
```
> **Success:** Access the platform by visiting `http://localhost:5500` in your browser.

---

## 👥 Demo Credentials

The automated seeder provisions **4 distinct roles** for you to test out the RBAC system. 
🔑 **Password for all demo accounts:** `password123`

| Role | Email | Capabilities |
| :--- | :--- | :--- |
| **Fleet Manager** | `fleet@transitops.demo` | Full access. Manages Vehicles, Drivers, and views Fleet Analytics. |
| **Dispatcher** | `dispatcher@transitops.demo` | Focused access. Creates and dispatches Trips, assigns Drivers/Vehicles. |
| **Safety Officer** | `safety@transitops.demo` | Compliance access. Manages Driver Statuses and monitors ongoing Trips. |
| **Financial Analyst**| `finance@transitops.demo` | Financial access. Logs Fuel/Expenses, views ROI Analytics and total cost metrics. |

---

## 📸 Platform Highlights
- **Intelligent Dashboards:** Real-time summary widgets for active vehicles, drivers on duty, and pending trips.
- **CSV Exports:** Export any operational table (Trips, Vehicles, Expenses) directly to CSV.
- **Dynamic Seeding:** Data is fully interrelated. Adding an expense directly impacts the total operational cost KPI.

---
<div align="center">
  <p>Built with ❤️ for ODOO-HACKATHON2026</p>
</div>
