# GULFOS — Phone Sections

> Phase 2 Design Document  
> Status: Planning  
> Base System: Phase 1 (Complete — do not rebuild)

This document describes every OS-level screen in GULFOS. Each section maps to existing Phase 1 components and defines Phase 2 enhancements.

---

## Screen Index

| # | Screen | Phase 1 Status | Phase 2 Scope |
|---|--------|----------------|---------------|
| 01 | Boot Screen | ✅ Complete | Polish + branding |
| 02 | Lock Screen | ✅ Partial | Emergency, shortcuts |
| 03 | Home Screen | ✅ Partial | Folders, drag-drop |
| 04 | Notification Center | ✅ Partial | Grouping, priority |
| 05 | Control Center | ✅ Partial | GulfDrop sharing |
| 06 | Dynamic Island | ✅ Partial | Live Activities |
| 07 | Search | ✅ Complete | App + content search |
| 08 | App Window | ✅ Complete | Per-app chrome |
| 09 | Multitasking | ✅ Partial | Card previews |
| 10 | Permission Dialog | ✅ Complete | Per-app grants |
| 11 | App Launcher | ✅ Complete | Store catalog |

---

## 01. Boot Screen

### Purpose
First visual contact with GULFOS. Establishes brand identity, masks initialization time, and transitions the user into the boot sequence.

### Phase 1 Implementation
- `SplashScreen.tsx` — logo reveal, brand text
- `BootAnimation.tsx` — progress bar, kernel boot messages
- `useOSBoot.ts` — orchestrates splash → booting → locked

### Components
| Component | Location | Role |
|-----------|----------|------|
| `GulfLogo` | `assets/GulfLogo.tsx` | SVG brand mark |
| `SplashScreen` | `components/os/SplashScreen.tsx` | Initial fade-in |
| `BootAnimation` | `components/os/BootAnimation.tsx` | Progress animation |

### Animations
| Animation | Duration | Easing | Trigger |
|-----------|----------|--------|---------|
| Logo scale-in | 800ms | `[0.16, 1, 0.3, 1]` | Splash mount |
| Brand text fade | 500ms | ease-out | +300ms delay |
| Progress fill | 450ms/step | linear | Boot steps |
| Splash exit | 500ms | ease-in | Phase → booting |
| Boot exit | 500ms | ease-in | Progress 100% |

### Interactions
- None (passive sequence)
- Skippable on repeat boot if `isBooted` persisted in `osStore`

### Gestures
- None

### Future APIs
| Endpoint | Purpose |
|----------|---------|
| `GET /api/system/boot-config` | Custom boot logo, skip duration |
| `Socket: system:boot-complete` | Server-side init sync |

### Phase 2 Enhancements
- [ ] Custom boot sound via `soundStore`
- [ ] Haptic pulse on boot complete
- [ ] Dynamic Island shows boot progress (compact mode)
- [ ] Admin-configurable boot branding

---

## 02. Lock Screen

### Purpose
Secure gate before OS access. Displays time, notifications, and provides multiple unlock methods.

### Wallpaper
- Full-bleed `Wallpaper` component behind lock content
- Blur overlay: `backdrop-blur-2xl` at 40% opacity on notification cards
- Brightness dimmed 20% via CSS filter on lock phase
- Parallax on swipe-up gesture (Phase 2): wallpaper shifts 8px

### Clock
- Large 72px extralight tabular-nums display
- Updates every 1 second via `setInterval`
- Format: 12h/24h based on `settingsStore.language` locale
- Phase 2: Flip-clock animation on minute change

### Date
- Full weekday + month + day below clock
- Locale-aware via `formatDate()`
- Phase 2: Secondary timezone row for travel widget

### Notifications
- Up to 3 preview cards from `notificationStore`
- Glassmorphism cards: `bg-white/10 backdrop-blur-xl`
- Tap card → expands inline (Phase 2)
- Swipe left on card → dismiss (Phase 2)

### PIN
- `LockScreenPIN.tsx` — 4-digit entry pad
- Dot indicators fill on entry
- Max 5 attempts before 30s lockout (Phase 2)
- Stored in `lockStore` (local); synced to API via `POST /api/auth/pin`

### Fingerprint
- `LockScreenBiometric.tsx` type=`fingerprint`
- Circular progress ring animates 0→100% over ~1.6s
- Haptic `success` on completion
- Phase 2: WebAuthn integration for real biometrics

### Face Unlock
- `LockScreenBiometric.tsx` type=`face`
- Same progress simulation
- Phase 2: Camera permission + face mesh overlay

