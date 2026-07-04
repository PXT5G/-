# GULFOS — Components

> Phase 2 Design Document  
> Component library catalog and UI mock structure for all surfaces.

---

## 1. Component Architecture

```
components/
├── os/           # OS shell (Phase 1 — do not rebuild)
├── ui/           # Shared primitives (extend in Phase 2)
├── settings/     # Settings framework (Phase 1)
├── apps/         # App-specific (Phase 2 — per app)
└── shared/       # Cross-app reusable (Phase 2 — new)
```

### Dependency Rules
1. `ui/` → no dependencies on `os/` or `apps/`
2. `shared/` → may use `ui/`, never `apps/`
3. `apps/<name>/` → may use `ui/`, `shared/`, own components
4. `os/` → may use `ui/`, `shared/`

---

## 2. Phase 1 Components (Existing — Do Not Rebuild)

### OS Shell (`components/os/`)

| Component | File | Props | Status |
|-----------|------|-------|--------|
| SplashScreen | `SplashScreen.tsx` | — | ✅ |
| BootAnimation | `BootAnimation.tsx` | — | ✅ |
| LockScreen | `LockScreen.tsx` | — | ✅ Enhance |
| LockScreenPIN | `LockScreenPIN.tsx` | `onSuccess` | ✅ |
| LockScreenBiometric | `LockScreenBiometric.tsx` | `type`, `onSuccess` | ✅ |
| HomeScreen | `HomeScreen.tsx` | — | ✅ Enhance |
| Dock | `Dock.tsx` | — | ✅ |
| StatusBar | `StatusBar.tsx` | — | ✅ Enhance |
| DynamicIsland | `DynamicIsland.tsx` | — | ✅ Enhance |
| Wallpaper | `Wallpaper.tsx` | — | ✅ |
| WidgetRenderer | `WidgetRenderer.tsx` | `pageIndex` | ✅ |
| ControlCenter | `ControlCenter.tsx` | — | ✅ Enhance |
| NotificationCenter | `NotificationCenter.tsx` | — | ✅ Enhance |
| Search | `Search.tsx` | — | ✅ |
| WindowManager | `WindowManager.tsx` | — | ✅ |
| AppWindow | `AppWindow.tsx` | `window`, `isActive` | ✅ |
| AppIcon | `AppIcon.tsx` | `name`, `icon`, `size`, `onPress` | ✅ |
| AppPlaceholder | `AppPlaceholder.tsx` | `appId`, `appName` | ✅ |
| AppLauncher | `AppLauncher.tsx` | `isOpen`, `onClose` | ✅ |
| MultitaskingView | `MultitaskingView.tsx` | `onClose` | ✅ |
| PermissionDialog | `PermissionDialog.tsx` | — | ✅ |

### UI Primitives (`components/ui/`)

| Component | File | Props | Status |
|-----------|------|-------|--------|
| GlassPanel | `GlassPanel.tsx` | `children`, `intensity`, `className`, `onClick` | ✅ |
| Toggle | `Toggle.tsx` | `enabled`, `onChange`, `label` | ✅ |
| Slider | `Slider.tsx` | `value`, `onChange`, `min`, `max`, `label`, `icon` | ✅ |

### Settings (`components/settings/`)

| Component | File | Status |
|-----------|------|--------|
| SettingsApp | `SettingsApp.tsx` | ✅ |
| SettingsSection | `SettingsSection.tsx` | ✅ |
| SettingsRow | `SettingsRow.tsx` | ✅ |

---

## 3. Phase 2 Shared Components (New — `components/shared/`)

### 3.1 Navigation Components

#### `AppTabBar`
```typescript
interface AppTabBarProps {
  tabs: Array<{
    id: string;
    label: string;
    icon: string;
    badge?: number;
  }>;
  activeTab: string;
  onTabChange: (id: string) => void;
}
```
**Visual:** Fixed bottom bar, gold underline on active, badge on icon.

#### `AppHeader`
```typescript
interface AppHeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: { icon: string; onPress: () => void };
  rightActions?: Array<{ icon: string; onPress: () => void }>;
  transparent?: boolean;
}
```

