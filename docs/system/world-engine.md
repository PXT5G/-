# BananaOS World Engine

Phase 3.3 infrastructure for GTA world simulation, carrier networking, GPS, and police tracking. This is **not** the Maps application — it is the operating system layer that future apps consume.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Background Scheduler                     │
│                  world-engine-tick (15s)                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    worldEngineService                        │
│  tickWorld() — single source of truth per user               │
│  • Position / district / street / zones                      │
│  • Weather / time / vehicle / interior                       │
│  • Tower handoff → cellTowerService                          │
│  • Network metrics → networkEngineService                    │
│  • GPS navigation → gpsEngineService                         │
│  • Sync DeviceLocation + NetworkState                        │
│  • Emit socket events                                        │
└──────┬──────────────┬──────────────┬────────────────────────┘
       │              │              │
       ▼              ▼              ▼
 mapDatabase    cellTowerService  vpnService
 Service                         policeTrackingService
```

### Design principles

- **Single tick**: One `world-engine-tick` background task replaces separate location and network refresh timers.
- **Socket-first**: All state changes emit realtime events; REST APIs are for queries and commands.
- **No duplication**: Location and network services delegate to the world engine.
- **Production data**: Map and tower databases are seeded from GTA constants — no mocks.

## Database

| Model | Purpose |
|-------|---------|
| `WorldLocation` | Map POIs with street, district, zone, coordinates, bounding area, nearby locations, road connections, postal code |
| `Street` | Named streets with district and coordinate endpoints |
| `District` | Los Santos districts with bounds and terrain |
| `CellTower` | Banana Mobile towers with coverage, signal power, frequency band, health, user load |
| `Carrier` | Per-user carrier state (Banana Mobile generation, connected tower) |
| `WorldState` | Live world snapshot per user |
| `GpsState` | Navigation, saved/favorite/recent places |
| `SignalHistory` | Signal metrics over time |
| `LocationHistory` | Position history |
| `NetworkSession` | Network session records |
| `VPNSession` | VPN connections with virtual IP and penalties |
| `TrackingRequest` | Police tracking requests with audit trail |
| `TrackingResult` | Police tracking results |

All models include `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `deletedAt` via `auditSchemaFields`.

## API

Base path: `/api/world` (JWT required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/state` | Current world state |
| POST | `/tick` | Force world tick |
| POST | `/initialize` | Initialize world for user |
| GET | `/locations/search` | Search map database |
| GET | `/locations/:id` | Location detail with nearby |
| GET | `/towers/nearby` | Towers near position |
| GET | `/towers/:uuid` | Tower detail |
| GET | `/gps` | GPS state + current position |
| POST | `/gps/navigate` | Start navigation |
| POST | `/gps/stop` | Stop navigation |
| POST | `/gps/save` | Save place |
| POST | `/gps/favorite` | Add favorite |
| GET | `/gps/search` | Search places |
| GET | `/gps/history` | Location history |
| GET | `/carrier` | Banana Mobile carrier state |
| GET | `/network` | Full network metrics |
| GET | `/vpn` | VPN state |
| GET | `/vpn/countries` | Available VPN countries |
| POST | `/vpn/connect` | Connect VPN |
| POST | `/vpn/disconnect` | Disconnect VPN |
| GET | `/vpn/history` | VPN session history |
| POST | `/police/track` | Police tracking (RBAC) |
| GET | `/police/history` | Tracking request history |

Legacy system endpoints (`/api/system/location`, `/api/system/network`) remain and delegate to the world engine.

## Realtime Events

| Event | Payload |
|-------|---------|
| `world:update` | World state snapshot |
| `tower:update` | Connected tower + handoff flag |
| `signal:update` | Signal bars, dBm, generation |
| `network:update` | Full network metrics with penalties |
| `gps:update` | Navigation state, ETA, arrival |
| `vpn:update` | VPN connection state |
| `carrier:update` | Banana Mobile generation |
| `tracking:update` | Police tracking result |
| `location:update` | Device location (synced from world) |

## Carrier System

**Banana Mobile** is the default carrier. Generations:

| Generation | Label | Behavior |
|------------|-------|----------|
| `none` | No Service | Outside tower coverage |
| `emergency` | Emergency Only | Weak edge-of-coverage |
| `2g` | 2G | Low bars |
| `3g` | 3G | Moderate signal |
| `4g` | 4G LTE | Good signal |
| `5g` | 5G | Strong signal near tower |

Carrier appears in Status Bar, Control Center, Settings (Carrier, Network, Signal), and is exposed via `useCarrier()` hook.

## GPS Engine

Centralized navigation service:

- Current position (from world engine)
- Start/stop navigation to map locations
- Saved, recent, and favorite places
- Distance remaining, ETA, arrival detection
- Location history
- Heading updates WorldState during navigation

## Network Engine

Realtime calculation of:

- Signal strength (bars + dBm)
- Carrier and connection type
- Latency, ping, bandwidth, packet loss, jitter, congestion
- Penalties: indoor, tunnel (industrial), mountain, water (coastal), weather, movement, VPN, distance, tower health, congestion

## VPN

Centralized VPN service with country selection, virtual IP assignment, AES-256-GCM encryption, latency/bandwidth penalties applied to network calculations, session history, and `vpn:update` socket events. Apps detect VPN via network state and `useVpn()` hook.

## Police Tracking

Secure APIs under `/api/world/police/*`:

- Requires `com.bananaos.police` app with `location` permission, or admin role
- Every request creates audit log entries
- Supports: phone lookup, current/last tower, last location, movement history, signal history, network state, online status

## Frontend Integration

| Layer | Path |
|-------|------|
| API client | `apps/web/src/services/worldService.ts` |
| Zustand store | `apps/web/src/stores/worldStore.ts` |
| Hooks | `apps/web/src/hooks/useWorldServices.ts` |
| Settings | Maps, Carrier, VPN, Signal, Cell Towers, Developer Diagnostics |

Hooks: `useWorld()`, `useGps()`, `useCarrier()`, `useVpn()`, `useTowers()`, `useSignal()`, `useWorldNetwork()`

## Security

- JWT authentication on all endpoints
- RBAC via permission broker for location and police tracking
- Zod validation on all request bodies
- Audit logs for GPS, VPN, and police actions
- Rate limiting via global middleware

## Future Roadmap

- Maps application consuming world engine APIs
- Phone app tower handoff visualization
- Police app live tracking dashboard
- Route polyline generation from road network
- Multiplayer position sharing
- Weather API integration with gameplay effects
- EMS/Bank geofencing via safe/restricted zones