### Emergency Button
- **Phase 2 new** — bottom-left corner
- Opens emergency overlay: SOS, Medical ID, Emergency contacts
- Requires no unlock; limited API access
- Links to EMS app and Police emergency line

### Camera Shortcut
- **Phase 2 new** — bottom-right corner
- Opens Camera app in capture mode without full unlock
- Uses `permissionStore` for camera grant
- Returns to lock screen after capture

### Flashlight Shortcut
- **Phase 2 new** — long-press power area or bottom icon
- Toggles `settingsStore.flashlightEnabled`
- Dynamic Island shows torch active state
- Screen edge glow effect when active

### Animations
| Animation | Duration | Easing |
|-----------|----------|--------|
| Lock screen enter | 500ms | `[0.32, 0.72, 0, 1]` |
| Unlock exit (swipe) | 500ms | slide up full screen |
| PIN pad appear | 300ms | spring |
| Biometric ring | 80ms/step | linear |
| Notification card stagger | 100ms each | fade up |

### Gestures
| Gesture | Action |
|---------|--------|
| Swipe up | Unlock (if no method selected) |
| Swipe down | None on lock (reserved for notification center post-unlock) |
| Tap PIN/Face/Touch icons | Select unlock method |
| Long press flashlight icon | Toggle torch |

### Future APIs
| Endpoint | Purpose |
|----------|---------|
| `POST /api/auth/pin/verify` | Server PIN validation |
| `GET /api/auth/emergency-contacts` | Emergency overlay data |
| `WebAuthn` | Real biometric auth |

---

## 03. Home Screen

### Purpose
Primary workspace. App grid, widgets, dock, and wallpaper create the personalized mobile desktop.

### Dock
- `Dock.tsx` — 4 persistent apps in glassmorphism bar
- Position: fixed bottom, 24px margin
- Apps: Phone, Messages, Browser, Settings (Phase 2: configurable)
- Icon bounce on tap via `appIconBounce`
- Phase 2: Dock editor in Settings → drag apps in/out

### Status Bar
- `StatusBar.tsx` — time, WiFi, signal, battery, notification badge
- Sits above Dynamic Island cutout
- Phase 2: Carrier name from SIM app, battery percentage toggle

### Search
- Long-press home screen → opens `Search.tsx`
- Phase 2: Pull-down from center top (spotlight gesture)
- Searches apps, contacts, messages, files

### Widgets
- `WidgetRenderer.tsx` — clock + weather defaults
- Sizes: small (1×1), medium (2×1), large (2×2)
- Registered via `widgetStore.definitions`
- Phase 2: Per-app widget SDK, drag to reposition

### Folders
- **Phase 2 new**
- Long-press app icon → jiggle mode → drag onto another app
- Creates `AppFolder` in `appStore.folders`
- Folder opens as overlay grid with name editable
- Max 9 apps per folder

### Pages
- Horizontal swipe between pages via `useGestures`
- Page dots indicator at bottom
- `appStore.pages` tracks page index
- Phase 2: Infinite scroll with page add/remove

### App Grid
- 4 columns × 6 rows per page
- `AppIcon` component with label
- System apps + installed apps from `appStore`
- Phase 2: Drag-and-drop reorder, persist via `PUT /api/apps/layout`

### Wallpaper
- `Wallpaper.tsx` — gradient, animated, or image
- Animated: `wallpaper-gulf` CSS keyframe
- Controlled by `settingsStore.wallpaper`
- Phase 2: User-uploaded wallpapers via Files app

### Blur Effects
- Dock: `backdrop-blur-2xl`
- Widgets: `GlassPanel` intensity low/medium
- Folder overlay: `backdrop-blur-3xl` full screen
- Phase 2: Adjustable blur intensity in Settings

### Gestures
| Gesture | Action |
|---------|--------|
| Swipe left/right | Change home page |
| Swipe down (from top) | Control Center |
| Swipe down (from top-right) | Notification Center (Phase 2) |
| Long press | Enter jiggle/edit mode |
| Long press (empty area) | Search |
| Pinch | None (reserved for accessibility zoom) |

### Animations
| Animation | Duration | Easing |
|-----------|----------|--------|
| Home enter (post-unlock) | 400ms | scale 0.95→1 |
| App icon stagger | 50ms stagger | spring |
| Dock slide up | spring | delay 200ms |
| Page transition | 300ms | ease-out |
| Jiggle mode | 200ms loop | rotate ±1° |

