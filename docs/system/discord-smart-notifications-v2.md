# Discord Smart Notification Center (V2)

Provider-based Discord delivery for GULFOS Phone notifications. Registers through the existing **notification provider registry** — no broker changes required.

## Architecture

```
notificationBrokerService.deliverNotification()
  → dispatchToNotificationProviders()
    → socket provider (in-app)
    → event_bus provider (internal)
    → discord provider (V2) ← new
        → evaluateDiscordDelivery() — 7 delivery rules
        → sanitizeForDiscord() — privacy
        → smart grouping OR immediate outbox
        → Discord bot polls outbox → sends embed DM
```

## Delivery Rules

See [Discord Notification Delivery Rules V1](./discord-delivery-rules-v1.md) — notifications only while actively playing; never queued for offline players.

Discord notification is sent only when **all** conditions pass:

1. Discord account linked (`DiscordLink`)
2. Phone exists and `verifyPhoneAccess()` succeeds
3. Linked character is **currently active**
4. Discord notifications enabled (global + per character)
5. Category enabled in user preferences
6. Not blocked by quiet hours (critical bypasses)
7. Discord DMs available (`dmChannelId` set)

Otherwise the notification stays in GULFOS only (socket/event_bus still deliver).

## Character Isolation

Each character has separate `DiscordNotificationPreferences`. Notifications include `externalCharacterId` and are only delivered when that character is the active session.

## Notification Categories

42 configurable categories across 7 groups:

| Group | Examples |
|-------|----------|
| Communication | Incoming/missed calls, SMS, mail, emergency |
| Banking | Transfers, card transactions, suspicious activity |
| Identity | License updates, expiring documents |
| Government | Police, EMS, court, company |
| Marketplace | Vehicle sales, auctions |
| Security | Login, password, phone removed, Discord link |
| Device | Battery, backup, Find My, cloud sync |
| Applications | Calendar, notes, alarms, updates |

## Smart Embeds

Premium Discord embed design includes:

- App icon + name (author)
- Title + rich description
- Character name field
- Phone number (optional)
- Priority badge (Critical/High/Normal/Low)
- Color theme by priority
- Thumbnail + optional image
- Footer + ISO timestamp
- Interactive buttons (category-specific)

### Priority Colors

| Priority | Color |
|----------|-------|
| Critical | Red `#ED4245` |
| High | Orange `#FAA61A` |
| Normal | Blue `#5865F2` |
| Low | Gray `#99AAB5` |

## Smart Grouping

Non-critical notifications within a 60-second window are batched into one summary embed:

```
8 New Notifications
• 3 SMS Messages
• 2 Bank Updates
• 1 Missed Call
• 2 App Notifications
```

Critical notifications bypass grouping and deliver immediately.

## Quiet Hours

Per-character configuration:

- Start / end time
- Critical only mode
- Mute all

Critical alerts always bypass quiet hours.

## Privacy

`sanitizeForDiscord()` redacts before outbox:

- Full balances, IBANs, SSN/national IDs
- Passwords, OTPs, verification codes
- Sensitive payload keys stripped

## API

### Bot (service token)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/internal/discord/link` | Link Discord account + DM channel |
| `POST` | `/api/internal/discord/unlink` | Unlink Discord |
| `GET` | `/api/internal/discord/notifications/pending` | Poll outbox for delivery |
| `POST` | `/api/internal/discord/notifications/:outboxId/ack` | Acknowledge delivery |

### User (JWT)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/discord/preferences?characterId=` | Get category + quiet hour prefs |
| `PATCH` | `/api/discord/preferences?characterId=` | Update preferences |

## Broker Integration

```typescript
await enqueueNotification({
  userId,
  appId: 'com.gulfos.bank',
  title: 'Transfer Received',
  body: 'You received a secure transfer.',
  priority: 'high',
  category: 'money_received',
  externalCharacterId: activeCharacterId,
  phoneId,
});
```

## Environment

```env
DISCORD_NOTIFICATIONS_ENABLED=true
```

## File Map

```
apps/api/src/constants/discordNotifications.ts
apps/api/src/database/models/Discord*.ts
apps/api/src/services/discord/
  discordNotificationProvider.ts
  discordDeliveryService.ts
  discordEmbedService.ts
  discordGroupingService.ts
  discordPrivacyService.ts
  discordQuietHoursService.ts
  discordPreferenceService.ts
apps/api/src/api/routes/discord.ts
apps/api/src/api/routes/discordInternal.ts
```

## Future Providers

Email, Telegram, and push providers register the same way:

```typescript
registerNotificationProvider(myProvider);
```

No changes to `notificationBrokerService` required.
