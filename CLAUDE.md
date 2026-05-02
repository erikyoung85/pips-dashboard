# Pips Dashboard — Project Conventions

## Stack

- **Framework**: Angular 21.1 — standalone components only, no NgModule, SSR enabled, deployed to Vercel
- **Component library**: PrimeNG 21+ — use standalone module imports (e.g. `TableModule`, `CardModule`, `TagModule`, `SkeletonModule` from `primeng/*`)
- **Styling**: TailwindCSS v4 — `@import "tailwindcss"` in `src/styles.css`, no config file needed
- **Theme**: PrimeNG Aura preset — configured via `providePrimeNG` in `app.config.ts`, imported from `@primeuix/themes/aura`
- **State management**: Angular signals (`signal()`, `computed()`, `effect()`) — no NgRx
- **Testing**: Vitest

## Patterns

- **DI**: `inject()` function in components/pipes; constructor injection in services
- **Control flow**: Angular `@if` / `@for` / `@switch` (not `*ngIf` / `*ngFor`)
- **Change detection**: `ChangeDetectionStrategy.OnPush` on all components
- **Design**: Mobile-first responsive layout with TailwindCSS breakpoints (`md:`, `lg:`)
- **SSR safety**: Wrap `window`/`document` access and data fetching in `isPlatformBrowser()` guard

## Service Architecture

- `SupabaseService` (`src/app/services/supabase/`) — client initialization only, exposes `.client` getter
- Domain services inject `SupabaseService` and own their own data fetching

## Database

### `pips_participant`
| Column | Type | Notes |
|---|---|---|
| `id` | string (UUID) | PK |
| `name` | string | Display name |
| `phone_number` | string | Unique identifier, used to join with `pips_result` |
| `created_at` | string | ISO timestamp |

### `pips_result`
| Column | Type | Notes |
|---|---|---|
| `id` | string (UUID) | PK |
| `pips_number` | number | Daily game ID — increments each day, higher = more recent |
| `duration_seconds` | number | Time to complete the puzzle in seconds — **lower is better** |
| `sender_phone_number` | string | FK to `pips_participant.phone_number` |
| `created_at` | string | ISO timestamp |
| `chat_guid` | string | Internal metadata |
| `full_text_content` | string | Raw SMS text — avoid selecting this, it's large and sensitive |
| `message_id` | number | Internal metadata |
| `message_timestamp` | string | ISO timestamp |

**Join key**: `pips_result.sender_phone_number === pips_participant.phone_number`

**Unique constraint**: `(pips_number, sender_phone_number)` — one result per player per game day

Results with no matching `pips_participant` entry are excluded from all dashboard stats.

## DB Types

Generated file at `database.types.ts` (project root). Use the `Tables<'table_name'>` utility type.

Regenerate with: `npm run generate:db`

## Package Scripts

| Script | Command |
|---|---|
| `npm start` | `ng serve` |
| `npm run build` | `ng build` |
| `npm run generate:db` | Regenerate Supabase TypeScript types |
