# BananaOS — App Roadmap

> Phase 2 Design Document  
> Detailed specification for every application.  
> **Implementation rule:** One app at a time, fully complete before starting the next.

---

## Implementation Priority

| Order | App | Bundle ID | Rationale |
|-------|-----|-----------|-----------|
| 1 | Identity | `com.bananaos.identity` | Core digital ID — other apps depend on it |
| 2 | Profile | `com.bananaos.profile` | User account management |
| 3 | Contacts | `com.bananaos.contacts` | Required by Phone & Messages |
| 4 | SIM Card | `com.bananaos.simcard` | Telephony foundation |
| 5 | Phone | `com.bananaos.phone` | Core communication |
| 6 | Messages | `com.bananaos.messages` | Core communication |
| 7 | Settings | `com.bananaos.settings` | Enhance Phase 1 version |
| 8 | Files | `com.bananaos.files` | System utility |
| 9 | Gallery | `com.bananaos.gallery` | Media access |
| 10 | Camera | `com.bananaos.camera` | Media capture |
| 11 | Downloads | `com.bananaos.downloads` | System utility |
| 12 | Clock | `com.bananaos.clock` | Standalone + widget |
| 13 | Weather | `com.bananaos.weather` | Widget + standalone |
| 14 | Calculator | `com.bananaos.calculator` | Utility |
| 15 | Calendar | `com.bananaos.calendar` | Productivity |
| 16 | Browser | `com.bananaos.browser` | Web access |
| 17 | Music | `com.bananaos.music` | Media |
| 18 | Bank | `com.bananaos.bank` | Finance |
| 19 | Store | `com.bananaos.store` | App distribution |
| 20 | Community | `com.bananaos.community` | Social |
| 21 | Announcements | `com.bananaos.announcements` | System broadcasts |
| 22 | Police | `com.bananaos.police` | Government |
| 23 | EMS | `com.bananaos.ems` | Emergency services |

---

## App 01 — Identity

### Purpose
Premium digital identity card for BananaOS users. Serves as official identification within the ecosystem with verification, sharing, and document export.

### Features
| Feature | Description |
|---------|-------------|
| Photo | User profile photo with crop/upload |
| Full Name | Legal display name |
| Username | Unique `@handle` |
| National ID | System-generated unique ID (`BN-YYYY-NNNNNN`) |
| Membership | Tier: Standard, Silver, Gold, Platinum |
| QR Code | Scannable identity verification code |
| Barcode | CODE128 barcode of National ID |
| Verification Badge | Gold checkmark when admin-verified |
| Issue Date | Card issuance timestamp |
| Expiry Date | Card expiration (default 5 years) |
| Signature | Digital signature image |
| Country | Issuing country |
| Copy Button | Copy National ID to clipboard |
| Download PDF | Export identity card as PDF |
| Share | Share via BananaDrop, link, or messaging |
| Print | Browser print dialog with card layout |
| Verification API | `GET /api/identity/verify/:id` for third parties |
| Admin Verification | Admin panel to approve/revoke verification |

### Database (MongoDB)

