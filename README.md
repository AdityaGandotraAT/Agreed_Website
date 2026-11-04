# website-agreed

Next.js App Router project with Tailwind CSS. Pages and site content are not built yet.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Structure

Application code lives in `src`. Import it with the `@/*` alias, for example `@/constants/site`.

```text
src/
  app/            routes, root layout, and global styles
  components/
    common/       shared UI
    layout/       shell components such as header and footer
    sections/     page sections
  hooks/          client hooks
  lib/            shared modules that are not external integrations
  services/       API calls and external integrations
  utils/          pure utility functions
  constants/      shared constants
  types/          shared JSDoc types
  styles/         extra stylesheets, when they should not live in app/globals.css
public/
  images/         image assets
  icons/          icon assets
  fonts/          self-hosted font files, when next/font is not used
```

Add a folder when the first file needs it. Server Components are the default. Add `"use client"` only for state, effects, or browser APIs.

## Environment variables

Copy `.env.example` to `.env.local`. Variables without the `NEXT_PUBLIC_` prefix stay on the server. Do not commit `.env.local` or secrets.

## Styling

Tailwind CSS 4 is loaded by Turbopack through `@tailwindcss/turbopack`. Shared tokens live in `src/app/globals.css`. There is no separate PostCSS config because this setup does not use the PostCSS Tailwind plugin.

Update `src/constants/site.js` when the site title and description are known.