#### `AppSheet`
```typescript
interface AppSheetProps {
  isOpen: boolean;
  onClose: () => void;
  height?: 'half' | 'full' | 'auto';
  title?: string;
  children: React.ReactNode;
}
```
**Visual:** Slides from bottom, drag handle, glass backdrop.

#### `AppStackScreen`
```typescript
interface AppStackScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  safeArea?: boolean;
}
```

### 3.2 Data Display Components

#### `Avatar`
```typescript
interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  badge?: 'online' | 'verified' | 'none';
}
```
**Sizes:** 24, 32, 40, 56, 80px. Fallback: initials on gold gradient.

#### `ListItem`
```typescript
interface ListItemProps {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;    // Avatar or icon
  right?: React.ReactNode;   // Chevron, badge, toggle
  onPress?: () => void;
  destructive?: boolean;
}
```

#### `Card`
```typescript
interface CardProps {
  children: React.ReactNode;
  variant?: 'glass' | 'solid' | 'outlined';
  padding?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
}
```

#### `Badge`
```typescript
interface BadgeProps {
  count?: number;
  variant?: 'default' | 'gold' | 'error' | 'success';
  dot?: boolean;
}
```

#### `EmptyState`
```typescript
interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: { label: string; onPress: () => void };
}
```

#### `SectionHeader`
```typescript
interface SectionHeaderProps {
  title: string;
  action?: { label: string; onPress: () => void };
}
```

### 3.3 Input Components

#### `TextInput`
```typescript
interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'phone' | 'search';
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
  multiline?: boolean;
}
```

#### `SearchBar`
```typescript
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onCancel?: () => void;
  autoFocus?: boolean;
}
```

#### `PinInput`
```typescript
interface PinInputProps {
  length: 4 | 6;
  value: string;
  onChange: (value: string) => void;
  masked?: boolean;
  error?: boolean;
}
```

#### `DialPad`
```typescript
interface DialPadProps {
  onDigit: (digit: string) => void;
  onDelete: () => void;
  onCall?: () => void;
}
```

### 3.4 Action Components

#### `Button`
```typescript
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}
```
**Variants:**
- Primary: gold bg, black text
- Secondary: glass bg, white text
- Ghost: transparent, gold text
- Destructive: red bg, white text

#### `IconButton`
```typescript
interface IconButtonProps {
  icon: string;
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gold' | 'ghost';
  label?: string; // aria
}
```

#### `FloatingActionButton`
```typescript
interface FABProps {
  icon: string;
  onPress: () => void;
  label?: string;
}
```
**Visual:** Gold circle, bottom-right, shadow-glow.

#### `SegmentedControl`
```typescript
interface SegmentedControlProps {
  segments: Array<{ id: string; label: string }>;
  active: string;
  onChange: (id: string) => void;
}
```

### 3.5 Feedback Components

#### `Toast`
```typescript
interface ToastProps {
  message: string;
  variant?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  action?: { label: string; onPress: () => void };
}
```

#### `Alert`
```typescript
interface AlertProps {
  title: string;
  message?: string;
  actions: Array<{
    label: string;
    onPress: () => void;
    variant?: 'default' | 'destructive';
  }>;
}
```

#### `LoadingSpinner`
```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'gold' | 'white';
}
```

#### `Skeleton`
```typescript
interface SkeletonProps {
  width?: string;
  height?: string;
  variant?: 'text' | 'circle' | 'rect';
}
```

#### `ProgressBar`
```typescript
interface ProgressBarProps {
  value: number; // 0-100
  variant?: 'gold' | 'success' | 'error';
  size?: 'sm' | 'md';
  animated?: boolean;
}
```

### 3.6 Media Components

#### `ImageViewer`
```typescript
interface ImageViewerProps {
  src: string;
  alt?: string;
  onClose: () => void;
  onShare?: () => void;
}
```

#### `QRCode`
```typescript
interface QRCodeProps {
  value: string;
  size?: number;
  logo?: string;
}
```

