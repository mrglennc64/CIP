# war — Web Assessment Agency

Marketing site for the Web Assessment Agency product. Next.js 16 + Tailwind 4. Sister of [kataloghub-app](../kataloghub-app/).

## Pages

- `/` — landing (hero, 3-service preview, Pam teaser)
- `/services` — full 6-service grid
- `/pricing` — 3 tiers in SEK (Starter / Standard / Professional)
- `/pam` — Pam Automation Dashboard (visualization only — automation is a separate service)
- `/reports` — Weekly reports list
- `/reports/[slug]` — individual report (PDF download)

## Stack

- Next.js **16.2.4** · React **19.2.4** · TypeScript **5**
- Tailwind **4** (CSS-first via `@theme inline`)
- ESLint **9** flat config · no Prettier
- Geist fonts via `next/font`

## Develop

```sh
npm install
npm run dev      # http://localhost:3000
npm run build
npm run lint
```

## Content

Content lives in [lib/content/](./lib/content/) as typed TS:

- `services.ts` — 6 services
- `pricing.ts` — 3 tiers
- `weekly-reports.ts` — list of reports + PDF URLs
- `pam-plan.ts` — Pam dashboard nav + cadence list

Field shapes mirror the Webflow CMS schema in the brief (`war/webflow-template.txt`) so a later swap to a CMS or to Pam-API-driven content is mechanical.

## Design tokens

Defined in [app/globals.css](./app/globals.css):

- `--wa-primary: #1f6feb` · `--wa-bg: #f7f9fb` · `--wa-surface: #ffffff`
- Dark mode under `body.dark { ... }` — toggle in the nav, persisted to `localStorage`

## Out of scope

- Pam automation (separate Python project, [mrglennc64/PAM](https://github.com/mrglennc64/PAM))
- srv-engine validation backend ([mrglennc64/srv-engine](https://github.com/mrglennc64/srv-engine))
- Webflow integration — replaced by this Next.js site
- Auth, payments, contact forms (Stripe/email checkout TBD)
- i18n (Swedish ↔ English)

## Deploy target

Push to [mrglennc64/war](https://github.com/mrglennc64/war).