```typescript
// Collection: identities
{
  userId: ObjectId,
  fullName: string,
  username: string,          // unique
  nationalId: string,        // unique, auto-generated
  photo: string,             // URL or base64
  membership: 'standard' | 'silver' | 'gold' | 'platinum',
  country: string,
  signature: string,         // base64 image
  issueDate: Date,
  expiryDate: Date,
  verified: boolean,
  verifiedAt: Date,
  verifiedBy: ObjectId,      // admin userId
  qrPayload: string,         // encoded verification data
  createdAt: Date,
  updatedAt: Date
}
```

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/identity` | User | Get own identity |
| PUT | `/api/identity` | User | Update profile fields |
| POST | `/api/identity/photo` | User | Upload photo |
| GET | `/api/identity/qr` | User | Generate QR code data |
| GET | `/api/identity/pdf` | User | Download PDF |
| GET | `/api/identity/verify/:nationalId` | Public | Verify identity (limited fields) |
| POST | `/api/identity/verify/:id/approve` | Admin | Approve verification |
| POST | `/api/identity/verify/:id/revoke` | Admin | Revoke verification |
| POST | `/api/identity/share` | User | Generate share link |

### Permissions
- `storage` — photo upload
- `camera` — take profile photo
- `network` — verification API calls

### Animations
| Element | Animation |
|---------|-----------|
| Card reveal | Scale 0.9→1 + fade, spring |
| QR expand | Tap → full screen with zoom |
| Verification badge | Gold pulse on verify |
| Copy feedback | Toast slide up "Copied" |
| PDF download | Progress bar in Dynamic Island |
| Share sheet | Slide up from bottom |

### UI Screens
1. **Identity Card** — main card view (mock in Components.md §4.4)
2. **Edit Profile** — form for name, username, country
3. **Photo Capture** — camera or gallery picker
4. **QR Full Screen** — large QR with scan instructions
5. **Share Sheet** — BananaDrop, copy, PDF, print options
6. **Verification Status** — pending/verified/revoked states

### Future Upgrades
- NFC tap-to-share identity
- Blockchain-verified credentials
- Multi-document support (passport, driver's license)
- Biometric lock on identity view
- Integration with Police and Bank for instant verification
- Expiry renewal workflow
- Identity history / audit log

---

## App 02 — SIM Card

### Purpose
Manage cellular connectivity, phone number, carrier information, and telephony settings.

### Features
| Feature | Description |
|---------|-------------|
| Phone Number | Assigned BananaOS number |
| Carrier | Virtual carrier name and logo |
| Signal | Signal strength indicator (simulated) |
| Voicemail | Voicemail inbox with playback |
| Call History | Recent calls synced with Phone app |
| Manage SIM | SIM settings and preferences |
| Change Number | Request new phone number |
| Activation | Activate new SIM card |
| Deactivate | Deactivate current SIM |

### Database

```typescript
// Collection: simcards
{
  userId: ObjectId,
  phoneNumber: string,       // unique, E.164 format
  carrier: string,
  carrierLogo: string,
  status: 'active' | 'inactive' | 'suspended',
  signalStrength: number,  // 0-4
  voicemailEnabled: boolean,
  voicemailGreeting: string,
  dataPlan: string,
  activatedAt: Date,
  deactivatedAt: Date,
  createdAt: Date
}

// Collection: voicemails
{
  simId: ObjectId,
  from: string,
  duration: number,
  audioUrl: string,
  transcript: string,
  read: boolean,
  createdAt: Date
}
```

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sim` | Get SIM info |
| POST | `/api/sim/activate` | Activate SIM |
| POST | `/api/sim/deactivate` | Deactivate SIM |
| POST | `/api/sim/change-number` | Request new number |
| GET | `/api/sim/voicemail` | List voicemails |
| DELETE | `/api/sim/voicemail/:id` | Delete voicemail |
| GET | `/api/sim/signal` | Current signal strength |

### Permissions
- `network` — carrier connectivity
- `microphone` — voicemail greeting recording

### Animations
| Element | Animation |
|---------|-----------|
| Signal bars | Stagger fill on load |
| Activation | Progress ring + success checkmark |
| Number change | Old number fade out, new fade in |
| Voicemail play | Waveform animation |

### UI Screens
1. **SIM Dashboard** — number, carrier, signal, status
2. **Voicemail List** — inbox with playback
3. **Call History** — recent calls table
4. **Manage SIM** — settings toggles
5. **Change Number** — number picker with search
6. **Activation Wizard** — step-by-step setup

### Future Upgrades
- eSIM support
- Dual SIM management
- Data usage tracking
- International roaming settings
- Carrier plan upgrade

---

## App 03 — Phone

### Purpose
Full telephony application with dial pad, call management, favorites, and voicemail access.

