# The Solutions BD

High-Performance Computer, Laptop & Tech Mega Store E-Commerce and POS Platform built for Bangladesh.

## 🚀 Features

- **Storefront Web Application (`apps/storefront`)**:
  - Star Tech inspired high-performance mega navbar with top 10 admin-ordered categories and instant dropdown mega menu.
  - Interactive PC Builder simulator with real-time socket compatibility & estimated TDP calculation.
  - Live product search, filter facets (price range, brands, sockets, stock availability).
  - Bangladeshi dual-pricing architecture (Cash Discount Price vs. Regular EMI Price).
  - Standard typography powered by Google Roboto font with crisp hierarchy.

- **Admin & POS Dashboard (`apps/admin`)**:
  - Orders management, deposit verification, and invoice printing.
  - Interactive Categories & Subcategories hierarchy with navbar serial reordering (▲/▼ and direct serial numbers).
  - Products inventory management, branch stocks, warranty tracking.
  - Tech Blog CMS & SEO meta manager.

- **Backend REST API (`apps/api`)**:
  - NestJS modular architecture (`/api/v1`).
  - Drizzle ORM with PostgreSQL database.
  - Category ordering, products catalog, order lifecycle, settings management.

- **Database Package (`packages/database`)**:
  - Drizzle schema definition, migrations, and seed scripts.

## 🛠️ Tech Stack

- **Monorepo**: Turborepo & pnpm
- **Frontend**: Next.js 15, React 19, Tailwind CSS, Lucide Icons, Zustand
- **Backend**: NestJS, TypeScript, Drizzle ORM, PostgreSQL
- **Font**: Google Roboto

## 📦 Getting Started

1. **Install dependencies and create your local config**:
   ```bash
   pnpm install
   cp .env.example .env
   ```

2. **Start PostgreSQL, Redis and Typesense**:
   ```bash
   docker compose up -d
   ```

3. **Create the database and sample data**:
   ```bash
   pnpm --filter @solusation/database db:migrate
   pnpm --filter @solusation/database db:seed
   ```

4. **Create the staff accounts** (passwords must be at least 12 characters and are never stored in this repository):
   ```bash
   SEED_ADMIN_PASSWORD='...' SEED_SEO_PASSWORD='...' pnpm --filter @solusation/api seed:admins
   ```

5. **Start the development servers**:
   ```bash
   pnpm dev
   ```

   - Storefront: `http://localhost:3000`
   - Admin Dashboard: `http://localhost:3001`
   - Backend API: `http://localhost:4000/api/v1`
   - API docs (development only): `http://localhost:4000/api/docs`

## ✅ Checks

```bash
pnpm check-types
pnpm test
```

## 🔒 Security Model

- **API routes are closed by default.** A route needs `@Public()` to be open or `@Roles(...)` to limit it to staff. A test fails if a route has neither.
- **Sessions use HttpOnly cookies**, with refresh token rotation. Production needs HTTPS for these cookies to work.
- **The server calculates all money.** Checkout sends product IDs and quantities only.
- **Production refuses to start** with missing or placeholder JWT secrets.

## 💳 Payments

- **Online bKash** stays off until real `BKASH_*` credentials are set. Customers enter their PIN on bKash's own page, and an order is marked paid only after bKash confirms the transaction.
- **Send Money with a TrxID** is always available. Those orders stay `PENDING` until staff check the payment and verify it in the admin panel.

## 🗄️ Database Changes

Edit `packages/database/src/schema/`, then run `pnpm --filter @solusation/database db:generate` and commit the generated migration.
