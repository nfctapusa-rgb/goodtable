# Lokly Platform

A free online-presence grader for any business: website SEO, guest experience, Google Business Profile, and local rankings. It's the top-of-funnel lead magnet for Lokly.

## Run
npm install && npm run dev  →  http://localhost:3000

## Deploy (Vercel)
Import the repo and set these env vars:
- `GOOGLE_PLACES_API_KEY`: enables the Local listings and rankings checks (Google Cloud → enable "Places API (New)"). Without it those checks show as not connected; nothing is faked.
- `NEXT_PUBLIC_CTA_URL`: where the "Fix it with Lokly" buttons go.

## What's real
All website checks run against the live HTML, robots.txt, and sitemap. Checks that need input you didn't give (city or keyword) show "Unable to determine" and don't count toward the score.

## Growth funnel (Instagram → grader → account → paid)
- **ManyChat**: DM link `https://lokly.pro/ig?h={{username}}&c=grade` logs the click, tags the visitor as Instagram and opens the grader. Optional External Request to `POST /api/manychat` (header `Authorization: Bearer $MANYCHAT_SECRET`, body `{"ig":"{{username}}","keyword":"GRADE"}`) logs each comment.
- **Attribution**: any page with `?utm_source=` or `?src=` sets a first-touch `lokly_attr` cookie. Events land in `funnel_events` (click, ig_comment, grade, register, paid, upgrade, canceled, payment_failed); `users.source` keeps the signup channel.
- **Gated report**: anonymous visitors see the score, rankings and top 3 issues; creating a free account (or logging in) saves the full report to their dashboard.
- **Stripe**: add `invoice.paid` to the webhook events so revenue is recorded in `payments`.
- **Resend**: welcome email on signup, upgrade nudges on days 2, 5 and 10 (daily cron, free accounts only, one-click unsubscribe), plus failed-payment and cancellation notices.
- **Growth Center**: `/admin/growth` for users with `is_admin = true` (or `?key=$ADMIN_KEY`).

New env vars: `RESEND_API_KEY`, `EMAIL_FROM` (e.g. `Lokly <hello@lokly.pro>`), `CRON_SECRET`, `MANYCHAT_SECRET`, optional `NEXT_PUBLIC_SITE_URL`, `EMAIL_SIGNING_SECRET`.
