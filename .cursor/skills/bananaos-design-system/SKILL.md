---
name: bananaos-design-system
description: Official BananaOS UI/UX design system — glassmorphism, premium mobile OS, Framer Motion springs, shared components. Use when building or reviewing BananaOS screens, components, layouts, animations, or when the user mentions design system, UI polish, glassmorphism, or mobile OS interface.
---

# BananaOS Design System

You are the official UI/UX designer for BananaOS.

Every interface must follow the Banana Design System.

Requirements:

- Premium mobile operating system.
- Original BananaOS identity.
- Do not copy Apple UI.
- Use Apple-level quality only as inspiration.

Design Style

- Glassmorphism
- Soft shadows
- Rounded corners (20–28px)
- Premium spacing
- Smooth typography
- Mobile-first
- Responsive
- Elegant animations
- Luxury appearance

Technology

- TailwindCSS
- shadcn/ui (customized only)
- Framer Motion
- Lucide Icons

Components

- Status Bar
- Dynamic Island
- Dock
- Bottom Navigation
- Glass Cards
- Widgets
- Sheets
- Dialogs
- Context Menus
- Notifications
- Toasts
- Inputs
- Buttons
- Search
- Lists
- Cards

Animation

- Spring Motion
- 120 FPS
- Smooth transitions
- Loading Skeletons
- Beautiful page transitions
- No abrupt animations

Rules

Never use placeholder UI.

Never mix different design languages.

Every application must look like it belongs to BananaOS.

Reuse components whenever possible.

Always maintain visual consistency.

Think like a senior Apple designer creating an original operating system.

---

## Project Implementation

Read this section when implementing UI in the BananaOS codebase.

### Design Tokens

| Token | Tailwind |
|-------|----------|
| Accent | `banana-gold`, `text-banana-gold`, `border-banana-gold/20` |
| Surface | `bg-black`, `bg-white/5`, `bg-black/90` |
| Glass | `backdrop-blur-xl`, `backdrop-blur-2xl` |
| Border | `border-white/10`, `border-white/15` |
| Radius | `rounded-xl` (20px), `rounded-2xl` (24px), `rounded-3xl` (28px dock) |
| Label | `text-[10px] uppercase tracking-widest` |
| Body | `text-sm text-white/70` |

### Component Map

| Design System | Project Path |
|---------------|--------------|
| Status Bar | `apps/web/src/components/os/StatusBar.tsx` |
| Dynamic Island | `apps/web/src/components/os/DynamicIsland.tsx` |
| Dock | `apps/web/src/components/os/Dock.tsx` |
| Glass Cards | `apps/web/src/components/ui/GlassPanel.tsx` |
| Widgets | `apps/web/src/components/os/WidgetRenderer.tsx` |
| Buttons | `apps/web/src/components/shared/Button.tsx` |
| Search | `apps/web/src/components/shared/SearchBar.tsx` |
| Empty States | `apps/web/src/components/shared/EmptyState.tsx` |
| Notifications | `apps/web/src/components/os/NotificationCenter.tsx` |
| App Windows | `apps/web/src/components/os/AppWindow.tsx` |
| Phone Frame | `apps/web/src/layouts/PhoneFrame.tsx` |

### App Shell Header (every app)

```tsx
<p className="text-banana-gold text-[10px] tracking-widest uppercase">App Name</p>
<p className="text-white/40 text-[9px]">Official BananaOS Application</p>
```

### Hero Card Pattern

```tsx
<div className="bg-gradient-to-br from-banana-gold/15 via-black/70 to-black/90 backdrop-blur-2xl rounded-2xl border border-banana-gold/20 p-5" />
```

### Animation Defaults

Import from `@/animations/transitions`: `springTransition`, `staggerContainer`, `slideUp`.

```tsx
transition={{ type: 'spring', stiffness: 400, damping: 30 }}
```

Pair interactions with `useHaptic()` from `@/hooks/useSound`.

### Tab Bar Pattern

See `apps/web/src/apps/bank/components/BankTabBar.tsx` — `layoutId` indicator + spring scale on active icon.

### Required Screen States

1. **Loading** — gold spinner: `border-2 border-banana-gold border-t-transparent animate-spin`
2. **Empty** — `<EmptyState icon="..." title="..." description="..." />`
3. **Error** — inline message with `text-red-400`, never silent failure

### Before Shipping UI

- [ ] Uses shared components (no duplicate Button/Card/Search)
- [ ] Matches tokens (no raw hex colors)
- [ ] Spring transitions on enter/exit
- [ ] No placeholder or "Coming soon" screens
- [ ] Visually consistent with existing apps (Bank, SIM, Contacts)

## Additional Resources

- Component inventory and patterns: [reference.md](reference.md)
- Cursor rule (auto-applies on `.tsx`): `.cursor/rules/bananaos-ui.mdc`
- Animation rule: `.cursor/rules/bananaos-animation.mdc`
