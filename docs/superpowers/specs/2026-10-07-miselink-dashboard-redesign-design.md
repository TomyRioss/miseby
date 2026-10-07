# MiseLink dashboard redesign

Status: visual direction approved by user; implementation pending document review.

## Goal

Redesign only `/dashboard/miselink` with a digital-ocean identity distinct from Linktree. Keep editor behavior and content intact. Do not redesign `/dashboard/miselink/design`, the public page, or shared dashboard navigation.

## Users and job

Inference from existing code: a business member manages the destinations on its public MiseLink page. Main job: organize profile, social links, and destination links; preview, publish, and share the result.

## Direction

Digital marine cartography: practical dashboard first, marine identity through a tide-like ordering rail and restrained sea-glass surfaces. Ordered destinations become a visible current: placement encodes the order shown on the public page. Avoid Linktree's familiar stack of isolated branded pill buttons as the editor's dominant visual.

### Tokens

- Bruma: `#F2F7F5` — workspace background.
- Abisal: `#07384A` — primary ink and strong controls.
- Marea: `#0E8C86` — active state and primary action.
- Hielo: `#CDE9E5` — selected and preview surfaces.
- Boya: `#F17A60` — limited attention/error accent.
- Typography: Space Grotesk for display headings; Inter for interface text; JetBrains Mono for URLs and compact metadata.

## Layout

- Keep business navigation intact.
- Main editor: profile and public URL/status first; ordered destinations below; add action adjacent to list heading.
- Desktop: editor and existing live phone preview in two columns; preview remains available while editing.
- Mobile: single column; editor controls remain reachable and preview opens through the existing preview action.
- Empty state guides the first add action. Loading, save/publish errors, disabled and published states remain explicit.

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
- Keep changes inside the route and its MiseLink editor components.

## Verification

- Dogfood the existing edit, add, reorder, publish, preview, and share flows, plus empty and error states.
- Inspect browser console and responsive desktop/mobile views.
- Do not run database commands.
