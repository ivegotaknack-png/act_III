Here is the complete **v.0 Specification Package**.

Since no action has been taken, we are combining the **Initial Vision**, **Tech Stack**, and **Advisor Feedback** into a single, cohesive launch plan.

You will find two things below:
1.  **The Master Technical Spec:** A summary of the architecture for your reference.
2.  **The Developer Prompts:** The exact instructions to copy/paste to your Gemini Agent to build the app from scratch.

***

# Part 1: The Master Technical Spec (v.0)

**Product Name:** The Realist’s Retirement Dashboard
**Architecture:** Client-Side Calculation Engine (No Backend Latency)
**Hosting Target:** Static Export (Hostinger Compatible)

### 1. The Tech Stack
*   **Framework:** Next.js 14+ (App Router)
*   **Language:** TypeScript (Strict Mode)
*   **UI System:** Tailwind CSS + shadcn/ui
*   **State:** Zustand (Global Store)
*   **Charts:** Recharts
*   **Math:** decimal.js (Floating point safety)

### 2. The Data Model (Household)
The application state revolves around a single `Household` object containing:
*   **`contributors`:** Array of 2 (Spouses). Tracks Birth year, Retirement Age, Life Expectancy.
*   **`assets`:** Array of Accounts. Tracks Balance, **Cost Basis**, Tax Type (Roth/Pre/Taxable), and Owner.
*   **`fixedIncome`:** Array of "Faucets" (Pension, SS, Deferred Comp). Tracks Start Age, Monthly Amount, Taxability, COLA (Inflation Adjust).
*   **`spending`:** Array of Time-Phased Goals (e.g., "Go-Go Years").
*   **`oneTimeEvents`:** Array of Lumpy Expenses (Weddings, House Purchase).
*   **`parameters`:** Inflation Rate, Growth Rates, Tax Rate Assumptions.

### 3. The Logic Engine (The "Waterfall")
The calculator will iterate year-by-year:
1.  **Income:** Calculate Salary + Active Pensions/SS.
2.  **Expenses:** Calculate Base Spend + One-Time Events (Inflation Adjusted).
3.  **Gap:** `Expenses - Income`.
4.  **Withdrawal Strategy:**
    *   If Gap > 0, withdraw from Assets in this order: Cash -> Taxable -> PreTax -> Roth.
    *   **Gross-Up Logic:** If withdrawing \$10k from PreTax (20% bracket), withdraw \$12.5k.
5.  **Growth:** Apply interest to remaining balances.

***
