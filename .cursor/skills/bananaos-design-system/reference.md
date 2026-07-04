# BananaOS Design System — Reference

## OS Shell Components

| Component | File | Notes |
|-----------|------|-------|
| Splash | `os/SplashScreen.tsx` | Boot branding |
| Lock Screen | `os/LockScreen.tsx` | PIN, Face, Touch unlock |
| Home Screen | `os/HomeScreen.tsx` | Widgets + app grid |
| Wallpaper | `os/Wallpaper.tsx` | Gradient backgrounds |
| Control Center | `os/ControlCenter.tsx` | Quick toggles |
| Search | `os/Search.tsx` | Spotlight-style |
| Multitasking | `os/MultitaskingView.tsx` | App switcher |
| Permission Dialog | `os/PermissionDialog.tsx` | OS permission prompts |

## UI Primitives

| Component | File |
|-----------|------|
| GlassPanel | `ui/GlassPanel.tsx` — `intensity`: low \| medium \| high |
| Toggle | `ui/Toggle.tsx` |
| Slider | `ui/Slider.tsx` |

## Shared

| Component | File |
|-----------|------|
| Button | `shared/Button.tsx` — variants: primary, secondary, ghost, destructive |
| EmptyState | `shared/EmptyState.tsx` |
| SearchBar | `shared/SearchBar.tsx` |
| ProgressBar | `shared/ProgressBar.tsx` |
| RatingStars | `shared/RatingStars.tsx` |

## App Tab Bar Examples

- `apps/web/src/apps/bank/components/BankTabBar.tsx`
- `apps/web/src/apps/sim/components/SimTabBar.tsx`
- `apps/web/src/apps/contacts/components/ContactsTabBar.tsx`

## Dashboard Card Examples

- `apps/web/src/apps/bank/screens/DashboardScreen.tsx`
- `apps/web/src/apps/sim/screens/HomeScreen.tsx`
- `apps/web/src/apps/contacts/screens/HomeScreen.tsx`

## Animation Presets

File: `apps/web/src/animations/transitions.ts`

- `springTransition` — stiffness 400, damping 30
- `smoothTransition` — stiffness 300, damping 35
- `fadeIn`, `slideUp`, `slideDown`, `scaleIn`
- `staggerContainer`, `staggerItem` — list reveals
- `dockAnimation` — dock entrance
- `islandExpand` — Dynamic Island size states

## Icons

Use emoji for app icons in manifests (`icon: '📶'`). Use Lucide for inline UI icons when emoji is inappropriate.

## Spacing Scale

- Screen padding: `px-4 py-4`
- Card padding: `p-3` to `p-5`
- Grid gaps: `gap-2` (tight), `gap-4` (standard)
- Section labels: `mb-2` to `mb-4`

## Typography Scale

| Role | Classes |
|------|---------|
| App label | `text-[10px] text-banana-gold uppercase tracking-widest` |
| Subtitle | `text-[9px] text-white/40` |
| Card title | `text-sm font-medium text-white` |
| Hero number | `text-2xl` or `text-3xl font-bold text-white` |
| Muted body | `text-xs text-white/50` |