### Features
| Feature | Description |
|---------|-------------|
| Dial Pad | Standard 0-9, *, # keypad |
| Recent Calls | Call log with type (in/out/missed) |
| Favorites | Speed dial contacts |
| Contacts | Integrated contact search |
| Voicemail | Visual voicemail inbox |
| Incoming Call Screen | Full-screen caller ID |
| Outgoing Call Screen | Calling animation |
| Call Animation | Pulsing avatar during call |
| Speaker | Toggle speakerphone |
| Mute | Toggle microphone mute |
| Hold | Hold/resume call |
| Conference | Multi-party call (Phase 2+) |

### Database

```typescript
// Collection: calls
{
  userId: ObjectId,
  contactId: ObjectId,
  phoneNumber: string,
  direction: 'incoming' | 'outgoing' | 'missed',
  status: 'ringing' | 'active' | 'ended' | 'declined' | 'missed',
  duration: number,          // seconds
  startedAt: Date,
  endedAt: Date,
  isFavorite: boolean,
  createdAt: Date
}

// Collection: favorites
{
  userId: ObjectId,
  contactId: ObjectId,
  position: number,
  label: string
}
```

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/phone/calls` | Call history |
| POST | `/api/phone/calls` | Initiate call |
| PATCH | `/api/phone/calls/:id` | Update call (mute, hold, end) |
| GET | `/api/phone/favorites` | Speed dial list |
| POST | `/api/phone/favorites` | Add favorite |
| DELETE | `/api/phone/favorites/:id` | Remove favorite |
| GET | `/api/phone/voicemail` | Voicemail list |

### Socket Events
- `call:incoming` — push incoming call to client
- `call:status` — call state changes
- `call:ended` — call terminated

### Permissions
- `microphone` — voice calls
- `contacts` — contact lookup
- `notifications` — incoming call alerts

### Animations
| Element | Animation |
|---------|-----------|
| Dial pad press | Scale 0.9 + haptic light |
| Outgoing call | Pulsing ring animation |
| Incoming call | Slide up full screen + ring vibration |
| Active call | Duration timer, waveform |
| End call | Red button pulse |
| Call end | Slide down dismiss |

### UI Screens
1. **Favorites** — speed dial grid
2. **Recents** — call log list
3. **Contacts** — searchable contact list
4. **Dial Pad** — keypad (mock in Components.md §4.5)
5. **Voicemail** — visual voicemail
6. **Incoming Call** — full-screen caller ID with accept/decline
7. **Active Call** — in-call controls (mute, speaker, hold, end)

### Future Upgrades
- Video calls
- Call recording
- Spam call detection
- Call transcription
- WiFi calling
- Integration with Dynamic Island live activities

---

## App 04 — Messages (SMS)

### Purpose
Full-featured messaging with conversations, attachments, voice messages, and realtime delivery.

### Features
| Feature | Description |
|---------|-------------|
| Conversations | Threaded message list |
| Attachments | Photos, videos, documents |
| Voice Messages | Record and playback |
| Photos/Videos | Inline media preview |
| Read Status | Delivered/read receipts |
| Typing Indicator | Realtime typing via Socket.io |
| Realtime | Instant message delivery |
| Search | Full-text message search |
| Delete | Delete messages/conversations |
| Archive | Archive conversations |

### Database

```typescript
// Collection: conversations
{
  participants: [ObjectId],
  type: 'direct' | 'group',
  name: string,              // group name
  lastMessage: ObjectId,
  lastMessageAt: Date,
  archived: boolean,
  createdAt: Date
}

// Collection: messages
{
  conversationId: ObjectId,
  senderId: ObjectId,
  body: string,
  type: 'text' | 'image' | 'video' | 'voice' | 'file',
  attachment: { url, mimeType, size, duration },
  status: 'sending' | 'sent' | 'delivered' | 'read',
  readAt: Date,
  createdAt: Date
}
```

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/conversations` | List conversations |
| POST | `/api/messages/conversations` | Create conversation |
| GET | `/api/messages/conversations/:id` | Get messages |
| POST | `/api/messages/conversations/:id` | Send message |
| PATCH | `/api/messages/:id/read` | Mark as read |
| DELETE | `/api/messages/:id` | Delete message |
| POST | `/api/messages/conversations/:id/archive` | Archive |
| GET | `/api/messages/search?q=` | Search messages |

