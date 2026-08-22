---
version: alpha
name: MedicalPantry-design-system
description: Medical Pantry's design language — a purpose-driven nonprofit reducing medical waste and supporting communities in need. Clean, minimal, and community-focused, built on a white canvas with a single red accent for action and a navy accent for trust, set in Poppins throughout.
---

colors:
  primary: "#d02327"
  on-primary: "#ffffff"
  secondary: "#141a43"
  on-secondary: "#ffffff"
  ink: "#141a43"
  body: "#4a4a4a"
  mute: "#8a8d99"
  canvas: "#ffffff"
  canvas-soft: "#f5f5f7"
  canvas-navy: "#141a43"
  surface-pressed: "#e8e8ea"
  link: "#d02327"
  on-dark: "#ffffff"

typography:
  display-xxl:
    fontFamily: Poppins, system-ui, Helvetica Neue, Arial, sans-serif
    fontSize: 48px
    fontWeight: 700
    lineHeight: 58px
  display-xl:
    fontFamily: Poppins, system-ui, Helvetica Neue, Arial, sans-serif
    fontSize: 34px
    fontWeight: 700
    lineHeight: 42px
  display-lg:
    fontFamily: Poppins, system-ui, Helvetica Neue, Arial, sans-serif
    fontSize: 28px
    fontWeight: 700
    lineHeight: 36px
  display-md:
    fontFamily: Poppins, system-ui, Helvetica Neue, Arial, sans-serif
    fontSize: 22px
    fontWeight: 700
    lineHeight: 30px
  display-sm:
    fontFamily: Poppins, system-ui, Helvetica Neue, Arial, sans-serif
    fontSize: 18px
    fontWeight: 700
    lineHeight: 26px
  body-lg:
    fontFamily: Poppins, system-ui, Helvetica Neue, Arial, sans-serif
    fontSize: 17px
    fontWeight: 400
    lineHeight: 25.5px
  body-md:
    fontFamily: Poppins, system-ui, Helvetica Neue, Arial, sans-serif
    fontSize: 15px
    fontWeight: 400
    lineHeight: 22.5px
  body-md-strong:
    fontFamily: Poppins, system-ui, Helvetica Neue, Arial, sans-serif
    fontSize: 15px
    fontWeight: 700
    lineHeight: 22.5px
  body-sm:
    fontFamily: Poppins, system-ui, Helvetica Neue, Arial, sans-serif
    fontSize: 13px
    fontWeight: 400
    lineHeight: 19.5px
  caption:
    fontFamily: Poppins, system-ui, Helvetica Neue, Arial, sans-serif
    fontSize: 12px
    fontWeight: 400
    lineHeight: 18px
  button-md:
    fontFamily: Poppins, system-ui, Helvetica Neue, Arial, sans-serif
    fontSize: 15px
    fontWeight: 700
    lineHeight: 20px

rounded:
  none: 0px
  sm: 6px
  md: 10px
  lg: 14px
  xl: 20px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px

components:
  nav-bar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md-strong}"
    padding: "{spacing.sm} {spacing.xl}"
  nav-link:
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.xs} {spacing.md}"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.secondary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.xs} {spacing.md}"
    borderColor: "{colors.secondary}"
  button-subtle:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.xs} {spacing.md}"
  card-content:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  card-content-red:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  card-content-navy:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  stat-card:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.ink}"
    typography: "{typography.display-md}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm}"
    borderColor: "{colors.surface-pressed}"
  icon-badge:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
  footer:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.body-sm}"
    padding: "{spacing.xl} {spacing.xl}"
  link-red:
    textColor: "{colors.link}"
    typography: "{typography.body-md-strong}"

## Visual Theme & Atmosphere

Medical Pantry's design language is **clean, minimal, and purpose-driven**, reflecting the organisation's core values of professionalism, empathy, and impact. The brand exists to reduce medical waste and support communities in need, and the visual system stays out of the way of that mission — every layout is uncluttered and every visual choice has a reason behind it.

- **Community first, impact led.** Real people, real stories, real photography — not stock illustration or corporate abstraction.
- **Professional but friendly.** Credible and reliable without ever feeling cold or distant; the voice of a knowledgeable friend, not an institution.
- **Clean and intentional.** Plenty of white space, one primary accent colour per surface, and layouts that make room for the message rather than competing with it.
- **Trustworthy through restraint.** Navy is used sparingly to signal depth and credibility; red is reserved for the moments that matter — key messages and calls to action.

## Colors

### Brand & Accent
- **Red** (`{colors.primary}` — `#d02327`): The brand's primary digital colour. Reserved for key messages, calls-to-action, primary buttons, and the icon/logo mark. This is the colour that should draw the eye first on any screen.
- **Navy** (`{colors.secondary}` — `#141a43`): The trust colour. Used for depth, contrast, dark-surface bands, footers, and secondary emphasis — never as the primary action colour.

