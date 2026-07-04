# BananaOS — Design System

> Phase 2 Design Document  
> Visual language, tokens, and styling rules for all BananaOS surfaces.

---

## 1. Brand Identity

### Logo
- **Mark:** Banana silhouette in gold on dark rounded square
- **Wordmark:** `Banana` (white) + `OS` (gold)
- **Component:** `BananaLogo.tsx`
- **Minimum size:** 32px (digital), 16px (favicon)

### Brand Values
| Value | Expression |
|-------|------------|
| Luxury | Gold accents, generous whitespace, premium shadows |
| Minimal | Clean layouts, limited color palette, no clutter |
| Modern | Glassmorphism, smooth motion, rounded geometry |
| Original | No Apple assets; BananaOS-specific patterns |

---

## 2. Color System

### Core Palette

| Token | Hex | CSS Variable | Usage |
|-------|-----|--------------|-------|
| Banana Gold | `#D4AF37` | `--color-banana-gold` | Primary accent, CTAs, active states |
| Banana Black | `#0A0A0A` | `--color-banana-black` | Primary background (dark) |
| Banana White | `#FFFFFF` | `--color-banana-white` | Primary text, icons |
| Surface Dark | `#1A1A1A` | `--surface-dark` | Cards, panels |
| Surface Elevated | `#2D2D2D` | `--surface-elevated` | Modals, sheets |
| Glass White | `rgba(255,255,255,0.10)` | `--glass-white` | Glassmorphism fill |
| Glass Border | `rgba(255,255,255,0.15)` | `--glass-border` | Glass borders |
| Text Primary | `#FFFFFF` | `--text-primary` | Headings, body (dark mode) |
| Text Secondary | `rgba(255,255,255,0.60)` | `--text-secondary` | Subtitles, captions |
| Text Tertiary | `rgba(255,255,255,0.40)` | `--text-tertiary` | Placeholders, hints |
| Success | `#34C759` | `--color-success` | Confirmations, online |
| Warning | `#FF9500` | `--color-warning` | Alerts, caution |
| Error | `#FF3B30` | `--color-error` | Errors, destructive |
| Info | `#007AFF` | `--color-info` | Links, information |

### Light Mode Overrides

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#F5F5F5` | Primary background |
| Surface | `#FFFFFF` | Cards, panels |
| Text Primary | `#1A1A1A` | Headings, body |
| Text Secondary | `rgba(0,0,0,0.60)` | Subtitles |
| Glass Fill | `rgba(0,0,0,0.05)` | Glass panels |
| Glass Border | `rgba(0,0,0,0.10)` | Borders |

### Accent Colors (User-selectable)

| Name | Primary | Glow |
|------|---------|------|
| Gold (default) | `#D4AF37` | `rgba(212,175,55,0.4)` |
| White | `#FFFFFF` | `rgba(255,255,255,0.3)` |
| Black | `#1A1A1A` | `rgba(0,0,0,0.3)` |

---

## 3. Typography

### Font Stack
```css
font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
```

### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| Display XL | 72px | 200 (extralight) | 1.0 | Lock screen clock |
| Display L | 48px | 300 (light) | 1.1 | Hero headings |
| Heading 1 | 28px | 700 (bold) | 1.2 | Page titles |
| Heading 2 | 22px | 600 (semibold) | 1.3 | Section headers |
| Heading 3 | 18px | 600 | 1.3 | Card titles |
| Body | 16px | 400 (regular) | 1.5 | Body text |
| Body Small | 14px | 400 | 1.4 | Secondary text |
| Caption | 12px | 500 (medium) | 1.3 | Labels, timestamps |
| Micro | 10px | 500 | 1.2 | Badges, dock labels |
| Mono | 13px | 400 | 1.4 | Code, IDs, bundle IDs |

### Font Size Setting

| Setting | Scale Factor |
|---------|-------------|
| Small | 0.875× |
| Medium | 1× (default) |
| Large | 1.125× |

Applied via `settingsStore.fontSize` → `document.documentElement.style.fontSize`

---

## 4. Spacing

### Base Unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight gaps |
| `space-2` | 8px | Icon-to-label |
| `space-3` | 12px | Card padding (compact) |
| `space-4` | 16px | Standard padding |
| `space-5` | 20px | Section gaps |
| `space-6` | 24px | Screen margins |
| `space-8` | 32px | Large gaps |
| `space-10` | 40px | Section separators |
| `space-12` | 48px | Hero spacing |
| `space-16` | 64px | Major sections |

### Layout Grid
- **Screen width:** 390px (phone frame)
- **Screen height:** 844px
- **Horizontal margin:** 24px (`px-6`)
- **App grid:** 4 columns, 16px gap
- **Safe area top:** 56px (status bar + island)
- **Safe area bottom:** 96px (dock + home indicator)

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 8px | Small buttons, inputs |
| `radius-md` | 12px | Cards, tiles |
| `radius-lg` | 16px | App icons, panels |
| `radius-xl` | 20px | Large cards |
| `radius-2xl` | 24px | Dock, sheets |
| `radius-3xl` | 32px | Phone frame corners |
| `radius-full` | 9999px | Pills, dots, island |

