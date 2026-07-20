# InboxSpend AI

Intelligent Expense Tracking and Financial Insights from Gmail.

## Features

- **Google OAuth**: One-click login and Gmail synchronization.
- **AI-Powered Parsing**: Automatically extracts purchases, receipts, and subscriptions from emails using Google's Gemini AI.
- **Smart Subscriptions**: Tracks your active and inactive subscriptions and detects silent price hikes!
- **Interactive Dashboard**: View charts, recent expenses, and export them.
- **Automated Reports**: Schedule or instantly generate PDF/CSV reports to your email.
- **Dark Mode**: Because every app needs one.

## Tech Stack

- **Frontend**: React, Vite, TypeScript, TailwindCSS, Framer Motion, Recharts
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL, Google API Client, Gemini AI
- **Infrastructure**: Docker, Docker Compose

## Installation & Running Locally

1. Clone or download this repository.
2. Initialize environment variables:
   ```bash
   cp .env.example .env
   cp frontend/.env.example frontend/.env
   ```
3. Update `.env` with your Google OAuth credentials and Gemini API Key.
4. Run Docker Compose:
   ```bash
   docker-compose up --build -d
   ```
5. The application will be available at:
   - Frontend: `http://localhost:5173`
   - Backend API Docs: `http://localhost:8000/docs`

## Environment Variables

See `.env.example` in the root and `frontend/.env.example` for required variables. DO NOT commit `.env` files to source control!

## Folder Structure

```text
inboxspend-ai/
├── backend/
│   ├── app/           # FastAPI application code
│   ├── alembic/       # Database migrations
│   ├── Dockerfile     
│   └── requirements.txt
├── frontend/
│   ├── src/           # React frontend code
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml # Orchestrates both services + PostgreSQL
├── .gitignore         # Ignores sensitive files and build artifacts
├── README.md          
└── LICENSE            # MIT License
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
