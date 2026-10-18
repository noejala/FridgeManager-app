# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow

**Git:** Commit freely after each change, but **never push** unless the user explicitly asks to push. Pushing = deploying to Vercel production.

**End of session:** When the user says they're done for the day, always:
1. Do a recap of everything done during the session
2. Scan the codebase for unused files, dead code, or stale imports and clean them up
3. Commit any pending changes (do NOT push)

## Commands

```bash
vercel env pull .env.local   # First time / after env changes (needs `vercel login`)
vercel dev                   # Local dev server WITH the /api functions (http://localhost:3000) — use this
npm run dev                  # Vite only (http://localhost:5173) — no /api/mistral, AI mode falls back
npm run build                # Type-check with tsc, then build to dist/
```

No test or lint scripts are configured. `tsc` (run as part of build) is the type checker — strict mode, `noUnusedLocals`/`noUnusedParameters` on. Run `npm run build` before committing.

**⚠️ Local = production data.** Vercel uses the same Supabase project for Development, Preview and Production. Anything done while testing locally hits real users' data — test in a throwaway fridge and clean up.

## Architecture

**Stack:** React 18 + TypeScript (strict) + Vite + `vite-plugin-pwa` (installable PWA named **Freego**, custom service worker in `public/sw.js` for push). i18next (EN/FR, `src/i18n/*.json`). Barcode scanning via `@zxing/browser`, product lookup via Open Food Facts (`foodFactsApi.ts`), voice input parsed by `voiceParser.ts`.

**Navigation:** no router. `App.tsx` holds `activeTab` (`fridge` | `cook` | `sharing` | `seasonal` | `settings`, defined in `Tabs.tsx`). All tab contents stay mounted (`hidden` attribute) so `WhatToCook` doesn't refetch on tab switch.

**State:** no external store. `App.tsx` (~800 lines) owns user, fridges, current fridge, products and most modals; CRUD handlers call the `src/utils/*Service.ts` modules directly. `WhatToCook.tsx` (~1200 lines) owns all recipe state. Both are due for a split — prefer extracting hooks/components over growing them.

**Multi-fridge model:** a user owns or joins several fridges; products belong to a fridge (`fridge_id`), not only to a user. Fridges are shared with friends (`friendships`) or via invite links (`create_fridge_invite` / `accept_fridge_invite`). Roles: owner / editor / viewer. Each fridge has `pantry_staples` (always-available ingredients for recipes).

## Key Files

| File | Purpose |
|---|---|
| `src/lib/supabase.ts` | Supabase singleton client |
| `src/utils/productService.ts` | Product CRUD — camelCase ↔ snake_case mapping, scoped by `fridge_id` |
| `src/utils/fridgeService.ts` | Fridges, members, pantry, invite RPCs |
| `src/utils/friendService.ts` | Friend search/requests (`search_users`, `get_user_profiles` RPCs) |
| `src/utils/userProfileService.ts` | Profile, dietary prefs, `setup_user_identity` RPC |
| `src/utils/mistralApi.ts` | Builds the AI recipe prompt client-side, caches results in localStorage, calls `/api/mistral` with the user's Supabase token |
| `api/mistral.ts` | Vercel function proxying Mistral (`mistral-small-latest`). Rejects requests without a valid Supabase session |
| `src/utils/mealApi.ts` + `mealDbCache.ts` | TheMealDB (classic recipes, also the fallback when AI fails) |
| `src/utils/ingredientMatcher.ts` / `ingredientTranslation.ts` | Match fridge products (FR/EN) to recipe ingredients |
| `src/utils/storage.ts` | Date helpers: `getDaysUntilExpiration`, `isExpired`, `isExpiringSoon` |
| `src/utils/categoryMapping.ts` / `shelfLife.ts` / `fridgePlacement.ts` | Category guess, shelf-life estimate, fridge-zone advice |
| `supabase/functions/notify-expiring` | Edge function sending daily web-push for expiring products (not scheduled yet) |

## Supabase

Tables: `products`, `fridges`, `fridge_members`, `friendships`, `user_profiles`, `saved_recipes`, `push_subscriptions`. RLS on everything; policies use `(select auth.uid())`. Security-definer RPCs set `search_path = public`.

**Schema drift:** `supabase/migrations/` does NOT contain the full schema — `products`, `fridges`, `fridge_members`, `friendships`, `push_subscriptions` and several RPCs were created in the dashboard. Before changing a policy or RPC, read its live definition (Supabase MCP in `.mcp.json`) rather than trusting the migrations folder. Every new change goes in a dated migration file.

**Gotchas:**
- `pgcrypto` functions (`gen_random_bytes`…) live in the `extensions` schema: invisible with `search_path = public`. Use core `gen_random_uuid()` or qualify as `extensions.…`.
- RLS can't restrict columns: `fridges` has a trigger (`guard_fridge_member_update`) so non-owner members can only change `pantry_staples`; `fridge_members` and `friendships` use column grants (`UPDATE (role)` / `UPDATE (status)` only). Updating any other column from the client fails with "permission denied" — go through a SECURITY DEFINER RPC instead.
- SECURITY DEFINER RPCs are revoked from `anon`/PUBLIC. A new RPC must `REVOKE EXECUTE … FROM PUBLIC, anon; GRANT EXECUTE … TO authenticated`.
- Run the Supabase security advisor (MCP `get_advisors`) after any DDL change. The remaining "authenticated can execute SECURITY DEFINER" warnings are intentional.

**Env vars** (Vercel, pulled into `.env.local`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VAPID_PUBLIC_KEY`, `VITE_AI_ENABLED`, `MISTRAL_API_KEY` (server only). Edge function secrets (`VAPID_PRIVATE_KEY`…) live in Supabase.

**Production:** https://fridgemanager.vercel.app (Vercel project `fridgemanager`, hobby plan — runtime logs are barely retained).

## External APIs

- **Mistral** via `/api/mistral` — the org is on Mistral's Free plan, where API keys are disabled (every call 429s). AI mode currently always falls back to TheMealDB.
- **TheMealDB** (no auth): `filter.php?i=`, `lookup.php?i=`.
- **Open Food Facts** for barcode lookups.

## CSS & Design System

Each component has a paired `.css` file (except `EditProductForm`, which shares styles). CSS Grid/Flexbox for layout.

**Design system** — all tokens are CSS custom properties defined in `App.css` under `:root`:
- `--font-display` (Cormorant Garamond) for headings, `--font-body` (Figtree) for everything else
- `--bg`, `--bg-card`, `--bg-surface`, `--bg-input` — background hierarchy (light by default)
- `--text`, `--text-secondary`, `--text-muted` — text hierarchy
- `--accent` (blue `#2c6fe0`) / `--accent-light` / `--accent-bg` for primary actions and highlights
- `--green` / `--amber` / `--red` (+ `*-bg` variants) for product status
- `--border` / `--border-hover` for subtle borders
- `--shadow`, `--radius` for elevation and rounding
- Global keyframes (`card-in`, `fade-in`, `modal-in`, `toast-fade`) defined in `App.css` and used across component CSS files

**Dark mode:** toggled via a button in the header (and on the auth screen). Applies `data-theme="dark"` on `<html>`. All color tokens are overridden in the `[data-theme="dark"]` block in `App.css`.

**Key pattern:** browser autofill on dark inputs requires `-webkit-box-shadow: 0 0 0px 1000px var(--bg-input) inset` and `-webkit-text-fill-color: var(--text)` — applied in `AddProductForm.css` and `Auth.css`.
