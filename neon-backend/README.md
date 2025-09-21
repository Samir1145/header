# NEON Backend Server

## Quick Start

1. **Create environment file:**
```bash
cp .env.sample .env
```

2. **Edit .env file with your PostgreSQL connection:**
```env
DATABASE_URL=postgresql://username:password@hostname:port/database_name
PORT=4000
NODE_ENV=development
```

3. **Start the server:**
```bash
npm start
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (required)
- `PORT` - Server port (default: 4000)
- `NODE_ENV` - Environment (development/production)

## API Endpoints

- `GET /health` - Health check
- `GET /api/claimant/:number` - Search claimant
- `GET /api/schema` - Database schema info

## Database Schema Required

The server expects these tables:
- `public.claimants` - Claimant details
- `public.payment_1` to `public.payment_5` - Payment data
