# Discord Notification Delivery Rules (V1)

Discord notifications are delivered **only while the player is actively playing** on the game server.

## V1 Rule

If any validation fails:

- Do **not** send the Discord notification
- Do **not** queue it for later delivery
- Continue processing inside GULFOS only (socket/event_bus providers)

## Required Conditions (all must pass)

| # | Condition |
|---|-----------|
| 1 | Discord account is linked |
| 2 | Player is connected to the game server |
| 3 | Discord Bot has an active **verified session** |
| 4 | Active character matches the linked phone |
| 5 | Phone belongs to the active character |
| 6 | Phone is present in character inventory (attestation) |
| 7 | `verifyPhoneAccess()` succeeds |
| 8 | Discord notifications enabled for the character |
| 9 | Discord DMs are available |

## Verified Session

`DiscordVerifiedSession` tracks online play state:

- Created on **player join**
- Ended on **player disconnect**
- Heartbeat extends connection (`DISCORD_VERIFIED_SESSION_STALE_MS` = 2 min)
- Stale sessions are treated as offline — no delivery

## Lifecycle Events

### Player Join

`POST /api/internal/discord/session/join`

- Create verified Discord session
- Activate current character session
- Enable Discord notifications + phone access
- Store inventory attestation

### Player Disconnect

`POST /api/internal/discord/session/leave`

- End verified session immediately
- Disable Discord notifications
- Lock phone access
- **Cancel all pending Discord deliveries** (outbox + batches)

### Character Switch

`POST /api/internal/discord/session/character-switch`

- End previous character verified session
- Cancel pending deliveries for previous character
- Create new verified session for new active character only

### Phone Removed from Inventory

`POST /api/internal/discord/inventory/phone-removed`

- Disable phone access immediately
- Stop Discord notifications immediately
- Cancel pending deliveries
- Reject phone actions until phone returns

## Bot Polling

`GET /api/internal/discord/notifications/pending` returns only notifications where:

- Verified session is still active
- Player is still connected
- Character still matches

## Batch Flush Re-validation

When grouped notifications flush (60s window), delivery rules are **re-evaluated**. If the player disconnected during the window, the batch is discarded — not queued.

## File Map

```
apps/api/src/database/models/DiscordVerifiedSession.ts
apps/api/src/services/discord/discordVerifiedSessionService.ts
apps/api/src/services/discord/discordDeliveryCancelService.ts
apps/api/src/services/discord/discordDeliveryService.ts  (V1 rules)
```
