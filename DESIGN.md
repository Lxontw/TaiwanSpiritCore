# Design System: TaiwanSpiritCore

## 1. Visual Theme & Atmosphere

TaiwanSpiritCore is a dense cultural knowledge console with restrained ritual atmosphere. It should feel like a field archive for Taiwanese folklore: dark mineral surfaces, warm paper-gold accents, compact metadata, and clear knowledge-navigation structure. Density is 7/10, variance is 5/10, and motion is 4/10: useful, steady, never decorative.

## 2. Color Palette & Roles

- **Charcoal Shrine** (#0F0F11) — Primary application canvas.
- **Ink Sidebar** (#151518) — Navigation and tree background.
- **Iron Card** (#1B1B22) — Detail cards and structured content surfaces.
- **Ash Border** (#2B2B35) — Structural dividers, scrollbars, input outlines.
- **Rice Paper Text** (#F0F0F5) — Primary readable text.
- **Muted Incense** (#A0A0B0) — Secondary descriptions, metadata labels.
- **Temple Gold** (#C8A84B) — Single accent for active states, focus, badges, and ritual emphasis.

Never use pure black, neon purple, oversaturated gradients, or outer glow effects.

## 3. Typography Rules

- **Display:** PingFang TC / Noto Sans TC / Microsoft JhengHei. Strong weight, modest scale, no oversized hero typography inside the app shell.
- **Body:** Same sans-serif stack, 14px minimum, relaxed line-height around 1.6.
- **Mono:** System monospace for IDs, file paths, routes, and metadata values.
- **Line Length:** Narrative paragraphs should stay readable, ideally under 65 characters per line.
- **Banned:** Inter, generic serif fonts, fake editorial typography, negative letter spacing.

## 4. Component Stylings

- **Navigation Tree:** Compact, left aligned, one active state only. Long item names truncate cleanly without widening the grid.
- **Cards:** Use for individual records only. 8px radius maximum. No cards inside cards unless the inner element is a data section with a distinct semantic purpose.
- **Buttons and Links:** Flat, predictable, with color and border state changes. Active feedback can translate by 1px; no glow.
- **Inputs:** Label or placeholder must be direct. Focus ring uses Temple Gold, with no floating labels.
- **Images:** Use stable aspect-ratio containers. Missing images render as a quiet pending state, not a broken icon.
- **CMS Screens:** Favor clarity over decoration. Collection names must match the data model exactly: fuzhe, plants, monsters, talismans, temples.

## 5. Layout Principles

Use explicit CSS Grid areas for app shells. Never rely on implicit grid placement for sidebar/content layouts. Main desktop shell is `sidebar content`; admin or assistant panels must be explicitly named and removable at responsive breakpoints.

At widths below 900px, hide optional assistant panels and preserve the knowledge tree plus content. Below 600px, collapse into a vertical flow with sidebar above content. Horizontal scroll is a critical failure.

## 6. Motion & Interaction

Motion should be restrained and informative. Use opacity and transform only. Tree transitions, card highlight pulses, and route scroll positioning are acceptable. Avoid continuous decorative motion in dense reading views.

## 7. Google Stitch Interface Contract

Stitch and Stitch MCP integrations should read this file as the design source of truth. Runtime metadata is exposed through:

```js
window.StitchInterface
```

Expected fields:

- `version` — interface version string.
- `designSpecPath` — path to this file.
- `themes` — data collections available in the UI.
- `tokens` — color, typography, density, and layout guidance.
- `getDesignContext()` — returns the current route, active theme, data counts, and design tokens.

Stitch-generated screens must keep the existing knowledge-console structure unless a task explicitly asks for a new screen type.

## 8. Figma Interface Contract

Figma and Figma MCP integrations should use the same tokens and screen rules as Stitch. Runtime metadata is exposed through:

```js
window.FigmaInterface
```

Expected fields:

- `version` — interface version string.
- `designSpecPath` — path to this file.
- `frameDefaults` — desktop, tablet, and mobile frame sizes.
- `componentMap` — semantic mapping from app shell regions to Figma components.
- `getTokens()` — returns shared design tokens.
- `getFrameSpec()` — returns frame metadata, current route context, data counts, and component groups.

Figma exports should preserve the knowledge-console shell: sidebar, content pane, compact metadata, and dark cultural archive palette.

## 9. Anti-Patterns

- No emojis in production UI.
- No purple/blue AI gradients.
- No pure black.
- No generic three-equal-card marketing rows.
- No centered hero page as the primary app screen.
- No overlapping text and images.
- No fake placeholder content.
- No broken external image links.
- No horizontal mobile overflow.