### Future APIs
| Endpoint | Purpose |
|----------|---------|
| `PUT /api/apps/layout` | Persist grid layout |
| `GET /api/widgets/definitions` | Widget catalog |
| `POST /api/widgets/instances` | Save widget placement |

---

## 04. Notification Center

### Purpose
Aggregated view of all system and app notifications with management actions.

### Grouping
- **Phase 2** — group by `groupId` field on `OSNotification`
- Collapsed group shows app icon + count badge
- Expand group → individual notifications
- System groups: Today, Yesterday, Earlier

### Priority
| Level | Visual Treatment |
|-------|-----------------|
| `critical` | Red left border, persistent until dismissed |
| `high` | Gold accent dot |
| `normal` | Standard glass card |
| `low` | Reduced opacity 60% |

### Realtime
- `realtimeService.on('notification:new')` → `notificationStore.addNotification`
- Dynamic Island compact preview on new notification
- Haptic `medium` + sound `notification` on arrival

### Delete
- Swipe left → reveal delete button (Phase 2)
- `DELETE /api/notifications/:id`
- Clear all button in header

### Expand
- Tap notification → expand to show actions and full body
- Action buttons from `notification.actions[]`
- Deep link into originating app

### Collapse
- Tap outside or swipe down to close center
- `notificationStore.setCenterOpen(false)`

### Animation
| Animation | Duration | Easing |
|-----------|----------|--------|
| Panel slide up | spring 300/35 | from bottom |
| Card enter | stagger 50ms | slide from right |
| Swipe dismiss | 200ms | slide left + fade |
| Group expand | 250ms | height auto |

### Phase 1 Implementation
- `NotificationCenter.tsx` — list, mark read, dismiss
- Triggered via gesture (Phase 2: swipe from top-left)

### Future APIs
| Endpoint | Purpose |
|----------|---------|
| `GET /api/notifications?grouped=true` | Grouped fetch |
| `PATCH /api/notifications/read-all` | Bulk read |
| `Socket: notification:new` | Realtime push |

---

## 05. Control Center

### Purpose
Quick-access system toggles and sliders without entering Settings.

### WiFi
- Toggle via `settingsStore.wifiEnabled`
- Phase 2: Network picker sub-panel with available networks

### Bluetooth
- Toggle via `settingsStore.bluetoothEnabled`
- Phase 2: Device pairing list

### Volume
- `Slider` component 0–100
- `settingsStore.volume` + `soundStore.volume`

### Brightness
- `Slider` component 0–100
- `settingsStore.brightness` → CSS filter on wallpaper

### Torch (Flashlight)
- `ControlTile` toggle
- `settingsStore.flashlightEnabled`
- Screen white flash overlay when active (Phase 2)

### Dark Mode
- Theme toggle: cycles dark ↔ light
- Updates `themeStore` + `settingsStore.theme`

### Silent Mode
- `settingsStore.silentMode`
- Status bar shows 🔇 icon

### Rotation Lock
- `settingsStore.rotationLock`
- Locks viewport orientation via CSS (Phase 2: Screen Orientation API)

### GulfDrop (AirDrop-inspired, Original)
- **Phase 2 new** — original GULFOS sharing protocol
- Proximity-based device discovery via WebRTC data channels
- Share: photos, contacts, identity card, files
- UI: radar animation with nearby device avatars
- Fallback: generate share link via API

### Animations
| Animation | Duration | Easing |
|-----------|----------|--------|
| Panel slide down | spring 300/35 | from top |
| Tile press | 150ms | scale 0.95 |
| Tile active glow | 200ms | gold border fade-in |
| Slider thumb | spring 500/15 | on drag |
| GulfDrop radar | 3s loop | rotate + pulse |

### Gestures
| Gesture | Action |
|---------|--------|
| Swipe down from top-right | Open Control Center |
| Tap outside | Close |
| Long press tile | Open expanded control (Phase 2) |

### Future APIs
| Endpoint | Purpose |
|----------|---------|
| `POST /api/share/gulfdrop` | Generate share session |
| `Socket: gulfdrop:discover` | Nearby device broadcast |
| `WebRTC` | P2P file transfer |

---

## 06. Dynamic Island (Original)

### Purpose
GULFOS signature status capsule. Displays live system activity without leaving the current screen.

> **Original design** — not Apple Dynamic Island. GULFOS pill shape with gold accent ring.

### Modes (Phase 1)
| Mode | Size | Use |
|------|------|-----|
| `idle` | 12×12 dot | Hidden state |
| `compact` | 126×37 | Single line status |
| `expanded` | 360×120 | Rich content |
| `activity` | 200×37 | Progress bar |

