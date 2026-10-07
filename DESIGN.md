---
name: MISE BY MiseLink
description: Mar Digital business workspace for organizing public destinations.
colors:
  brand-navy: "#0A2540"
  white: "#FFFFFF"
  pixel-grid: "Low-opacity Tailwind rendition in navy #0A2540"
typography:
  display: "Geist via font-display"
  body: "Geist Sans via the root layout"
  utility: "Geist Mono via font-mono"
rounded:
  controls: "8–12px"
  cards: "16px"
  preview: "24px"
spacing:
  base: "4px"
  standard: "8px"
  section: "24–32px"
---

# MISE BY MiseLink Design System

## Direction

MiseLink's dashboard follows Mar Digital's white and navy palette. The pixel retícula stays subtle in the white workspace; square status pixels and order markers echo the mark without introducing another accent color.

The dashboard keeps the inherited MISE BY shell. Profile and destination editing sit beside a live public-page preview on desktop and stack on mobile. The preview preserves the business's selected public theme.

## Color use

- **Brand navy `#0A2540`:** headings, primary text, and the shared dashboard header.
- **White `#FFFFFF`:** editor canvas, cards, fields, dialogs, and preview frame.
- **Neutral structure:** existing Tailwind slate utilities for borders, secondary copy, and inactive states.
- Do not introduce another principal color or alter the public page's theme.

## Typography

Use the existing MISE BY typography from `app/layout.tsx`: Geist Sans for interface text and `font-display` headings, with Geist Mono for URLs and numeric order labels. Do not load separate fonts for MiseLink.

## Pixel retícula

Use a low-opacity navy Tailwind retícula on each editor's white canvas. Keep the grid barely visible so open white space protects profile and destination content. Use small square navy status marks and sequence markers as the few explicit pixel details.

## Layout and components

- The editor content is centered and capped at 1480px.
- Desktop uses a broad editing column and a sticky live preview; mobile uses one column and retains the existing preview dialog.
- Profile and destination cards remain white, with restrained slate borders and 16px corners.
- Controls stay compact, use visible keyboard focus, and preserve the existing shadcn behavior.
- The ordered current rail counts active public links only. Collections and inactive destinations show a dash.

## Boundaries

Keep all existing edit, reorder, preview, publish, share, save, and discard interactions on both dashboard screens. Do not modify the shared dashboard shell, public rendering, or database behavior as part of this surface's visual work.
