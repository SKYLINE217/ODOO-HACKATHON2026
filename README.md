# TransitOps — ODOO Hackathon 2026

> Smart Transport Operations Platform

## Structure

```
├── concept/          ← All project work lives here
│   ├── backend/      # Node.js + Express API (auth, RBAC, security)
│   ├── *.md          # Spec docs, SKILL execution guides
│   └── README.md     # Team work-split & project overview
└── README.md         # This file
```

## Quick Start

```bash
cd concept/backend
cp .env.example .env     # Fill in JWT_SECRET, DB creds
npm install
npm run seed             # Seed demo data (requires MySQL running)
npm run dev              # Start API server
```

## Team

- **Raajit Singh** — [GitHub](https://github.com/RaajitSingh1306)
