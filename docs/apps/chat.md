# GULF Chat (`com.gulfos.chat`)

Official instant messaging platform for GULFOS — private chats, groups, channels, communities, broadcast lists, voice/video calls, and full Communication Core integration.

## Overview

| Property | Value |
|----------|-------|
| Bundle ID | `com.gulfos.chat` |
| API Base | `/api/chat` |
| Communication Core | `/api/communication/*` (underlying engine) |
| Encryption | AES-256-GCM per conversation |
| Storage | ~280 MB |

## Architecture

GULF Chat is the **product layer** atop the GULFOS Communication Core:

```
GULF Chat App (UI + /api/chat)
    ↓
Communication Core (/api/communication)
    ↓
MongoDB (Conversation, Message, Presence, etc.)
    ↓
Socket.io (message:*, typing:*, chat:*)
```

All messages flow through Communication Core — GULF Chat never writes to `Message` directly.

## Features

### Conversations
- Private chats, group chats, channels, communities, broadcast lists
- Archived, pinned, favorites, hidden, locked, priority chats
- Unread filter, message requests, invite links, join requests

### Messages
- Text, images, videos, voice notes, files, PDF, location, contact cards
- Identity cards, bank transfer cards, QR codes, GIF, emoji, stickers, polls
- Replies, forward, edit, delete for me/everyone, scheduled, auto-delete
- Reactions, mentions, quoted replies, delivery status (sent/delivered/read)

### Calls
- Voice, video, conference calls
- Mute, speaker, hold, call transfer
- Call recording (permission-based), call history

### Groups
- Roles: owner, admin, moderator, member, guest
- Invite links, join requests, group permissions

### Privacy
- Last seen, online status, typing indicator, read receipts
- Profile visibility, blocked users, muted/hidden/locked chats, biometric lock

### Integrations
| Service | Integration |
|---------|-------------|
| Communication Core | Messages, encryption, delivery, sync |
| GULF Identity | Identity cards, verified profiles |
| GULF Contacts | Recipient picker |
| GULF Phone | Call routing |
| GULF Browser | `gulfos://chat` deep links |
| GULF Files/Gallery/Camera/Recorder | Media attachments |
| GULF Maps | Location sharing |
| GULF Bank | Bank transfer cards |
| Notification Broker | Smart/priority/mention notifications |
| Device Ecosystem | Trusted devices, biometric lock |

## API Endpoints

### Core
| Method | Path | Description |
|--------|------|-------------|
| POST | `/initialize` | Initialize chat profile + communication |
| GET | `/inbox` | Conversation list with meta filters |
| GET | `/search?q=` | Search messages/chats/users |

### Conversations
| Method | Path | Description |
|--------|------|-------------|
| POST | `/conversations/private` | Start private chat |
| POST | `/conversations/group` | Create group |
| POST | `/conversations/channel` | Create channel |
| POST | `/conversations/community` | Create community |
| POST | `/conversations/broadcast` | Create broadcast list |
| GET | `/conversations/:id` | Conversation detail |
| PATCH | `/conversations/:id/meta` | Archive/favorite/hide/lock |
| POST | `/conversations/:id/pin` | Pin conversation |
| GET/POST | `/conversations/:id/messages` | List/send messages |
| POST | `/conversations/:id/messages/rich` | Send rich media messages |
| POST | `/conversations/:id/typing` | Typing indicator |

### Messages
| Method | Path | Description |
|--------|------|-------------|
| PATCH | `/messages/:id` | Edit message |
| DELETE | `/messages/:id` | Delete message |
| POST | `/messages/:id/forward` | Forward message |
| POST/DELETE | `/messages/:id/reactions` | Add/remove reaction |

### Calls
| Method | Path | Description |
|--------|------|-------------|
| POST | `/calls` | Start voice/video/conference call |
| PATCH | `/calls/:id` | Mute/hold/speaker/join |
| POST | `/calls/:id/end` | End call |
| GET | `/calls/history` | Call history |

### Privacy & Social
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/message-requests` | Message requests |
| GET/PATCH | `/privacy` | Privacy settings |
| GET/POST/DELETE | `/blocked` | Blocked users |
| POST | `/polls` | Create poll |
| POST | `/polls/:id/vote` | Vote on poll |
| GET | `/stickers` | Sticker packs |

## Realtime Events

### Communication Core (inherited)
- `message:new`, `message:delivered`, `message:read`, `message:edited`, `message:deleted`
- `conversation:new`, `typing:update`, `presence:update`, `reaction:update`

### GULF Chat (app-specific)
- `chat:initialized`, `chat:conversation:update`, `chat:message:request`
- `chat:call:ringing`, `chat:call:update`, `chat:call:ended`
- `chat:poll:update`, `chat:notification`, `chat:sync`

## RBAC Roles

| Role | Access |
|------|--------|
| `user` | Standard messaging, voice/video calls |
| `power_user` | + channels, communities, broadcast, conference |
| `moderator` | + group management, call recording |
| `admin` | Full access including audit |

## MongoDB Models (Chat Layer)

- `ChatProfile` — user chat profile and biometric lock
- `ChatConversationMeta` — per-user archive/favorite/hidden/locked/priority
- `ChatMessageRequest` — pending requests from unknown users
- `ChatChannel`, `ChatCommunity`, `ChatBroadcastList` — extended conversation types
- `ChatPoll` — poll messages with votes
- `ChatBlockedUser` — blocked users
- `ChatCall`, `ChatCallParticipant` — call sessions
- `ChatInviteLink`, `ChatJoinRequest` — group access control
- `ChatPrivacySettings` — global privacy preferences
- `ChatTrustedDevice` — device verification
- `ChatSticker` — sticker packs
- `ChatRoleConfig` — RBAC configuration

## Frontend

Located at `apps/web/src/apps/chat/`:
- Inbox with filters (all/unread/favorites/archived)
- Chat thread with message bubbles, reactions, typing
- Voice/video call UI
- Message requests, search, settings
- Glassmorphism design with realtime socket sync

## Testing

```bash
npm run test --workspace=apps/api -- --test-name-pattern=chat
npm run build
```
