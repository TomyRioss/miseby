---
version: 1
slug: "app-business-dashboard-miselink-page-tsx"
primary_target: "app/(business)/dashboard/miselink/page.tsx"
related_targets:
  - "app/(business)/dashboard/miselink/design/page.tsx"
---

Scope: `/dashboard/miselink` and `/dashboard/miselink/design`; mode: Operate. Audience: business members arranging a public page. Task: edit profile and destinations, preview, publish, share, and customize the public page theme. Preserve all existing actions and data; leave public rendering unchanged.

## Direction contract

THESIS: MiseLink editor treats destinations as an ordered public current; category-default stack of Linktree-like pills does not define the workspace.

OWN-WORLD: Mar Digital Business; white `#FFFFFF`, navy `#0A2540`, Business green from existing Tailwind emerald tokens, and a barely visible Tailwind retícula derived from the existing MISE BY grid motif. Inherit Geist Sans and Geist Mono from MISE BY. Use restrained square pixel markers, clear alignment, white surfaces, and slate neutrals; introduce no new principal color.

STORY: business member sees the public page address and publication state, edits profile and destinations, understands their public order, checks the phone preview, then shares the page.

FIRST VIEWPORT: within existing dashboard shell, a compact page heading and public URL/status sit above profile controls; ordered destinations fill the broad left column with actual sequence markers and add action; live phone preview sits in a right column on desktop. Mobile becomes one column; existing preview dialog remains available.

DESIGN SURFACE: use the same white/navy/Business-green palette, Geist typography, subtle pixel grid, square icon blocks, and restrained borders in the theme-control screen. Keep its existing theme categories, save/discard actions, and live preview behavior.

FORM: user-pinned marine direction. Concept seed `640f72f6` assigned grounded candidate 5; user constraint overrides assignment. Declined split-flap, airport wayfinding, monochrome marketing, and character catalog challengers for weaker audience identification/product clarity; keep their grid discipline as alignment precision only. Signature interaction: reorder destinations while tide rail reflects active public order.

FINISH: apply the same brand system to the links editor and design editor; preserve public rendering and existing theme controls.
