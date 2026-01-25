# Africa One Voice (AOV) - Pan-African Digital Talent Show

A production-ready web application for a pan-African digital talent show with paid voting.

## Features

- **Public Pages**: Home, Contestants Gallery, Leaderboard, How It Works, Rules
- **Authentication**: NextAuth.js with email/password, role-based access (VOTER, CONTESTANT, ADMIN)
- **Paid Voting**: Paystack integration for secure payments
- **Admin Dashboard**: Manage contestants, rounds, transactions, and settings
- **Anti-Fraud**: Rate limiting, idempotent webhook processing, transaction flagging

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Auth**: NextAuth.js
- **Payments**: Paystack

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Paystack account (for payments)

### Installation

1. Clone the repository and install dependencies:

```bash
cd app
yarn install
```

2. Set up environment variables:

Copy `.env.example` to `.env` and fill in your values:

```env
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=aov_database

# NextAuth
NEXTAUTH_SECRET=your-super-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3000

# Paystack (Get from https://dashboard.paystack.com/#/settings/developers)
PAYSTACK_PUBLIC_KEY=pk_test_xxx
PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxx

# OTP Mode (dev = use 123456, production = real SMS)
OTP_MODE=dev
DEV_OTP_CODE=123456
```

3. Seed the database with demo data:

```bash
node scripts/seed.js
```

4. Start the development server:

```bash
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Demo Accounts

After running the seed script:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@africaonevoice.com | admin123 |
| Voter | voter@test.com | voter123 |
| Contestant | contestant1@test.com | contestant123 |

## Project Structure

```
app/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # NextAuth + registration
│   │   ├── contestants/  # Contestant CRUD
│   │   ├── rounds/       # Round management
│   │   ├── votes/        # Vote initialization & verification
│   │   ├── webhooks/     # Paystack webhook
│   │   ├── admin/        # Admin endpoints
│   │   └── leaderboard/  # Leaderboard API
│   ├── auth/             # Auth pages
│   ├── contestants/      # Contestant pages
│   ├── admin/            # Admin dashboard
│   ├── dashboard/        # User dashboard
│   └── ...               # Other pages
├── components/           # React components
├── lib/                  # Utilities & models
│   ├── models/           # Mongoose models
│   ├── db.js             # Database connection
│   ├── auth.js           # NextAuth config
│   ├── paystack.js       # Paystack utilities
│   └── helpers.js        # Helper functions
└── scripts/
    └── seed.js           # Database seed script
```

## API Endpoints

### Public
- `GET /api/contestants` - List approved contestants
- `GET /api/contestants/:id` - Get contestant details
- `GET /api/leaderboard` - Get leaderboard
- `GET /api/settings/public` - Get public settings
- `GET /api/rounds` - Get rounds

### Authenticated
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-otp` - Verify phone OTP
- `GET /api/me` - Get current user profile
- `POST /api/contestants` - Create contestant profile
- `POST /api/votes/initialize` - Initialize vote payment
- `GET /api/votes/verify` - Verify payment

### Admin Only
- `GET /api/admin/stats` - Dashboard statistics
- `GET/POST /api/admin/contestants` - Manage contestants
- `PUT /api/admin/contestants/:id` - Approve/reject contestant
- `GET/POST /api/rounds` - Manage rounds
- `GET/PUT /api/admin/transactions` - View/flag transactions
- `GET/PUT /api/admin/settings` - Manage settings

### Webhook
- `POST /api/webhooks/paystack` - Paystack webhook handler

## Paystack Integration

1. Get your API keys from [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developers)
2. Add them to `.env`
3. Set up webhook URL in Paystack dashboard: `https://yourdomain.com/api/webhooks/paystack`
4. The webhook verifies the signature and processes payments idempotently

## Prize Pool

| Position | Prize |
|----------|-------|
| 1st | ₦500,000 |
| 2nd | ₦200,000 |
| 3rd | ₦150,000 |
| 4th | ₦100,000 |
| 5th | ₦50,000 |
| **Total** | **₦1,000,000** |

## License

MIT
