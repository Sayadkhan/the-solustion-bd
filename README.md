# The Solusation BD (the-solustion-bd)

High-Performance Computer, Laptop & Tech Mega Store E-Commerce and POS Platform built for Bangladesh.

## 🚀 Features

- **Storefront Web Application (`apps/storefront`)**:
  - Star Tech inspired high-performance mega navbar with top 10 admin-ordered categories and instant dropdown mega menu.
  - Interactive PC Builder simulator with real-time socket compatibility & estimated TDP calculation.
  - Live product search, filter facets (price range, brands, sockets, stock availability).
  - Bangladeshi dual-pricing architecture (Cash Discount Price vs. Regular EMI Price).
  - Standard typography powered by Google Roboto font with crisp hierarchy.

- **Admin & POS Dashboard (`apps/admin`)**:
  - Omnichannel Point of Sale (POS), orders management, invoice printing.
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

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```

2. **Run Migrations & Seed**:
   ```bash
   pnpm --filter @solusation/database exec tsx src/migrate.ts
   ```

3. **Start Development Servers**:
   ```bash
   pnpm dev
   ```

   - Storefront: `http://localhost:3000`
   - Admin Dashboard: `http://localhost:3001`
   - Backend API: `http://localhost:4000/api/v1`