### Surface
- **Canvas** (`{colors.canvas}` — `#ffffff`): The default background. White space is a deliberate design choice, not empty space — it keeps content legible and the brand feeling approachable rather than dense.
- **Canvas Soft** (`{colors.canvas-soft}` — `#f5f5f7`): A light neutral fill for stat cards, subtle section breaks, and secondary content blocks that shouldn't compete with red or navy surfaces.
- **Canvas Navy** (`{colors.canvas-navy}` — `#141a43`): The dark polarity-flip surface, used the same way the red or navy bands appear in the Brand Kit's own slide layouts (dark section with white text).

### Text
- **Ink** (`{colors.ink}` — `#141a43`): Primary heading and body colour on light surfaces — navy, not pure black, to keep the brand's warmth.
- **Body** (`{colors.body}` — `#4a4a4a`): Secondary/supporting copy on white surfaces.
- **Mute** (`{colors.mute}` — `#8a8d99`): Placeholder text, timestamps, low-priority metadata.
- **On Dark / On Primary** (`{colors.on-dark}` / `{colors.on-primary}` — `#ffffff`): All text set on red or navy surfaces.

### Semantic
The Brand Kit does not define a separate error/success/warning palette. Follow the same restraint the brand applies elsewhere: red is already the brand's most saturated colour, so avoid using it for destructive/error states in the same screens where it's also the primary CTA colour — pair it with an icon or label instead of relying on colour alone to signal "danger."

## Typography

### Font Family
**Poppins** carries the entire system — headings, sub-headings, and body copy. There is no secondary typeface; consistency comes from weight and size, not from mixing fonts.

- **Heading / Sub Heading**: Poppins Bold (700)
- **Body Text**: Poppins Regular (400)
- **Line spacing**: 1.5 for body text. Do not compress this — the Brand Kit is explicit that lines should not be squished together.

### Hierarchy

| Token | Size | Weight | Line Height | Use |
|---|---|---|---|---|
| `{typography.display-xxl}` | 48px | 700 | 58px | Hero / landing headline. |
| `{typography.display-xl}` | 34px | 700 | 42px | Page section headlines. |
| `{typography.display-lg}` | 28px | 700 | 36px | Sub-section headlines, promo card titles. |
| `{typography.display-md}` | 22px | 700 | 30px | Card titles, stat highlights. |
| `{typography.display-sm}` | 18px | 700 | 26px | Small headings, list group titles. |
| `{typography.body-lg}` | 17px | 400 | 25.5px | Lead paragraphs. |
| `{typography.body-md}` | 15px | 400 | 22.5px | Default paragraph body. |
| `{typography.body-md-strong}` | 15px | 700 | 22.5px | Emphasised inline text, nav links. |
| `{typography.body-sm}` | 13px | 400 | 19.5px | Captions, metadata, footer text. |
| `{typography.caption}` | 12px | 400 | 18px | Fine print. |
| `{typography.button-md}` | 15px | 700 | 20px | Button labels. |

### Principles
- **Let the design breathe — less is more.** Don't stack multiple heading weights or sizes on one screen if one will do.
- **Bold for statements, regular for support.** Bold text is reserved for key statements and headings; body copy stays regular weight.
- **Never squish line spacing.** 1.5 line-height on body text is a hard rule, not a suggestion — adjust spacing around the block instead of compressing lines.
- **Simple, inclusive language drives the type choices.** Short, clear headlines over long clever ones.

## Layout

### Spacing System
- **Base unit**: 8px, following a clean multiple-of-4/8 scale.
- **Tokens**: `{spacing.xxs}` 4px · `{spacing.xs}` 8px · `{spacing.sm}` 12px · `{spacing.md}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.2xl}` 48px · `{spacing.3xl}` 64px.
- **Section padding**: major page sections sit at `{spacing.2xl}`–`{spacing.3xl}` top/bottom to preserve the brand's signature white space.
- **Card interior padding**: `{spacing.md}` 16px as the default; larger feature cards can extend to `{spacing.lg}` 24px.

### Whitespace Philosophy
White space is treated as a functional element, not a gap to be filled. Per the Brand Kit's own "Do's and Don'ts," avoid cluttering a layout or packing too much informative text into one screen — when a layout feels dense, add space before adding another visual element.