### Socket Events
- `message:new` — new message in conversation
- `message:delivered` — delivery confirmation
- `message:read` — read receipt
- `typing:start` / `typing:stop` — typing indicator

### Permissions
- `contacts` — recipient lookup
- `photos` — image attachments
- `camera` — photo capture
- `microphone` — voice messages
- `notifications` — new message alerts
- `storage` — file attachments

### Animations
| Element | Animation |
|---------|-----------|
| Conversation list | Stagger fade in |
| New message bubble | Slide up + fade in |
| Send button | Scale pulse on tap |
| Typing indicator | Three dots bounce |
| Voice message | Waveform playback |
| Image attachment | Thumbnail → full screen zoom |
| Swipe to delete | Slide left reveal red |

### UI Screens
1. **Conversation List** — (mock in Components.md §4.6)
2. **Chat View** — bubbles, input bar, attachments
3. **New Message** — contact picker + compose
4. **Media Viewer** — full-screen image/video
5. **Voice Recorder** — hold-to-record overlay
6. **Search Results** — message search results

### Future Upgrades
- End-to-end encryption
- Group messaging with admin roles
- Message reactions
- Disappearing messages
- Link previews
- GIF/sticker support
- Message scheduling

---

## App 05 — Contacts

### Purpose
Central contact management for Phone, Messages, and other apps.

### Features
- Contact list with search and alphabetical index
- Add/edit/delete contacts
- Contact detail with call, message, email actions
- Contact groups
- Import/export (vCard)
- Favorites integration with Phone app
- Contact photo

### Database
```typescript
// Collection: contacts
{
  userId: ObjectId,
  firstName: string,
  lastName: string,
  phone: string,
  email: string,
  photo: string,
  company: string,
  notes: string,
  groups: [string],
  isFavorite: boolean,
  createdAt: Date
}
```

### API
`GET/POST/PUT/DELETE /api/contacts`, `GET /api/contacts/search?q=`

### Permissions: `contacts`, `storage`

### Future Upgrades
- Sync with cloud providers
- Duplicate detection
- Birthday reminders
- Emergency contacts flag

---

## App 06 — Bank

### Purpose
Digital banking with accounts, transfers, bills, and QR payments.

### Features
| Feature | Description |
|---------|-------------|
| Accounts | Multiple account types (checking, savings) |
| Cards | Virtual debit/credit cards |
| IBAN | International bank account number display |
| Transactions | Full transaction history with filters |
| Transfer | Send money to contacts or IBAN |
| Bills | Bill payment and scheduling |
| Notifications | Transaction alerts |
| Savings | Savings goals and tracking |
| Loans | Loan overview and payments |
| Statements | Monthly PDF statements |
| QR Payments | Scan QR to pay or receive |

### Database

```typescript
// Collection: bank_accounts
{
  userId: ObjectId,
  type: 'checking' | 'savings' | 'loan',
  name: string,
  iban: string,
  balance: number,
  currency: string,
  cardNumber: string,       // masked
  cardExpiry: string,
  status: 'active' | 'frozen',
  createdAt: Date
}

// Collection: transactions
{
  accountId: ObjectId,
  type: 'credit' | 'debit' | 'transfer',
  amount: number,
  currency: string,
  description: string,
  category: string,
  recipientIban: string,
  status: 'pending' | 'completed' | 'failed',
  createdAt: Date
}

// Collection: bills
{
  userId: ObjectId,
  name: string,
  amount: number,
  dueDate: Date,
  recurring: boolean,
  paid: boolean,
  paidAt: Date
}
```

### API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bank/accounts` | List accounts |
| GET | `/api/bank/accounts/:id` | Account detail |
| GET | `/api/bank/transactions` | Transaction history |
| POST | `/api/bank/transfers` | Initiate transfer |
| GET | `/api/bank/bills` | List bills |
| POST | `/api/bank/bills/:id/pay` | Pay bill |
| GET | `/api/bank/statements/:month` | Download statement |
| POST | `/api/bank/qr/generate` | Generate payment QR |
| POST | `/api/bank/qr/scan` | Process scanned QR |

