# FridgeManager

A PWA for tracking what's in your fridge, reducing food waste, and finding recipes based on what you have.

**Live app:** https://fridgemanager.vercel.app

## Features

- **Expiration tracking** — add products with expiration dates; items are color-coded (green / amber / red) based on freshness
- **Smart defaults** — category auto-detection from product name, shelf life estimation, and fridge zone recommendations
- **Barcode scanner** — scan product barcodes to speed up entry
- **Recipe suggestions** — "What to Cook" tab fetches recipes from TheMealDB based on your current ingredients
- **Seasonal products** — browse what's in season right now
- **Notifications** — opt-in alerts for products nearing expiration
- **Dark mode** — persisted to `localStorage`
- **PWA** — installable on mobile and desktop

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript (strict) + Vite |
| Backend / Auth | Supabase (Postgres + email/password auth) |
| Barcode scanning | `@zxing/browser` |
| i18n | i18next + react-i18next |
| Recipe API | TheMealDB (no auth required) |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with the `products` table (see schema below)

### Installation

```bash
git clone https://github.com/your-username/FridgeManager-app.git
cd FridgeManager-app
npm install
```

### Environment variables

Create a `.env.local` file at the root:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development

```bash
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Type-check + build to dist/
npm run preview  # Preview production build locally
```

## Database Schema

```sql
create table products (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users not null,
  name            text not null,
  category        text not null,
  expiration_date date not null,
  quantity        numeric not null,
  unit            text not null,
  added_date      date not null,
  is_estimated_expiration boolean,
  fridge_zone     text
);

alter table products enable row level security;
alter table products force row level security;

create policy "Users can only access their own products"
  on products for all
  using ((select auth.uid()) = user_id);

create index products_user_id_idx on products(user_id);
```

## Project Structure

```
src/
├── components/       # UI components (one CSS file per component)
├── utils/
│   ├── productService.ts   # Supabase CRUD (camelCase ↔ snake_case)
│   ├── storage.ts          # Date helpers (getDaysUntilExpiration, etc.)
│   ├── categoryMapping.ts  # Keyword-based category auto-detection
│   ├── shelfLife.ts        # Shelf life table + expiration estimation
│   ├── fridgePlacement.ts  # Fridge zone recommendations
│   └── mealApi.ts          # TheMealDB API wrapper
├── lib/
│   └── supabase.ts         # Supabase client singleton
├── types/
│   └── Product.ts          # Product interface + ProductCategory type
└── App.tsx                 # Root: auth state, product state, tab routing
```

## Product Categories

`Fruits` · `Vegetables` · `Meat` · `Fish` · `Dairy` · `Beverages` · `Frozen` · `Other`
