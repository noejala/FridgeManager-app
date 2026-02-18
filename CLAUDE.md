# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start Vite dev server (http://localhost:5173)
npm run build    # Type-check with tsc, then build to dist/
npm run preview  # Preview production build locally
```

No test or lint scripts are configured. `tsc` (run as part of build) acts as the type checker — strict mode is enabled.

## Architecture

**Stack:** React 18 + TypeScript (strict) + Vite. No router — tab switching is handled in `App.tsx` via `activeTab` state and conditional rendering.

**State management:** All product state lives in `App.tsx` (no external store). Products are persisted to `localStorage` under the key `'fridge-products'` via two `useEffect`s — one to load on mount, one to save on every change.

**Data flow:**
- `App.tsx` is the single container component: it owns `products`, `editingProduct`, `activeTab`, and `notification` state, and passes handlers down as props.
- Child components are purely presentational except `WhatToCook`, which fetches its own data from the TheMealDB API (`src/utils/mealApi.ts`) using `useCallback` + `useEffect`.

**Three tabs:** `fridge` (ProductList + AddProductForm/EditProductForm), `cook` (WhatToCook), `seasonal` (SeasonalProducts).

## Core Data Model (`src/types/Product.ts`)

```ts
interface Product {
  id: string;                        // UUID
  name: string;
  category: ProductCategory;         // 'Fruits'|'Vegetables'|'Meat'|'Fish'|'Dairy'|'Beverages'|'Frozen'|'Other'
  expirationDate: string;            // YYYY-MM-DD
  quantity: number;
  unit: string;                      // 'unit'|'kg'|'L'|...
  addedDate: string;                 // YYYY-MM-DD
  isEstimatedExpiration?: boolean;
  fridgeZone?: string;               // Placement recommendation
}
```

## Key Utilities (`src/utils/`)

| File | Purpose |
|---|---|
| `storage.ts` | `loadProducts`/`saveProducts` (localStorage), `getDaysUntilExpiration`, `isExpired`, `isExpiringSoon` |
| `categoryMapping.ts` | `guessCategory(name)` — keyword-based auto-detection of `ProductCategory` |
| `shelfLife.ts` | `estimateExpirationDate(name, category, purchaseDate)` — shelf life lookup table |
| `fridgePlacement.ts` | `getFridgeZone(product)` / `getZoneExplanation()` — recommends one of 5 fridge zones |
| `mealApi.ts` | TheMealDB API calls: `searchByIngredient`, `getMealDetails`, `singularize` |

## External API

TheMealDB (no auth required):
- `GET /filter.php?i={ingredient}` — recipes by ingredient
- `GET /lookup.php?i={id}` — full recipe details

## CSS & Design System

Each component has a paired `.css` file. CSS Grid/Flexbox for layout.

**Design system** — all tokens are CSS custom properties defined in `App.css` under `:root`:
- `--font-display` (Cormorant Garamond) for headings, `--font-body` (DM Sans) for everything else
- `--bg`, `--bg-card`, `--bg-surface`, `--bg-input` — dark warm background hierarchy
- `--accent` (terracotta) for primary actions and highlights
- `--green` / `--amber` / `--red` (+ `*-bg` variants) for product status
- `--border` / `--border-hover` for subtle borders
- Global keyframes (`card-in`, `fade-in`, `modal-in`, `toast-fade`) defined in `App.css` and used across component CSS files

**Key pattern:** browser autofill on dark inputs requires `-webkit-box-shadow: 0 0 0px 1000px var(--bg-input) inset` — already applied in `AddProductForm.css`.