### Responsive Strategy
- **Mobile-first.** The primary product experience (per the Goodrun MoSCoW requirements) is a volunteer-facing mobile app; layouts should default to single-column, thumb-reachable actions, and large tap targets.
- **Admin/web surfaces** can use wider multi-column layouts (tables, dashboards) since admins work from a browser, but should keep the same red/navy/white palette and Poppins type scale.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| Level 0 — Flat | No shadow, no border. | Default for most content — the brand favours flat, clean surfaces over heavy shadowing. |
| Level 1 — Subtle Card | `rgba(20, 26, 67, 0.08) 0px 2px 8px 0px` | Task cards, list items, stat cards — just enough lift to separate from `canvas-soft` backgrounds. |
| Level 2 — Modal / Sheet | `rgba(20, 26, 67, 0.16) 0px 8px 24px 0px` | Modals, bottom sheets, and any surface that floats above the main content. |

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | Full-bleed image bands, section dividers. |
| `{rounded.sm}` | 6px | Input fields, small chips. |
| `{rounded.md}` | 10px | Buttons. |
| `{rounded.lg}` | 14px | Cards — the canonical Medical Pantry card radius. |
| `{rounded.xl}` | 20px | Large feature cards, hero panels. |
| `{rounded.full}` | 9999px | Icon badges, avatar containers, status dots. |

## Components

### Buttons

**`button-primary`** — the canonical red CTA.
- Background `{colors.primary}`, text `{colors.on-primary}`, label in `{typography.button-md}`, padding `{spacing.xs} {spacing.md}`, shape `{rounded.md}`.

**`button-secondary`** — the outline navy button, used when a screen already has a primary red action and needs a lower-emphasis second option.
- Background `{colors.canvas}`, text `{colors.secondary}`, 1.5px navy border, same typography/padding/shape as `button-primary`.

**`button-subtle`** — tertiary action inside cards or lists.
- Background `{colors.canvas-soft}`, text `{colors.ink}`, same shape and typography as above.

### Cards & Containers

**`card-content`** — the canonical white card (task cards, list items, content blocks).
- Background `{colors.canvas}`, text `{colors.ink}`, padding `{spacing.md}`, shape `{rounded.lg}`, Level 1 shadow.

**`card-content-red`** / **`card-content-navy`** — polarity-flipped feature cards used sparingly for high-emphasis callouts (a donation stat, a mission statement), mirroring the red/navy full-bleed panels used throughout the Brand Kit's own slide deck.
- Same padding and shape as `card-content`, background swapped to `{colors.primary}` or `{colors.secondary}` with white text.

**`stat-card`** — impact numbers and highlights (e.g. "10 life-saving Omnibeds rescued from landfill").
- Background `{colors.canvas-soft}`, text `{colors.ink}`, headline in `{typography.display-md}`, padding `{spacing.md}`, shape `{rounded.lg}`.

### Inputs & Forms

**`text-input`** — the canonical text input.
- Background `{colors.canvas}`, 1px `{colors.surface-pressed}` border, text `{colors.ink}`, body in `{typography.body-md}`, padding `{spacing.sm}`, shape `{rounded.sm}`.

### Navigation

**`nav-bar`** — top navigation / app header.
- Background `{colors.canvas}`, text `{colors.ink}`, padding `{spacing.sm} {spacing.xl}`.

**`footer`** — navy footer band, mirroring the Brand Kit's "On Coloured Background" logo lockup.
- Background `{colors.secondary}`, text `{colors.on-secondary}`, padding `{spacing.xl} {spacing.xl}`, body in `{typography.body-sm}`.

### Icons & Imagery

- Icons are simple, single-colour glyphs in red or navy (never both in the same icon) — see the Brand Kit's heart/cross/handshake icon set.
- Photography should feel real, human, and community-focused: volunteers, partnerships, shared moments, animals helped, positive impact in action. Avoid generic stock photography.

## Content & Voice Guardrails
*(carried over directly from the Medical Pantry Digital & Social Media Brand Kit — applies to UI copy as much as social captions)*

- Use simple, inclusive language.
- Highlight real people, real stories, real impact.
- A touch of warmth and personality is welcome (emoji are allowed in casual/social contexts).
- Avoid jargon or unexplained acronyms.
- Never ship low-quality or pixelated imagery.
- Never sound overly corporate or distant.

## Do's and Don'ts

### Do
- Use `{colors.primary}` red as the single accent that carries every call-to-action. If in doubt about which colour to make a button, it's red.
- Use `{colors.secondary}` navy for trust, contrast, and dark-surface moments — footers, secondary panels, depth — not for primary actions.
- Keep every layout built on generous `{colors.canvas}` white space; add space before adding another element.
- Set every heading in Poppins Bold; keep body copy in Poppins Regular at 1.5 line-height.
- Anchor content with real, human photography wherever the layout allows it.

### Don't
- Don't introduce a second accent colour beyond red and navy — the Brand Kit is explicit about a minimal, two-accent palette on white.
- Don't mix typefaces. Poppins carries headings and body both; there is no secondary font.
- Don't compress line spacing to fit more text — expand the container or trim the copy instead.
- Don't clutter a single screen with too much informative text or too many competing visual elements at once.
- Don't use stretched, recoloured, or otherwise altered versions of the Medical Pantry logo.
