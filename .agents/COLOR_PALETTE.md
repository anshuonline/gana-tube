# GanaTube Project — Official Design System & Color Palette

The file `src/styles/_palette.scss` is the **single source of truth (SSOT)** for all colors, theme tokens, and design variables across **GanaTube**.

> [!IMPORTANT]
> **Centralized Color Management**: All components, layouts, and styles **must** consume design tokens via CSS custom properties (`var(--color-...)`) or SCSS variables (`$color-...`).
> **Never hardcode hex or rgb values in component CSS/SCSS.**
> Modifying token values directly in `src/styles/_palette.scss` automatically updates the entire application without needing manual find-and-replace across components.

---

## 🎨 Single Source of Truth (`src/styles/_palette.scss`)

All design tokens are defined in `:root` and mapped to SCSS variables in `src/styles/_palette.scss`:

```scss
:root {
  /* ---- Brand / Primary Red (Single Source of Truth) ---- */
  --color-primary: #F50919;
  --color-primary-hover: #D90816;
  --color-primary-soft: #3A1014;
  --color-primary-glow: rgba(245, 9, 25, 0.35);

  /* ---- Backgrounds & Surfaces (AMOLED Dark) ---- */
  --color-bg-main: #0A0A0A;
  --color-bg-card: #141414;
  --color-bg-card-subtle: #181818;
  --color-bg-hover: #222222;
  --color-bg-player: #080808;

  /* ---- Typography Colors ---- */
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #B3B3B3;
  --color-text-muted: #737373;

  /* ---- Borders & Dividers ---- */
  --color-border: #282828;
  --color-border-subtle: rgba(255, 255, 255, 0.08);

  /* ---- Semantic Status Colors ---- */
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-error: #F50919;
  --color-info: #3B82F6;

  /* ---- Brand Gradients & Lighting ---- */
  --gradient-primary: linear-gradient(135deg, #F50919 0%, #D90816 100%);
  --gradient-primary-glow: linear-gradient(135deg, #F50919 0%, #FF3B30 100%);
  --gradient-primary-soft: linear-gradient(135deg, rgba(245, 9, 25, 0.16) 0%, rgba(217, 8, 22, 0.08) 100%);
  --glow-primary: 0 4px 20px rgba(245, 9, 25, 0.4);
  --shadow-player: 0 8px 40px rgba(0, 0, 0, 0.8);
  --glass-bg: rgba(8, 8, 8, 0.75);
  --glass-blur: blur(24px) saturate(1.4);

  /* ---- Backwards-Compatibility Aliases ---- */
  --color-bg: var(--color-bg-main);
  --color-surface: var(--color-bg-card);
  --color-surface-2: var(--color-bg-hover);
  --color-secondary: var(--color-primary-hover);
  --color-accent: var(--color-primary);
  --color-text: var(--color-text-primary);
  --color-primary-dark: var(--color-primary-hover);
}
```

---

## 🛠️ SCSS Variable Mappings

For SCSS stylesheets, import `styles/palette` and utilize the pre-declared variables:

```scss
$color-primary: var(--color-primary);
$color-primary-hover: var(--color-primary-hover);
$color-primary-soft: var(--color-primary-soft);
$color-bg-main: var(--color-bg-main);
$color-bg-card: var(--color-bg-card);
$color-bg-hover: var(--color-bg-hover);
$color-bg-player: var(--color-bg-player);
$color-text-primary: var(--color-text-primary);
$color-text-secondary: var(--color-text-secondary);
$color-text-muted: var(--color-text-muted);
$color-border: var(--color-border);
$gradient-primary: var(--gradient-primary);
$glow-primary: var(--glow-primary);
```

---

## 📋 Design Tokens Reference Table

### 1. Brand & Accent Colors
| CSS Variable | SCSS Variable | Hex / RGBA | Usage |
| :--- | :--- | :--- | :--- |
| `--color-primary` | `$color-primary` | `#F50919` | Primary Brand Red. Play buttons, active indicators, brand logo accents. |
| `--color-primary-hover` | `$color-primary-hover` | `#D90816` | Hover state for primary buttons and interactive accents. |
| `--color-primary-soft` | `$color-primary-soft` | `#3A1014` | Subdued primary tinted background (badges, chips, soft active highlights). |
| `--color-primary-glow` | — | `rgba(245, 9, 25, 0.35)` | Ambient glow color for player controls and active cards. |

### 2. Backgrounds & Surfaces (AMOLED Dark)
| CSS Variable | SCSS Variable | Hex Code | Usage |
| :--- | :--- | :--- | :--- |
| `--color-bg-main` | `$color-bg-main` | `#0A0A0A` | Global application canvas background. |
| `--color-bg-card` | `$color-bg-card` | `#141414` | Cards, popups, sidebars, sheets. |
| `--color-bg-card-subtle` | — | `#181818` | Secondary nested cards, inactive input fields. |
| `--color-bg-hover` | `$color-bg-hover` | `#222222` | Hover surface for list rows, table rows, dropdown items. |
| `--color-bg-player` | `$color-bg-player` | `#080808` | Persistent mini-player and full-screen player backdrop. |

### 3. Typography
| CSS Variable | SCSS Variable | Value | Usage |
| :--- | :--- | :--- | :--- |
| `--color-text-primary` | `$color-text-primary` | `#FFFFFF` | Primary headers, track titles, active labels. |
| `--color-text-secondary` | `$color-text-secondary` | `#B3B3B3` | Artist names, descriptions, subheadings. |
| `--color-text-muted` | `$color-text-muted` | `#737373` | Durations, metadata, timestamps, placeholders. |

### 4. Borders & Dividers
| CSS Variable | SCSS Variable | Value | Usage |
| :--- | :--- | :--- | :--- |
| `--color-border` | `$color-border` | `#282828` | Standard structural borders. |
| `--color-border-subtle` | — | `rgba(255, 255, 255, 0.08)` | Subtle card outlines and glass dividers. |

### 5. Semantic Status
| CSS Variable | Hex Code | Purpose |
| :--- | :--- | :--- |
| `--color-success` | `#22C55E` | Online badges, connected states, success toasts. |
| `--color-warning` | `#F59E0B` | Coin rewards, caution alerts, pending items. |
| `--color-error` | `#F50919` | Destructive/delete actions, error messages, offline states. |
| `--color-info` | `#3B82F6` | Informational badges, audio bitrates, hints. |

---

## 🛡️ Zero-Tolerance Architectural Rules

1. **Always Use Tokens, Never Hardcode**:
   - Never write `#F50919`, `#0A0A0A`, or `#141414` directly in component `.scss` files. Always reference `var(--color-primary)` or `$color-primary`.
2. **Central Theme Switching**:
   - Any theme adjustment must only require editing `src/styles/_palette.scss`. If a component breaks when a color is updated in `_palette.scss`, it violates encapsulation.
3. **Delete Buttons Must Be Red**:
   - Destructive actions (delete playlist, remove song, leave room) must use `--color-error` / red styling (`#F50919` or `bg-red-500/10 text-red-400`).
4. **Dark AMOLED Canvas**:
   - Never introduce light-colored or pure white canvases. Backgrounds must adhere to `--color-bg-main` (`#0A0A0A`) and `--color-bg-card` (`#141414`).

