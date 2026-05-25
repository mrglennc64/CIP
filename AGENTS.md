<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: war (Web Assessment Agency)

5-page marketing site for the Web Assessment Agency product. Sister project to [kataloghub-app](../kataloghub-app/) — mirror its conventions:

- Next.js 16 App Router, Tailwind 4 CSS-first (`@theme inline` in [app/globals.css](./app/globals.css))
- Server components by default; add `"use client"` only when interactivity is needed
- Path alias `@/*` for root-relative imports
- ESLint flat config, no Prettier
- Content lives in typed TS files under [lib/content/](./lib/content/) — there is no CMS yet. The field shapes mirror the Webflow CMS schema described in `war/webflow-template.txt` so a future swap (Pam → API → in-repo data) is mechanical.

The source brief is at `C:/Users/carin/OneDrive/Dokument/war/`. Pam automation, the srv-engine backend, and Webflow itself are out of scope for this codebase.