### Permissions: `network`, `notifications`, `camera` (QR scan)

### Animations
| Element | Animation |
|---------|-----------|
| Balance reveal | Count-up animation |
| Transfer confirm | Checkmark success animation |
| Card flip | 3D flip to show CVV |
| Transaction list | Stagger slide in |
| QR scan | Camera viewfinder pulse |

### UI Screens
1. **Dashboard** — (mock in Components.md §4.7)
2. **Account Detail** — balance, card, recent transactions
3. **Transfer** — recipient, amount, confirm
4. **Bills** — bill list with pay action
5. **QR Pay** — scanner or display QR
6. **Statements** — monthly list with PDF download
7. **Savings Goals** — progress rings

### Future Upgrades
- Budget tracking with categories
- Investment portfolio
- Cryptocurrency wallet
- Multi-currency support
- Biometric confirmation for transfers
- Scheduled/recurring transfers

---

## App 07 — Police

### Purpose
Law enforcement dashboard for officers, dispatch, reports, and public safety.

### Features
| Feature | Description |
|---------|-------------|
| Applications | Submit/view police applications |
| Officers | Officer directory and profiles |
| Units | Unit management and assignment |
| Announcements | Department-wide broadcasts |
| Wanted List | Search wanted persons |
| Reports | File and track incident reports |
| Tickets | Issue traffic/citation tickets |
| Violations | Violation database lookup |
| Dispatch | Real-time dispatch queue |
| Internal Chat | Encrypted officer communication |

### Database

```typescript
// Collection: police_officers
{
  userId: ObjectId,
  badgeNumber: string,
  rank: string,
  unit: string,
  status: 'on_duty' | 'off_duty' | 'break',
  location: { lat, lng },
  createdAt: Date
}

// Collection: dispatches
{
  priority: 1 | 2 | 3,
  type: string,
  location: { address, lat, lng },
  description: string,
  assignedUnit: string,
  assignedOfficers: [ObjectId],
  status: 'pending' | 'assigned' | 'en_route' | 'on_scene' | 'resolved',
  createdAt: Date,
  resolvedAt: Date
}

// Collection: reports
{
  officerId: ObjectId,
  type: string,
  description: string,
  location: string,
  involvedParties: [string],
  evidence: [string],
  status: 'draft' | 'filed' | 'under_review' | 'closed',
  createdAt: Date
}

// Collection: tickets
{
  officerId: ObjectId,
  violatorName: string,
  violationCode: string,
  description: string,
  fine: number,
  location: string,
  status: 'issued' | 'paid' | 'contested',
  createdAt: Date
}

// Collection: wanted
{
  name: string,
  photo: string,
  charges: [string],
  lastSeen: string,
  dangerLevel: 'low' | 'medium' | 'high',
  createdAt: Date
}
```

### API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/police/dashboard` | Officer | Officer dashboard |
| GET | `/api/police/dispatches` | Officer | Active dispatches |
| PATCH | `/api/police/dispatches/:id` | Officer | Update dispatch status |
| POST | `/api/police/reports` | Officer | File report |
| GET | `/api/police/reports` | Officer | List reports |
| POST | `/api/police/tickets` | Officer | Issue ticket |
| GET | `/api/police/wanted` | Officer | Wanted list |
| GET | `/api/police/officers` | Officer | Officer directory |
| POST | `/api/police/chat` | Officer | Send internal message |

### Permissions: `location`, `network`, `notifications`, `camera`

### Animations
| Element | Animation |
|---------|-----------|
| Dispatch alert | Red pulse + priority badge |
| Status change | Color transition on badge |
| Map pin | Drop animation on location |
| Report submit | Success checkmark |
| Chat message | Standard bubble animation |

### UI Screens
1. **Dashboard** — (mock in Components.md §4.8)
2. **Dispatch Detail** — map, info, status actions
3. **New Report** — form with evidence upload
4. **Wanted List** — photo grid with search
5. **Ticket Issue** — violation form
6. **Internal Chat** — officer messaging
7. **Unit View** — unit members and status

