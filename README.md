# FridgeManager

A web app / PWA for tracking what's in your fridge, managing expiration dates, reducing food waste, and finding recipes based on what you have.

**Live app:** https://fridgemanager.vercel.app

## Features

- **Expiration tracking** — add products with expiration dates; items are color-coded (green / amber / red) based on freshness
- **Smart defaults** — category auto-detection from product name, shelf life estimation, and fridge zone recommendations
- **Barcode scanner** — scan product barcodes to speed up entry
- **Recipe suggestions** — "What to Cook" tab suggests recipes based on your current ingredients; LLM-powered recommendations and a recipe chatbot are planned
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

