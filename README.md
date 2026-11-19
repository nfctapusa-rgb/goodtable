# GoodTable Platform

A free online-presence grader for any business: website SEO, guest experience, Google Business Profile, and local rankings. It's the top-of-funnel lead magnet for GoodTable.

## Run
npm install && npm run dev  →  http://localhost:3000

## Deploy (Vercel)
Import the repo and set these env vars:
- `GOOGLE_PLACES_API_KEY`: enables the Local listings and rankings checks (Google Cloud → enable "Places API (New)"). Without it those checks show as not connected; nothing is faked.
- `NEXT_PUBLIC_CTA_URL`: where the "Fix it with GoodTable" buttons go.

## What's real
All website checks run against the live HTML, robots.txt, and sitemap. Checks that need input you didn't give (city or keyword) show "Unable to determine" and don't count toward the score.