### Future Upgrades
- Live GPS tracking for units
- Body camera integration
- Court date scheduling
- Evidence chain of custody
- Public safety alerts to citizens
- Integration with EMS dispatch

---

## App 08 — EMS

### Purpose
Emergency medical services dispatch, patient reports, and ambulance tracking.

### Features
- Emergency call intake
- Ambulance dispatch and tracking
- Patient report forms
- Hospital routing
- Medical ID access (from Identity app)
- Real-time status updates
- Integration with Police dispatch

### Database
`ems_dispatches`, `ems_patients`, `ems_ambulances`, `ems_reports`

### API
`/api/ems/dispatches`, `/api/ems/patients`, `/api/ems/ambulances`

### Permissions: `location`, `network`, `notifications`

### Future Upgrades
- ECG/vitals transmission
- Hospital bed availability
- Medical history integration

---

## App 09 — Community

### Purpose
Social platform for BananaOS users — posts, groups, events.

### Features
- Feed with posts, images, videos
- User profiles and following
- Groups and channels
- Events and RSVP
- Direct messaging (links to Messages)
- Reactions and comments
- Moderation tools

### Database
`community_posts`, `community_groups`, `community_events`, `community_comments`

### API
`/api/community/feed`, `/api/community/posts`, `/api/community/groups`

### Permissions: `photos`, `camera`, `notifications`, `network`

### Future Upgrades
- Live streaming
- Marketplace integration
- Verified badges

---

## App 10 — Announcements

### Purpose
System-wide and targeted announcements from administrators.

### Features
- Announcement feed
- Priority levels (info, warning, critical)
- Targeted by role/region
- Read/unread tracking
- Rich media content
- Push via notification framework

### Database
`announcements` with `targetRoles`, `targetRegions`, `priority`, `content`

### API
`GET /api/announcements`, `POST /api/announcements` (admin), `PATCH /api/announcements/:id/read`

### Future Upgrades
- Scheduled announcements
- A/B testing
- Analytics dashboard

---

## App 11 — Store

### Purpose
BananaOS application marketplace for discovering and installing apps.

### Features
- App catalog with categories
- Search and filters
- App detail pages with screenshots
- Install/uninstall
- Reviews and ratings
- Developer portal
- Featured apps carousel
- Update management

### Database
Extends existing `apps` collection with `reviews`, `ratings`, `screenshots`, `downloads`

### API
Extends `/api/apps/catalog` with reviews, ratings, search, featured

### Future Upgrades
- In-app purchases
- Subscription management
- Beta testing channel

---

## App 12 — Settings (Enhance)

### Purpose
Enhance Phase 1 Settings with account, privacy, and per-app controls.

### New Features (Phase 2)
- Account management (sign in/out, profile)
- Per-app permission management
- Storage usage breakdown
- Battery usage by app
- Backup and restore
- Language selection (i18n)
- Emergency settings
- Dock customization

### Future Upgrades
- Parental controls
- Focus modes
- Scheduled settings profiles

---

## App 13 — Files

### Purpose
Virtual filesystem browser and manager.

### Features
- Folder/file tree navigation
- Create, rename, delete, move
- File preview (text, images)
- Search files
- Sort by name, date, size
- Storage usage indicator
- Share via BananaDrop

### Database
Extends `FileNode` model from Phase 1

### API
Extends `/api/filesystem` with rename, move, search

### Permissions: `storage`

---

## App 14 — Gallery

### Purpose
Photo and video gallery with albums and editing.

### Features
- Grid view with date sections
- Albums and favorites
- Full-screen viewer with swipe
- Basic editing (crop, rotate, filters)
- Share and delete
- Slideshow mode

### Database
`gallery_items`, `gallery_albums`

### Permissions: `photos`, `storage`

---

## App 15 — Camera

### Purpose
Photo and video capture with modes and filters.

### Features
- Photo capture
- Video recording
- Front/back camera switch
- Flash modes
- Grid overlay
- Timer
- Filters (Phase 2+)
- QR code scanner

