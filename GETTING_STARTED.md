# KOCO Payroll Management System - Getting Started

## Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- npm (v8 or higher)
- Supabase account

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Set Up Environment Variables

#### Backend Environment (.env)
Copy `backend/.env.example` to `backend/.env` and fill in your Supabase credentials:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
PORT=5000
FRONTEND_URL=http://localhost:3000
```

#### Frontend Environment (.env)
Copy `frontend/.env.example` to `frontend/.env` and fill in your Supabase credentials:
```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
REACT_APP_API_URL=http://localhost:5000
```

### 3. Set Up Database
Follow the instructions in `shared/database/README.md` to set up your Supabase database schema.

### 4. Start Development Servers
```bash
npm run dev
```

This will start both the backend (port 5000) and frontend (port 3000) servers.

## Available Scripts

- `npm run dev` - Start both backend and frontend in development mode
- `npm run dev:backend` - Start only the backend server
- `npm run dev:frontend` - Start only the frontend server
- `npm run build` - Build both applications for production
- `npm run test` - Run tests for both applications
- `npm run lint` - Run linting for both applications
- `npm run lint:fix` - Fix linting issues automatically

## Project Structure

```
KOCO Payroll/
├── backend/          # Node.js Express API server
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── .env.example
├── frontend/         # React.js client application
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── hooks/
│   │   └── lib/
│   ├── package.json
│   └── .env.example
├── shared/           # Shared configurations and schemas
│   └── database/     # Database schema and setup
├── package.json      # Root package.json with workspace scripts
└── README.md
```

## Technology Stack

- **Backend**: Node.js, Express.js, Supabase
- **Frontend**: React.js, Tailwind CSS, React Router, React Query
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth with JWT
- **Deployment**: Vercel (frontend), Railway/Heroku (backend)

## Features Included

### Authentication & Authorization
- User registration and login
- Role-based access control (Admin, HR, Employee)
- JWT token management
- Protected routes

### Employee Management
- Employee profiles and records
- Department and position management
- Role-based data access

### Time Tracking
- Timesheet creation and submission
- Approval workflow
- Time calculation utilities

### Payroll Processing
- Payroll record creation
- Tax and deduction calculations
- Payment tracking

### Dashboard & Reporting
- Overview dashboard with key metrics
- Recent activity tracking
- Quick action buttons

## Development Guidelines

### Code Style
- ESLint configuration included for both frontend and backend
- Prettier configuration for consistent formatting
- Use conventional commit messages

### Security
- Environment variables for sensitive data
- Row Level Security (RLS) in database
- Input validation and sanitization
- Rate limiting on API endpoints

### Testing
- Jest setup for backend testing
- React Testing Library for frontend
- Test coverage reports

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Railway/Heroku)
1. Create a new app on Railway or Heroku
2. Set environment variables
3. Deploy using Git or Docker

### Database (Supabase)
- Database is already hosted on Supabase
- Set up automated backups
- Monitor performance and usage

## Support

For questions or issues:
1. Check the documentation in each directory
2. Review the database schema in `shared/database/`
3. Check environment variable setup
4. Ensure all dependencies are installed correctly

## Next Steps

1. Set up your Supabase project and database
2. Configure environment variables
3. Install dependencies and start development servers
4. Begin customizing the application for your specific needs
5. Add additional features as required

Happy coding! 🚀