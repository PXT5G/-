# GULFOS — UI Flow

> Phase 2 Design Document  
> Defines user journeys, state transitions, and interaction flows across the OS.

---

## 1. Cold Start Flow

```
Power On (PWA launch)
    │
    ▼
[Splash Screen] ─── 1.5s ───▶ [Boot Animation]
                                    │
                              boot steps (2.7s)
                                    │
                                    ▼
                              [Lock Screen]
                                    │
                          ┌─────────┼─────────┐
                          │         │         │
                     Swipe Up    PIN/Face   Emergency
                          │         │         │
                          ▼         ▼         ▼
                     [Home]    [Home]    [Emergency]
```

### State Machine (`osStore.phase`)

| From | Event | To |
|------|-------|-----|
| `splash` | timer 1.5s | `booting` |
| `booting` | progress 100% | `locked` |
| `locked` | unlock success | `home` |
| `home` | open app | `app` |
| `app` | close/minimize all | `home` |
| `home` | lock (timeout/manual) | `locked` |
| any | reset | `splash` |

---

## 2. Unlock Flow

### 2.1 Swipe to Unlock
```
Lock Screen
    │ finger swipe up > 50px
    ▼
playSound('unlock') + hapticSuccess()
    │
    ▼
lockStore.unlock() + osStore.setPhase('home')
    │
    ▼
Lock Screen exits (slide up) ──▶ Home Screen enters (scale in)
```

### 2.2 PIN Unlock
```
Lock Screen
    │ tap 🔢 icon
    ▼
lockStore.startUnlock('pin')
    │
    ▼
[PIN Pad visible]
    │ enter 4 digits
    ├── correct ──▶ unlock flow
    └── incorrect ──▶ shake animation + hapticError()
                      │ attempts < 5 → retry
                      │ attempts = 5 → 30s lockout (Phase 2)
```

### 2.3 Biometric Unlock
```
Lock Screen
    │ tap 👤 or 👆
    ▼
lockStore.startUnlock('face' | 'fingerprint')
    │
    ▼
[Progress ring 0→100%]
    │ complete
    ▼
unlock flow
```

### 2.4 Phase 2 — Emergency Access
```
Lock Screen
    │ tap Emergency
    ▼
[Emergency Overlay] (no unlock required)
    ├── SOS Call → Phone app (emergency mode)
    ├── Medical ID → Identity app (limited view)
    └── Emergency Contacts → Contacts app (read-only)
```

---

## 3. Home Screen Interaction Flow

### 3.1 App Launch
```
Home Screen
    │ tap app icon
    ▼
playTap() + haptic tap
    │
    ▼
windowManagerStore.openWindow({ appId, title, ... })
    │
    ▼
osStore.setPhase('app')
    │
    ▼
[App Window slides up from bottom]
    │
    ├── App registered → render AppComponent
    └── App not built → render AppPlaceholder
```

### 3.2 App Close
```
App Window
    │ tap ✕ or swipe down from top
    ▼
windowManagerStore.closeWindow(id)
    │
    ▼
if no open windows → osStore.setPhase('home')
```

### 3.3 Page Navigation
```
Home Screen (page 0)
    │ swipe left
    ▼
appStore.setCurrentPage(1)
    │
    ▼
[Page transition animation]
    │
    ▼
Home Screen (page 1)
```

### 3.4 Folder Creation (Phase 2)
```
Home Screen
    │ long press app icon (500ms)
    ▼
[Jiggle Mode activated]
    │ drag app A onto app B
    ▼
appStore.addFolder({ name: 'Folder', appIds: [A, B] })
    │
    ▼
[Folder icon appears on grid]
    │ tap folder
    ▼
[Folder Overlay — grid of contained apps]
    │ tap app inside
    ▼
App Launch flow
```

### 3.5 Widget Interaction (Phase 2)
```
Home Screen
    │ long press empty grid area (Phase 2)
    ▼
[Widget Picker]
    │ select widget + size
    ▼
widgetStore.addInstance({ widgetId, size, pageIndex, position })
    │
    ▼
[Widget appears on grid]
    │ tap widget
    ▼
Opens parent app OR expands inline
```

---

## 4. System Overlay Flows

### 4.1 Control Center
```
Home Screen
    │ swipe down from top-right area
    ▼
controlCenterStore.open()
    │
    ▼
[Control Center slides from top]
    │
    ├── toggle tile → settingsStore.updateSettings()
    ├── adjust slider → settingsStore.updateSettings()
    ├── tap GulfDrop → [GulfDrop Panel] (Phase 2)
    └── tap outside / swipe up → close()
```

### 4.2 Notification Center
```
Home Screen
    │ swipe down from top-left area (Phase 2)
    ▼
notificationStore.setCenterOpen(true)
    │
    ▼
[Notification Center slides from top]
    │
    ├── tap notification → markAsRead() + expand
    ├── swipe left → removeNotification()
    ├── tap "Mark all read" → markAllAsRead()
    └── tap outside → setCenterOpen(false)
```

### 4.3 Search (Spotlight)
```
Home Screen
    │ long press empty area
    ▼
searchStore.open()
    │
    ▼
[Search overlay fades in]
    │ type query
    ▼
[Results filter in realtime]
    │ tap result
    ▼
Execute result.action() → typically open app
    │
    ▼
searchStore.close()
```