### Permissions: `camera`, `microphone`, `storage`

---

## App 16 — Browser

### Purpose
Web browser with tabs, bookmarks, and privacy features.

### Features
- URL bar with search
- Tab management
- Bookmarks and history
- Private browsing mode
- Download manager integration
- Reader mode
- Ad blocking (Phase 2+)

### Permissions: `network`, `storage`

---

## App 17 — Music

### Purpose
Music player with library, playlists, and now playing.

### Features
- Music library
- Playlists
- Now playing with album art
- Shuffle and repeat
- Queue management
- Dynamic Island integration
- Background playback

### Database
`music_tracks`, `music_playlists`, `music_artists`

### Permissions: `storage`, `notifications`

---

## App 18 — Calendar

### Purpose
Calendar with events, reminders, and scheduling.

### Features
- Month/week/day views
- Event creation with reminders
- Recurring events
- Calendar sync
- Invitation management
- Widget integration

### Database
`calendar_events`, `calendar_reminders`

### Permissions: `notifications`

---

## App 19 — Calculator

### Purpose
Standard and scientific calculator.

### Features
- Basic arithmetic
- Scientific mode (toggle)
- Calculation history
- Copy result
- Haptic feedback on press

### No backend required — fully client-side.

---

## App 20 — Clock

### Purpose
World clock, alarms, stopwatch, and timer.

### Features
- World clocks (multiple timezones)
- Alarms with custom sounds
- Stopwatch with laps
- Countdown timer
- Dynamic Island timer integration
- Widget: clock display

### Database
`clock_alarms`, `clock_world_clocks`

### Permissions: `notifications`

---

## App 21 — Weather

### Purpose
Weather forecasts with location-based data.

### Features
- Current conditions
- Hourly forecast (24h)
- Daily forecast (7 days)
- Location management
- Weather alerts
- Widget: current weather

### API
`GET /api/weather?lat=&lng=` (proxy to weather service)

### Permissions: `location`

---

## App 22 — Downloads

### Purpose
Manage file downloads from Browser and other apps.

### Features
- Download queue with progress
- Completed downloads list
- Pause/resume/cancel
- Open with appropriate app
- Storage location management
- Dynamic Island progress

### Database
`downloads` with `url`, `filename`, `progress`, `status`, `size`

### Permissions: `storage`, `network`

---

## App 23 — Profile

### Purpose
User account management, preferences, and activity.

### Features
- Account info (linked to auth)
- Avatar and display name
- Connected devices/sessions
- Activity log
- Privacy settings
- Delete account
- Link to Identity app

### Database
Extends `User` model with profile fields

### API
Extends `/api/auth/profile`, `/api/auth/sessions`

---

## Per-App File Structure Template

```
apps/web/src/apps/<app-name>/
├── index.tsx                 # Root component
├── manifest.ts               # AppManifest
├── navigation.ts             # Screen routes
├── screens/
│   ├── HomeScreen.tsx
│   └── ...
├── components/               # App-specific UI
├── hooks/
│   └── use<App>.ts
├── stores/
│   └── <app>Store.ts
├── services/
│   └── <app>Service.ts
└── types.ts
```

## Per-App Backend Template

```
apps/api/src/
├── database/models/<App>.ts
├── api/controllers/<app>Controller.ts
└── api/routes/<app>.ts
```

---

## Shared Dependencies Between Apps

```
Identity ──▶ Profile, Bank, Police, Community
Contacts ──▶ Phone, Messages, Bank
SIM Card ──▶ Phone, Messages
Phone ──────▶ Messages (call from chat), Contacts
Files ──────▶ Gallery, Downloads, Camera, Browser
Camera ─────▶ Gallery, Messages, Identity (photo)
Store ──────▶ All apps (installation)
Settings ───▶ All apps (permissions, preferences)
```

---

## Next Step

Begin implementation with **App 01: Identity** — the foundation that other apps reference for user verification.

See `Components.md` §4.4 for UI mock and this document for full specification.
