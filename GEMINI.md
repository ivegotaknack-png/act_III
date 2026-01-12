# The Realist’s Retirement Dashboard (finance-planner)

## Project Overview
This project is a modern, client-side financial planning application designed to simulate retirement scenarios. It features a deterministic "logic engine" that projects portfolio growth and withdrawals over a 50-year timeline, handling complex logic like tax waterfalls (Roth vs. PreTax vs. Taxable) and inflation-adjusted cash flows.

**Tech Stack:**
*   **Framework:** Next.js 14+ (App Router)
*   **Language:** TypeScript (Strict Mode)
*   **Styling:** Tailwind CSS + shadcn/ui
*   **State Management:** Zustand
*   **Visualization:** Recharts
*   **Math:** decimal.js (for floating-point precision)
*   **Deployment:** Static Export (configured for Hostinger)

## Architecture

### Data Model (`src/types/finance.ts`)
The application state is centralized around a `Household` object, which includes:
*   `Contributor`: Personal details (age, retirement age).
*   `Asset`: Financial accounts (401k, Brokerage) with specific `TaxType`.
*   `FixedIncome`: Pensions, Social Security (inflation-adjusted).
*   `SpendingPhase`: Time-boxed expense levels.
*   `OneTimeExpense`: Lumpy future expenses (e.g., weddings).

### Logic Engine (`src/lib/engine.ts`)
The core `runSimulation` function iterates year-by-year (0-50) to:
1.  Calculate total income (Salary + Fixed Income).
2.  Calculate expenses (Spending Phases + One-Time Events).
3.  Determine the gap (Deficit) or Surplus.
4.  **Withdrawal Waterfall:** If a deficit exists, funds are drawn in order: Cash -> Taxable -> PreTax -> Roth.
5.  **Tax Logic:** Applies heuristic taxes (Capital Gains for Taxable, Income Tax for PreTax gross-up).
6.  **Growth:** Applies annual returns to remaining asset balances.

## Building and Running

**Install Dependencies:**
```bash
npm install
```

**Run Development Server:**
```bash
npm run dev
```

**Build for Production (Static Export):**
```bash
npm run build
```
*Note: The project is configured with `output: 'export'` in `next.config.mjs`.*

## Proxy Environment Configuration
When running in a code-server environment behind a proxy (e.g., `/proxy/3000/`), the `next.config.mjs` is configured to use an `assetPrefix` in development mode. This ensures that static assets (JS, CSS) load correctly via the proxy path.

## Key Files
*   `src/lib/engine.ts`: The calculation logic (The Brain).
*   `src/types/finance.ts`: Strict TypeScript definitions for the data model.
*   `src/constants.ts`: Mock data (`DEFAULT_HOUSEHOLD`) for testing and development.
*   `Project_Spec.md`: The original technical specification and developer prompts.

## Development Conventions
*   **Math:** Always use `decimal.js` for financial calculations. Never use native JavaScript floats for currency.
*   **UI Components:** Use `shadcn/ui` components (in `src/components/ui`).
*   **Styling:** Use Tailwind utility classes.
*   **Type Safety:** Adhere to strict TypeScript interfaces defined in `src/types`.