#### `BarcodeDisplay`
```typescript
interface BarcodeDisplayProps {
  value: string;
  format?: 'CODE128' | 'EAN13';
}
```

### 3.7 Communication Components

#### `ConversationBubble`
```typescript
interface ConversationBubbleProps {
  message: string;
  timestamp: string;
  sent: boolean;
  delivered?: boolean;
  read?: boolean;
  attachment?: { type: string; url: string };
}
```

#### `CallButton`
```typescript
interface CallButtonProps {
  type: 'accept' | 'decline' | 'end' | 'mute' | 'speaker' | 'hold';
  onPress: () => void;
  active?: boolean;
}
```

#### `ContactRow`
```typescript
interface ContactRowProps {
  name: string;
  avatar?: string;
  phone?: string;
  onPress?: () => void;
  onCall?: () => void;
  onMessage?: () => void;
}
```

---

## 4. UI Mock Structure

Wireframe layouts for every major screen. ASCII mockups define component placement before implementation.

### 4.1 Lock Screen (Enhanced)

```
┌────────────────────────────────┐
│  9:41          📶 🔋 87%      │ ← StatusBar
│         ┌──────────┐           │
│         │  Island  │           │ ← DynamicIsland
│         └──────────┘           │
│                                │
│      Saturday, July 4          │ ← Date
│                                │
│          9:41                  │ ← Clock (72px)
│                                │
│  ┌──────────────────────────┐  │
│  │ 🔔 Messages    2m ago   │  │ ← Notification preview
│  │ Hey, are you free?      │  │
│  └──────────────────────────┘  │
│                                │
│                                │
│  🆘          🔢 👤 👆      📷  │ ← Emergency, PIN, Face, Touch, Camera
│                                │
│         ─────                  │ ← Swipe indicator
│      Swipe up to unlock        │
│  🔦                             │ ← Flashlight
└────────────────────────────────┘
```

### 4.2 Home Screen

```
┌────────────────────────────────┐
│  9:41          📶 🔋 87%      │
│         ┌──────────┐           │
│         │  Island  │           │
│         └──────────┘           │
│  ┌──────────┐ ┌──────────┐    │
│  │  9:41    │ │  24°     │    │ ← Widgets
│  │  Sat Jul │ │  Sunny   │    │
│  └──────────┘ └──────────┘    │
│                                │
│  📞   💬   🌐   ⚙️            │ ← App Grid (4×6)
│  Phone Msg Browser Set         │
│                                │
│  📷   🎵   📁   🏦            │
│  Cam  Music Files Bank         │
│                                │
│         ● ○ ○                  │ ← Page dots
│  ┌──────────────────────────┐  │
│  │ 📞  💬  🌐  ⚙️          │  │ ← Dock
│  └──────────────────────────┘  │
│         ─────                  │ ← Home indicator
└────────────────────────────────┘
```

### 4.3 Control Center

