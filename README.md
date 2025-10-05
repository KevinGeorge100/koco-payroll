# KOCO Payroll Management System

A full-stack payroll management system built with modern technologies.

## Tech Stack

- **Backend**: Node.js with Express.js
- **Frontend**: React.js with Tailwind CSS
- **Database & Auth**: Supabase (PostgreSQL + JWT Authentication)

## Project Structure

```
KOCO Payroll/
├── backend/          # Node.js Express API server
├── frontend/         # React.js client application
├── shared/           # Shared types and utilities
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
2. Set up environment variables (see `.env.example` files)
3. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

### Development

Run both frontend and backend in development mode:

```bash
# Start backend (from root directory)
cd backend
npm run dev

# Start frontend (from root directory, new terminal)
cd frontend
npm start
```

## Features

- Employee management
- Payroll calculation and processing
- Time tracking
- Tax calculations
- Reporting and analytics
- User authentication and authorization

## Environment Setup

See individual `.env.example` files in backend and frontend directories for required environment variables.