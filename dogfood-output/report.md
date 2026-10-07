# Dogfood report — MISE BY public pages

## Summary

No remaining visual or console issues found in the static routes exercised. Responsive review used desktop and 390 × 844 mobile viewports. No account, order, or database operation was submitted.

## Scope exercised

- `/` and `/#planes`: hero display, plans anchor, and mobile navigation open/close.
- `/planes/mise-link` and `/planes/mise-restaurant`: plan detail layout and navigation.
- `/login`, `/register`, `/forgot-password`, `/reset-password` without a token, and `/verificar-email` without a token.
- `/terminos` and `/privacidad`.
- Checked page titles, visible controls, mobile horizontal overflow, and browser console after navigation and interactions.
- Reset-password missing-token state links to `/forgot-password` and explains how to recover.

## Findings

No open findings. The reset-password form initially emitted browser autocomplete warnings and gave no visible feedback when its token was missing. Added password autocomplete hints and a missing-token recovery state; rechecked with no console warnings or errors.

## Not exercised

Database-backed business profiles, Mise Link data, restaurant menus, product details, catalog pages, checkout submission, and invitation tokens were not opened because those routes query stored business data. Testing them would violate the project instruction not to touch the database or Prisma without explicit permission. Their UI code passed ESLint and TypeScript checks, but remains unverified against live business records.

## Evidence

- Home hero viewport: `MEDIA:./screenshots/home-desktop.png`, `MEDIA:./screenshots/home-mobile.png`
- Pricing section: `MEDIA:./screenshots/home-plans-desktop.png`
- Plan detail: `MEDIA:./screenshots/plan-desktop.png`
- Account and recovery: `MEDIA:./screenshots/login-mobile.png`, `MEDIA:./screenshots/register-mobile.png`, `MEDIA:./screenshots/forgot-mobile.png`, `MEDIA:./screenshots/reset-password-mobile.png`, `MEDIA:./screenshots/verify-email-mobile.png`
- Legal pages: `MEDIA:./screenshots/terms-desktop.png`, `MEDIA:./screenshots/privacy-mobile.png`
