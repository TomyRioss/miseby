# MiseLink dashboard redesign

Status: user-approved brand direction applied to both MiseLink dashboard screens.

## Goal

Redesign `/dashboard/miselink` and `/dashboard/miselink/design` with the Mar Digital Business identity, distinct from Linktree. Keep both screens' behavior and content intact. Preserve public rendering and shared dashboard navigation.

## Users and job

Inference from existing code: a business member manages the destinations on its public MiseLink page. Main job: organize profile, social links, and destination links; preview, publish, and share the result.

## Direction

Mar Digital: use the supplied white `#FFFFFF` and navy `#0A2540` palette, plus a barely visible navy Tailwind retícula. Keep the inherited Geist typography. The links screen's ordered current rail distinguishes the editor from Linktree; the design screen uses the same pixel, color, type, and surface system while keeping its existing theme controls.

### Tokens

- White: `#FFFFFF` — editor canvas and primary surfaces.
- Mar Digital navy: `#0A2540` — headings, core text, and brand anchor.
- Grid: low-opacity Tailwind version of the existing MISE BY grid motif; do not modify global CSS or invent another principal color.
- Typography: existing Geist Sans and Geist Mono from the root layout.

## Layout

- Keep business navigation intact.
- Main editor: profile and public URL/status first; ordered destinations below; add action adjacent to list heading.
- Desktop: editor and existing live phone preview in two columns; preview remains available while editing.
- Mobile: single column; editor controls remain reachable and preview opens through the existing preview action.
- Empty state guides the first add action. Loading, save/publish errors, disabled and published states remain explicit.
- Design editor keeps theme presets, header, wallpaper, buttons, typography, colors, save, discard, and live preview controls.

```text
+----------------------+--------------------------------------+
| Profile + page state | Live phone preview                   |
| Public URL + actions |                                      |
|                      |                                      |
| Current / ordered    |                                      |
| destinations         |                                      |
|   item               |                                      |
|   item               |                                      |
|   + Add destination  |                                      |
+----------------------+--------------------------------------+
```

## Signature

An ordered current rail beside destination rows, using the actual list order to communicate sequence. Keep motion quiet and purposeful; respect reduced-motion preferences. No decorative ocean imagery is required.

## Behavior to preserve

- Edit username, display name, bio, avatar, and social links.
- Add/edit/remove links; add existing menu/catalog destinations; reorder links.
- Existing publish/settings, share dialog, and preview behavior.
- Existing save, validation, loading, and error handling.

Do not change action/service contracts or data shape. No database, Prisma, or migration work.

## Implementation constraints

- Follow existing Next.js 16.3.3 docs before writing code.
- Tailwind and installed shadcn components; no global CSS edits.
- Responsive desktop/mobile; visible keyboard focus; preserve semantics.
- No new icon/image SVGs. Reuse existing assets and controls where possible.
- Keep changes inside these two routes and their MiseLink editor/design components.

## Verification

- Dogfood the existing edit, add, reorder, publish, preview, and share flows, plus empty and error states.
- Inspect browser console and responsive desktop/mobile views.
- Do not run database commands.
