# GULFOS Communication Core

Phase 3.4 global communication infrastructure. Every messaging and calling application routes through this engine — no app may send messages directly.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Communication Core                            │
│              communicationService (orchestrator)                 │
│  sendMessage() → encryption → delivery → notifications → socket  │
└──────┬──────────┬──────────┬──────────┬──────────┬───────────┘
       │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼
 conversation  presence   delivery    attachment  encryption
   service     service    service      service     service
       │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼
 typingService readReceipt reactionService mentionService syncService
       │                                              │
       ▼                                              ▼
 notificationDispatcher                    notificationBrokerService
```

### Design principles

- **Single routing layer**: All apps call `/api/communication/*` — never write to Message collection directly
- **Socket-first**: Realtime events for messages, presence, typing, reactions, attachments
- **Notification Broker**: All alerts route through `notificationDispatcher` → `enqueueNotification`
- **E2E-ready encryption**: Per-conversation AES-256-GCM keys with message signatures and integrity validation
- **Offline queue**: `OfflineMessageQueue` with conflict resolution and background sync

## Core Services

| Service | Responsibility |
|---------|----------------|
| `communicationService` | Message send/edit/delete/forward, search, announcements, tick orchestration |
| `conversationService` | Conversations, members, roles, pinning |
| `presenceService` | Online/offline/idle/typing/recording/uploading states |
| `deliveryService` | Delivery state machine with network checks |
| `typingService` | Typing and voice recording indicators |
| `readReceiptService` | Read receipts and unread counts |
| `attachmentService` | Chunked uploads, virus scan hook, encrypted storage |
| `voiceService` | Voice note validation and metadata |
| `videoService` | Video validation and metadata |
| `reactionService` | Emoji reactions |
| `mentionService` | @mention extraction |
| `notificationDispatcher` | Routes to Notification Broker with priority/silent/hidden preview |
| `encryptionService` | Conversation keys, encrypt/decrypt, trusted devices |
| `syncService` | Offline queue, scheduled messages, auto-delete expiry |

## Message Types

`sms`, `private_chat`, `group_chat`, `broadcast`, `announcement`, `system`, `emergency`, `police`, `justice`, `bank`, `verification`, `silent`, `hidden`

## Content Types

`text`, `image`, `video`, `voice_note`, `audio`, `pdf`, `document`, `contact`, `location`, `live_location`, `money_request`, `bank_transfer`, `identity_card`, `qr`, `barcode`, `gif`, `emoji`

## Conversation Types

`private`, `group`, `organization`, `government`, `police`, `justice`, `emergency`, `bank`, `business`, `announcement`

## Database

| Model | Purpose |
|-------|---------|
| `Conversation` | Chat channels with encryption and announcement flags |
| `ConversationMember` | Membership, roles, read cursors, mute/pin |
| `ConversationRole` | Role-based permissions per conversation |
| `Message` | All messages with encryption, scheduling, expiration |
| `MessageAttachment` | File uploads with chunk progress and virus scan |
| `Reaction` | Per-message emoji reactions |
| `Presence` | User presence and DND/invisible state |
| `DeliveryStatus` | Per-recipient delivery tracking |
| `TypingStatus` | Ephemeral typing indicators |
| `ReadReceipt` | Read timestamps |
| `PinnedMessage` | Pinned messages per conversation |
| `Announcement` | Broadcast announcements |
| `ConversationKey` | E2E encryption keys |
| `OfflineMessageQueue` | Offline sync queue |
| `CommunicationAuditLog` | Communication-specific audit trail |

All models include `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `deletedAt`.

## API

Base path: `/api/communication` (JWT required)

### Conversations
- `GET /conversations` — List user conversations
- `POST /conversations` — Create conversation
- `POST /conversations/private` — Get or create private chat
- `GET /conversations/:id` — Conversation detail
- `GET /conversations/:id/members` — Members list
- `POST /conversations/:id/members` — Add member

### Messages
- `POST /messages` — Send message (all apps route here)
- `GET /conversations/:id/messages` — Paginated messages
- `GET /messages/:id` — Message detail with delivery
- `PATCH /messages/:id` — Edit message
- `POST /messages/:id/delete-me` — Delete for me
- `POST /messages/:id/delete-everyone` — Delete for everyone
- `POST /messages/:id/forward` — Forward message
- `POST /conversations/:id/read` — Mark conversation read

### Presence & Typing
- `GET /presence` — Get presence
- `PATCH /presence` — Set presence state
- `POST /conversations/:id/typing/start` — Start typing
- `POST /conversations/:id/typing/stop` — Stop typing

### Attachments
- `POST /attachments/initiate` — Start upload
- `POST /attachments/:id/chunks/:index` — Upload chunk (base64 body)
- `GET /attachments/:id` — Attachment metadata

### Search & Sync
- `GET /search?q=` — Global search (messages, users, groups, files, media)
- `POST /sync/queue` — Queue offline message
- `POST /sync` — Sync offline queue
- `GET /sync/status` — Sync status

## Realtime Events

| Event | Payload |
|-------|---------|
| `message:new` | New message |
| `message:delivered` | Delivery confirmation |
| `message:read` | Read receipt |
| `message:edited` | Edited message |
| `message:deleted` | Deleted message |
| `conversation:new` | New conversation |
| `presence:update` | Presence change |
| `typing:update` | Typing indicator |
| `reaction:update` | Reaction change |
| `attachment:progress` | Upload progress |
| `attachment:ready` | Upload complete |
| `sync:complete` | Offline sync done |

## Permissions

- `contacts` — Required to send messages (via Permission Broker)
- `storage` — Required for attachments
- `notifications` — Delivered via Notification Broker
- `phone`, `microphone` — For future voice/video apps
- `com.gulfos.communication` — Core app seeded with all permissions on system init

## Encryption

- Per-conversation AES-256-GCM keys stored in `ConversationKey`
- Message bodies encrypted with HMAC-SHA256 integrity signatures
- Attachments encrypted with conversation key material
- Trusted device registration for session validation
- Architecture ready for full E2E key exchange

## Integrations

| System | Integration |
|--------|-------------|
| Notification Broker | All message notifications via `notificationDispatcher` |
| Permission Broker | `checkPermission` on send and attachments |
| World Engine | Network state checked before delivery |
| Audit Service | Dual logging to `CommunicationAuditLog` + `AuditLog` |
| Background Manager | `communication-tick` (5s), `communication-sync` (30s) |
| Device Storage | Attachment uploads tracked via storage service |

## Frontend

| Layer | Path |
|-------|------|
| API client | `apps/web/src/services/communicationService.ts` |
| Zustand store | `apps/web/src/stores/communicationStore.ts` |
| Hooks | `apps/web/src/hooks/useCommunicationServices.ts` |

Hooks: `useConversations()`, `useMessages()`, `useCommunicationPresence()`, `useCommunicationSearch()`

Initialized via `useCommunicationInit()` in `OSProvider`.

## Future Roadmap

- Phone app (voice/video calls via `voiceService` / `videoService`)
- SMS app consuming `messageType: 'sms'`
- WhatsApp-style app on `private_chat` / `group_chat`
- Bank transfer messages with GULF Bank integration
- Identity verification messages with Identity app
- Police/Justice secure channels with enhanced RBAC
- Full Signal-protocol E2E key exchange
- Push notification gateway for external devices