### 4.4 Dynamic Island
```
[Any screen]
    │ system event (call, music, notification, download)
    ▼
dynamicIslandStore.show({ mode: 'compact', title, icon })
    │
    ├── auto-hide after timeout (notifications: 4s)
    ├── tap → expand()
    │       └── tap → collapse() or open related app
    └── progress update → setProgress(n)
```

---

## 5. Authentication Flow

### 5.1 First Launch Registration
```
[Settings → Account] (Phase 2)
    │ tap Sign Up
    ▼
[Registration Form]
    │ submit
    ▼
POST /api/auth/register
    │
    ▼
authStore.login(user, tokens)
    │
    ▼
realtimeService.connect(token)
    │
    ▼
[Account active — sync settings from server]
```

### 5.2 Returning User Login
```
[Settings → Account]
    │ tap Sign In
    ▼
POST /api/auth/login
    │
    ▼
authStore.login(user, tokens)
    │
    ▼
GET /api/settings → settingsStore.updateSettings()
GET /api/apps/installed → appStore.setInstalledApps()
GET /api/notifications → notificationStore.setNotifications()
```

### 5.3 Token Refresh
```
API request → 401
    │
    ▼
POST /api/auth/refresh { refreshToken }
    │
    ├── success → update accessToken → retry request
    └── failure → authStore.logout() → session expired notification
```

---

## 6. App Installation Flow

```
[App Launcher / Store]
    │ browse catalog
    ▼
GET /api/apps/catalog
    │
    │ tap Install
    ▼
POST /api/apps/install/:bundleId
    │
    ▼
appStore.addApp(installed)
    │
    ▼
[App icon appears on home grid]
    │
    ▼
Socket: app:installed → other devices sync
```

---

## 7. Permission Request Flow

```
[App needs camera]
    │
    ▼
permissionStore.requestPermission(appId, 'camera')
    │
    ├── already granted → resolve(true)
    └── not granted →
            │
            ▼
        [Permission Dialog appears]
            │
            ├── Allow → grantPermission() → resolve(true)
            └── Deny → resolve(false)
```

---

## 8. Realtime Event Flow

```
Socket connected (on auth)
    │
    ├── notification:new → notificationStore.addNotification()
    │                      → dynamicIslandStore.show()
    │                      → sound + haptic
    │
    ├── app:installed → appStore.addApp()
    ├── app:uninstalled → appStore.removeApp()
    ├── settings:updated → settingsStore.updateSettings()
    ├── session:expired → authStore.logout()
    └── system:broadcast → notificationStore.addNotification()
```

---

## 9. Phase 2 App Flows (Preview)

### 9.1 Phone — Outgoing Call
```
Phone App → Dial Pad → enter number → tap Call
    │
    ▼
POST /api/phone/calls { to, type: 'outgoing' }
    │
    ▼
dynamicIslandStore.show({ title: 'Calling...', icon: '📞' })
    │
    ▼
[Outgoing Call Screen]
    │ recipient answers
    ▼
Socket: call:connected → island expanded with duration timer
    │
    │ tap End
    ▼
POST /api/phone/calls/:id/end
    │
    ▼
dynamicIslandStore.hide()
```

### 9.2 Messages — Send SMS
```
Messages App → select conversation → type message → send
    │
    ▼
POST /api/messages { conversationId, body }
    │
    ▼
Socket: message:sent → update conversation UI
    │
    ▼
Socket: message:delivered → read receipt update
```

### 9.3 Identity — Share QR
```
Identity App → view card → tap Share
    │
    ▼
[Share Sheet]
    ├── GulfDrop → P2P transfer
    ├── Copy Link → clipboard
    ├── Download PDF → GET /api/identity/pdf
    └── Print → window.print()
```

### 9.4 Bank — Transfer
```
Bank App → Transfer → select account → enter amount → confirm
    │
    ▼
POST /api/bank/transfers { from, to, amount }
    │
    ▼
[Confirmation screen with transaction ID]
    │
    ▼
Socket: bank:transaction → notification + island activity
```

---

## 10. Error & Edge Case Flows

| Scenario | Behavior |
|----------|----------|
| API offline | OS shell works locally; apps show offline banner |
| MongoDB down | API returns 503; frontend retries with backoff |
| Token expired | Auto-refresh; logout on failure |
| Permission denied | App shows limited functionality + retry prompt |
| Storage full | File operations fail with user alert |
| Low battery | Dynamic Island shows battery warning < 10% |
| Reduce motion on | All animations use 0.01ms duration |
| Screen lock timeout | 60s inactivity → lockStore.lock() (Phase 2) |

---

## 11. Navigation Entry Points Summary

| Destination | Entry Methods |
|-------------|---------------|
| Home Screen | Unlock, close all apps, home indicator tap |
| Lock Screen | Auto timeout, manual lock in Settings |
| Control Center | Swipe down top-right |
| Notification Center | Swipe down top-left (Phase 2) |
| Search | Long press home, pull down center (Phase 2) |
| App Window | Tap app icon, dock icon, search result |
| Multitasking | Swipe up + hold (Phase 2) |
| Settings | App icon, dock, search |
| Dynamic Island | Automatic on system events; tap to expand |