```
┌────────────────────────────────┐
│  ┌──────────────────────────┐  │
│  │ ┌────┐┌────┐┌────┐┌────┐│  │
│  │ │ 📶 ││ 🔵 ││ 🌙 ││ 🔇 ││  │ ← Control tiles (2×4)
│  │ │WiFi││ BT ││Dark││Mute││  │
│  │ └────┘└────┘└────┘└────┘│  │
│  │ ┌────┐┌────┐            │  │
│  │ │ 🔦 ││ 🔒 │            │  │
│  │ │Flsh││Lock│            │  │
│  │ └────┘└────┘            │  │
│  │                          │  │
│  │ ☀️ ────────●──── 80%     │  │ ← Brightness slider
│  │ 🔊 ──────●────── 70%     │  │ ← Volume slider
│  │                          │  │
│  │ ┌──────────────────────┐ │  │
│  │ │  🏬 GulfDrop      │ │  │ ← Sharing panel
│  │ │  Tap to share nearby │ │  │
│  │ └──────────────────────┘ │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

### 4.4 Identity App

```
┌────────────────────────────────┐
│  ← Identity            Share ⤴ │ ← AppHeader
│                                │
│  ┌──────────────────────────┐  │
│  │      ┌────────┐          │  │
│  │      │ Photo  │          │  │ ← Avatar (xl)
│  │      └────────┘          │  │
│  │                          │  │
│  │    Johnathan Gulf      │  │ ← Full Name
│  │    @jgulf        ✓     │  │ ← Username + verified badge
│  │                          │  │
│  │  ┌────────────────────┐  │  │
│  │  │  National ID       │  │  │
│  │  │  BN-2026-004281    │  │  │
│  │  └────────────────────┘  │  │
│  │                          │  │
│  │  Membership: Gold        │  │
│  │  Country: Gulf Republic│  │
│  │  Issued: Jan 1, 2026    │  │
│  │  Expires: Jan 1, 2031   │  │
│  │                          │  │
│  │  ┌──────┐  ┌─────────┐  │  │
│  │  │ QR   │  │ Barcode │  │  │ ← QR + Barcode
│  │  │ Code │  │         │  │  │
│  │  └──────┘  └─────────┘  │  │
│  │                          │  │
│  │  Signature: ________     │  │
│  └──────────────────────────┘  │
│                                │
│  [Copy ID]  [PDF]  [Print]    │ ← Action buttons
│         ─────                  │
└────────────────────────────────┘
```

### 4.5 Phone App

```
┌────────────────────────────────┐
│  ← Phone                       │
│                                │
│  ┌──────────────────────────┐  │
│  │     +1 (555) 123-4567    │  │ ← Number display
│  └──────────────────────────┘  │
│                                │
│  ┌───┐ ┌───┐ ┌───┐           │
│  │ 1 │ │ 2 │ │ 3 │           │
│  │   │ │ABC│ │DEF│           │ ← DialPad
│  ├───┤ ├───┤ ├───┤           │
│  │ 4 │ │ 5 │ │ 6 │           │
│  │GHI│ │JKL│ │MNO│           │
│  ├───┤ ├───┤ ├───┤           │
│  │ 7 │ │ 8 │ │ 9 │           │
│  │PQR│ │TUV│ │WXY│           │
│  ├───┤ ├───┤ ├───┤           │
│  │ * │ │ 0 │ │ # │           │
│  └───┘ └───┘ └───┘           │
│                                │
│       ┌─────────┐              │
│       │  📞 Call │              │ ← Call button (green)
│       └─────────┘              │
│                                │
│  Favorites│Recents│Contacts│VM │ ← AppTabBar
│         ─────                  │
└────────────────────────────────┘
```

### 4.6 Messages App

```
┌────────────────────────────────┐
│  Messages              ✏️ New  │
│  ┌──────────────────────────┐  │
│  │ 🔍 Search messages...    │  │ ← SearchBar
│  └──────────────────────────┘  │
│                                │
│  ┌──────────────────────────┐  │
│  │ 👤 Sarah Johnson    2m  │  │
│  │ Hey, are you free...  (2)│  │ ← Conversation list
│  ├──────────────────────────┤  │
│  │ 👤 Mike Chen       15m  │  │
│  │ Thanks for the help!      │  │
│  ├──────────────────────────┤  │
│  │ 👤 Team Group       1h  │  │
│  │ 📷 Photo            (5)  │  │
│  └──────────────────────────┘  │
│                                │
│  Chats │ Archive               │ ← AppTabBar
│         ─────                  │
└────────────────────────────────┘
```

### 4.7 Bank App

```
┌────────────────────────────────┐
│  ← Bank                        │
│                                │
│  Total Balance                 │
│  € 12,450.00                   │ ← Balance display
│                                │
│  ┌──────────────────────────┐  │
│  │ 💳 Main Account          │  │
│  │ € 8,200.00    ****4521   │  │ ← Account card
│  ├──────────────────────────┤  │
│  │ 💳 Savings               │  │
│  │ € 4,250.00    ****7832   │  │
│  └──────────────────────────┘  │
│                                │
│  Quick Actions                 │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ │
│  │Send│ │Pay │ │Bill│ │ QR │ │ ← Action tiles
│  └────┘ └────┘ └────┘ └────┘ │
│                                │
│  Recent Transactions           │
│  ┌──────────────────────────┐  │
│  │ 🛒 Grocery Store  -€45  │  │
│  │ 💰 Salary      +€3200  │  │
│  │ ⚡ Electric      -€89  │  │
│  └──────────────────────────┘  │
│                                │
│  Home│Cards│Transfer│More     │ ← AppTabBar
│         ─────                  │
└────────────────────────────────┘
```

### 4.8 Police App

```
┌────────────────────────────────┐
│  ← Police              🔔     │
│                                │
│  ┌──────────────────────────┐  │
│  │  Officer Dashboard        │  │
│  │  Unit: Alpha-7            │  │
│  │  Status: On Duty  🟢       │  │
│  └──────────────────────────┘  │
│                                │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ │
│  │Apps│ │Rpts│ │Want│ │Tckt│ │ ← Quick access
│  └────┘ └────┘ └────┘ └────┘ │
│                                │
│  Active Dispatches             │
│  ┌──────────────────────────┐  │
│  │ 🚨 Priority 1             │  │
│  │ 123 Main St — Disturbance │  │
│  │ Assigned: 3m ago          │  │
│  ├──────────────────────────┤  │
│  │ ⚠️ Priority 2             │  │
│  │ 456 Oak Ave — Traffic     │  │
│  └──────────────────────────┘  │
│                                │
│  Dash│Units│Chat│More          │ ← AppTabBar
│         ─────                  │
└────────────────────────────────┘
```

---

## 5. Component File Plan (Phase 2)

### New files to create:

```
components/shared/
├── AppTabBar.tsx
├── AppHeader.tsx
├── AppSheet.tsx
├── AppStackScreen.tsx
├── Avatar.tsx
├── ListItem.tsx
├── Card.tsx
├── Badge.tsx
├── EmptyState.tsx
├── SectionHeader.tsx
├── TextInput.tsx
├── SearchBar.tsx
├── PinInput.tsx
├── DialPad.tsx
├── Button.tsx
├── IconButton.tsx
├── FloatingActionButton.tsx
├── SegmentedControl.tsx
├── Toast.tsx
├── Alert.tsx
├── LoadingSpinner.tsx
├── Skeleton.tsx
├── ProgressBar.tsx
├── ImageViewer.tsx
├── QRCode.tsx
├── BarcodeDisplay.tsx
├── ConversationBubble.tsx
├── CallButton.tsx
├── ContactRow.tsx
└── index.ts              # barrel export
```

### OS enhancements (modify existing):

```
components/os/
├── LockScreenShortcuts.tsx   # NEW — emergency, camera, flashlight
├── FolderOverlay.tsx         # NEW — folder view
├── GulfDrop.tsx            # NEW — sharing panel
├── IslandActivities.tsx      # NEW — live activity renderers
├── NotificationGroup.tsx     # NEW — grouped notifications
└── JiggleMode.tsx            # NEW — edit mode wrapper
```

---

## 6. Component Testing Strategy

| Level | Tool | Coverage |
|-------|------|----------|
| Unit | Vitest + RTL | Props, rendering, events |
| Visual | Storybook (Phase 2) | All variants, themes |
| Integration | Playwright | OS flows with components |
| Accessibility | axe-core | WCAG 2.1 AA per component |

---

## 7. Implementation Order

1. **Shared primitives** — Button, TextInput, Avatar, ListItem, Card
2. **Navigation** — AppTabBar, AppHeader, AppSheet, AppStackScreen
3. **Feedback** — Toast, Alert, LoadingSpinner, Skeleton
4. **Communication** — DialPad, ConversationBubble, ContactRow, CallButton
5. **Media** — QRCode, BarcodeDisplay, ImageViewer
6. **OS enhancements** — Lock shortcuts, folders, GulfDrop, island activities

Then per-app screens using these components.