### Live Activities (Phase 2)
| Activity | Compact | Expanded |
|----------|---------|----------|
| Incoming call | 📞 Caller name | Accept / Decline buttons |
| Active call | ⏱ Duration | Mute, speaker, end |
| Music playing | 🎵 Track | Album art, controls |
| Download | ⬇ File name | Progress %, cancel |
| Charging | ⚡ Battery % | Time to full |
| Navigation | 🧭 ETA | Turn direction |
| Timer | ⏲ Countdown | Pause, cancel |

### Calls
- Integrates with Phone app
- Compact: caller name scrolling
- Expanded: avatar, accept (green), decline (red)
- Tap → opens Phone app call screen

### Music
- Integrates with Music app
- Compact: track title marquee
- Expanded: album art, play/pause, skip
- Progress bar in activity mode

### Downloads
- Integrates with Downloads app
- Activity mode: progress bar via `setProgress()`
- Multiple downloads → stacked compact pills

### Charging
- Triggered when battery < 100% and plugged in
- Gold lightning bolt animation
- Auto-hides after 3s in compact

### Notifications
- Brief compact flash on new notification
- Auto-collapses after 4s
- Tap → expand to notification preview

### Animations
| Animation | Duration | Easing |
|-----------|----------|--------|
| Mode transition | spring 400/30 | width + height morph |
| Content crossfade | 200ms | opacity |
| Progress bar | linear | width % |
| Gold ring pulse | 2s loop | opacity 0.4→1 |
| Marquee text | 8s loop | translateX |

### Gestures
| Gesture | Action |
|---------|--------|
| Tap (compact) | Expand |
| Tap (expanded) | Collapse |
| Long press | Open related app |
| Swipe up | Dismiss activity |

### Future APIs
| Endpoint | Purpose |
|----------|---------|
| `Socket: island:activity` | Push live activity updates |
| `POST /api/island/activity` | Register activity from app SDK |

---

## 07. Search (Spotlight)

### Purpose
System-wide search across apps, contacts, messages, files, and settings.

### Phase 1
- App search by name and bundleId
- Recent searches history
- Opens matching app on tap

### Phase 2
- Unified index across all apps
- Category filters: Apps, Contacts, Messages, Files, Web
- Keyboard shortcut support (desktop)
- Siri-like natural language (future)

---

## 08. App Window

### Purpose
Container for running applications with standard chrome.

### Chrome
- Top bar: Back (minimize), Title, Close
- Bottom home indicator bar
- z-index managed by `windowManagerStore`

### Phase 2
- Split-screen (two apps side by side)
- Picture-in-picture for video apps
- Resizable windows on tablet viewport

---

## 09. Multitasking

### Purpose
Overview of open applications for quick switching.

### Phase 1
- `MultitaskingView.tsx` — card grid of open windows
- Tap card → focus window
- Close all button

### Phase 2
- Live app previews (screenshot cache)
- Swipe up on card → close app
- Memory usage indicator per app

---

## 10. Permission Dialog

### Purpose
System modal requesting app permission grants.

### Phase 1
- `PermissionDialog.tsx` — allow/deny per permission type
- `permissionStore` tracks grants per appId

### Phase 2
- "Ask every time" option
- Permission audit log in Settings → Privacy
- Revoke from Settings per app

---

## Screen Relationship Diagram

```
┌─────────────┐
│ Boot Screen │
└──────┬──────┘
       ▼
┌─────────────┐     ┌──────────────────┐
│ Lock Screen │────▶│ Emergency Overlay │
└──────┬──────┘     └──────────────────┘
       ▼ unlock
┌─────────────┐
│ Home Screen │◄──────────────────────────┐
└──────┬──────┘                           │
       │                                   │
  ┌────┴────┬──────────┬──────────┐       │
  ▼         ▼          ▼          ▼       │
┌────┐  ┌───────┐  ┌───────┐  ┌───────┐  │
│App │  │Notif. │  │Control│  │Search │  │
│Win │  │Center │  │Center │  │       │  │
└────┘  └───────┘  └───────┘  └───────┘  │
       │                                  │
       └──────── Dynamic Island ──────────┘
```

---

## Implementation Priority (Phase 2 OS Enhancements)

1. Lock Screen shortcuts (Emergency, Camera, Flashlight)
2. Home Screen folders + drag-and-drop
3. Notification grouping + swipe dismiss
4. GulfDrop sharing panel
5. Dynamic Island live activities (Calls, Music, Downloads)
6. Multitasking live previews