---

## 6. Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.3)` | Subtle elevation |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.4)` | Cards, icons |
| `shadow-lg` | `0 8px 24px rgba(0,0,0,0.5)` | Dock, modals |
| `shadow-xl` | `0 16px 48px rgba(0,0,0,0.6)` | Overlays |
| `shadow-glow` | `0 0 20px var(--accent-glow)` | Active gold elements |
| `shadow-island` | `0 4px 16px rgba(0,0,0,0.5)` | Dynamic Island |

---

## 7. Glassmorphism

### Glass Panel Spec (`GlassPanel.tsx`)

| Intensity | Background | Blur | Border |
|-----------|------------|------|--------|
| Low | `white/5` | `backdrop-blur-md` (12px) | `white/10` |
| Medium | `white/10` | `backdrop-blur-xl` (24px) | `white/15` |
| High | `white/15` | `backdrop-blur-2xl` (40px) | `white/20` |

### Rules
- Always pair glass fill with backdrop blur
- Add subtle border for edge definition
- Never stack more than 2 glass layers
- Light mode: use `black/5` fill instead

---

## 8. Motion

### Principles
1. **Purposeful** — motion communicates state change
2. **Responsive** — spring physics, not linear
3. **Fast** — most transitions < 400ms
4. **Respectful** — honor `reduceMotion` preference

### Spring Presets

| Name | Stiffness | Damping | Usage |
|------|-----------|---------|-------|
| Default | 400 | 30 | General transitions |
| Smooth | 300 | 35 | Panels, sheets |
| Bounce | 500 | 15 | Icon taps |
| Gentle | 200 | 25 | Fade overlays |

### Duration Presets

| Name | Duration | Usage |
|------|----------|-------|
| Instant | 100ms | Toggle state |
| Fast | 200ms | Fade, crossfade |
| Normal | 300ms | Slide, scale |
| Slow | 500ms | Lock/unlock |
| Boot | 800ms | Splash logo |

### Performance
- Target 120fps on capable devices
- Use `transform` and `opacity` only (GPU composited)
- Avoid animating `width`, `height`, `top`, `left`
- Use `will-change` sparingly on active animations

---

## 9. Iconography

### App Icons
- Size: 56×56px (md), 48×48px (sm), 64×64px (lg)
- Container: rounded-2xl with glass background
- Emoji icons for Phase 2 (replaceable with SVG set later)
- Badge: 20px red circle, top-right

### System Icons
- Size: 16px (status bar), 20px (controls), 24px (headers)
- Color: white at 70% opacity default, 100% on active
- Gold on active/selected state

---

## 10. Component States

### Interactive States

| State | Visual Change |
|-------|--------------|
| Default | Base styling |
| Hover | `bg-white/5` (desktop only) |
| Press/Active | `scale(0.95–0.98)` |
| Focus | Gold outline ring 2px |
| Disabled | 40% opacity, no pointer |
| Loading | Skeleton shimmer or spinner |
| Error | Red border + error message |
| Selected | Gold background/border |

---

## 11. Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|----------------|
| Color contrast | 4.5:1 minimum for text |
| Touch targets | 44×44px minimum |
| Focus indicators | Visible gold ring |
| Screen reader | `aria-label`, `role`, `aria-live` |
| Reduced motion | `reduce-motion` class |
| High contrast | `highContrast` setting → stronger borders |
| Font scaling | Small/Medium/Large settings |
| Keyboard nav | Tab order, Enter/Space activation |

---

## 12. Dark / Light Theme

### Theme Resolution
```
settingsStore.theme
    ├── 'dark' → dark palette
    ├── 'light' → light palette
    └── 'system' → matchMedia('prefers-color-scheme')
```

### Application
```html
<html data-theme="dark|light" class="dark|">
```

All components use CSS variables — no hardcoded colors in components.

---

## 13. Wallpaper System

| Type | Implementation |
|------|---------------|
| Gradient | CSS `linear-gradient` |
| Animated | `@keyframes wallpaper-shift` (15s loop) |
| Image | `background-image: url()` with cover |

Brightness controlled via `filter: brightness(N%)` on wallpaper layer.

---

## 14. Tone & Voice

| Context | Tone | Example |
|---------|------|---------|
| System messages | Neutral, concise | "Connected to WiFi" |
| Errors | Helpful, not blaming | "Could not send message. Try again." |
| Confirmations | Brief, positive | "Transfer complete" |
| Empty states | Encouraging | "No messages yet. Start a conversation." |
| Permissions | Clear, honest | "Camera access lets you take photos." |

---

## 15. Do's and Don'ts

### Do
- Use gold sparingly for emphasis
- Maintain generous padding
- Use glassmorphism on overlay layers
- Animate with spring physics
- Test in both light and dark modes

### Don't
- Copy Apple UI assets or patterns literally
- Use more than 3 colors per screen
- Animate layout properties
- Use fonts other than system stack
- Place text below 40% opacity on backgrounds
