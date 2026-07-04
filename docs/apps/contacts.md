# Contacts — Central Contact Management

> Phase 3 — App 05 (Complete)  
> Bundle ID: `com.bananaos.contacts`

## Overview

Contacts is the central contact management application for BananaOS. Every Phone, SMS, Messenger, Police, and Justice application depends on Contacts for contact lookup, favorites, and emergency contacts.

## Features

| Feature | Status |
|---------|--------|
| Personal, Business & Emergency Contacts | ✅ |
| Multiple Phone Numbers per Contact | ✅ |
| Favorites & Recent Contacts | ✅ |
| Groups & Organizations | ✅ |
| Blocked Contacts | ✅ |
| Search & Advanced Search | ✅ |
| Tags & Custom Labels | ✅ |
| Import / Export (JSON) | ✅ |
| Identity Sync | ✅ |
| Full RBAC Permission System | ✅ |
| Complete Audit Logging | ✅ |
| Admin Panel | ✅ |
| Realtime Socket Updates | ✅ |
| Shared contactsApi for dependent apps | ✅ |

## Architecture

```
apps/web/src/apps/contacts/
├── index.tsx
├── manifest.ts
├── types.ts
├── store/contactsStore.ts
├── services/contactsService.ts
├── hooks/useContactsRealtime.ts
├── components/
│   ├── ContactsTabBar.tsx
│   ├── ContactAvatar.tsx
│   └── ContactCard.tsx
└── screens/
    ├── HomeScreen.tsx
    ├── ListScreen.tsx
    ├── FavoritesScreen.tsx
    ├── GroupsScreen.tsx
    ├── EmergencyScreen.tsx
    ├── BlockedScreen.tsx
    ├── ImportExportScreen.tsx
    └── AdminScreen.tsx

apps/api/src/
├── database/models/
│   ├── Contact.ts
│   ├── ContactGroup.ts
│   ├── FavoriteContact.ts
│   ├── BlockedContact.ts
│   ├── Organization.ts
│   ├── ContactAuditLog.ts
│   └── ContactPermission.ts
├── services/contactsService.ts
├── api/controllers/
│   ├── contactsController.ts
│   └── contactsAdminController.ts
└── api/routes/contacts.ts

apps/web/src/services/contactsApi.ts  # Shared API for Phone, SMS, etc.
```

## Database Schema

| Model | Purpose |
|-------|---------|
| `Contact` | Contact profiles with multiple phone numbers |
| `ContactGroup` | Named groups of contacts |
| `FavoriteContact` | Favorite contact references |
| `BlockedContact` | Blocked contact references |
| `Organization` | Business organizations |
| `ContactAuditLog` | Full audit trail |
| `ContactPermission` | RBAC permissions |

### Contact Fields

- Avatar, full name, username
- Multiple phone numbers (mobile, home, work, other) with primary flag
- Identity number, email, organization, department, role
- Address, birthday, notes, tags, custom labels, relationship label
- Favorite, blocked, emergency flags
- Group memberships, last contacted timestamp

## RBAC Permissions

| Permission | Description | Default User | Admin |
|------------|-------------|:---:|:---:|
| `view_contacts` | View contact list and details | ✅ | ✅ |
| `edit_contacts` | Create and update contacts | ✅ | ✅ |
| `delete_contacts` | Delete contacts | ✅ | ✅ |
| `export_contacts` | Export contact data | ✅ | ✅ |
| `import_contacts` | Import contacts | ✅ | ✅ |
| `block_contacts` | Block/unblock contacts | ✅ | ✅ |
| `manage_groups` | Create and manage groups | ❌ | ✅ |
| `manage_organizations` | Manage organizations | ❌ | ✅ |
| `view_audit_logs` | View audit logs | ❌ | ✅ |

## Audit Log

Every action creates an audit entry with:

- User ID
- Timestamp
- Device ID
- IP address
- Action name
- Entity type and ID
- Old/new values
- Permission used
- Reason (when applicable)

## API Endpoints

### User Routes (`/api/contacts`)

| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/dashboard` | view_contacts |
| GET | `/` | view_contacts |
| POST | `/` | edit_contacts |
| GET | `/search?q=` | view_contacts |
| GET | `/:id` | view_contacts |
| PUT | `/:id` | edit_contacts |
| DELETE | `/:id` | delete_contacts |
| POST | `/:id/favorite` | edit_contacts |
| POST | `/:id/block` | block_contacts |
| POST | `/:id/unblock` | block_contacts |
| GET | `/favorites` | view_contacts |
| GET | `/recent` | view_contacts |
| GET | `/emergency` | view_contacts |
| POST | `/import` | import_contacts |
| GET | `/export/all` | export_contacts |
| GET | `/groups/list` | view_contacts |
| POST | `/groups` | manage_groups |
| POST | `/sync/identity` | edit_contacts |
| GET | `/lookup/phone/:phone` | view_contacts |

### Admin Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/stats` | System statistics |
| GET | `/admin/audit` | Full audit log |
| POST | `/admin/permissions/grant` | Grant permissions |
| POST | `/admin/permissions/init` | Init admin permissions |

## Integration

### Identity
- `POST /api/contacts/sync/identity` creates a self-contact from verified Identity
- Contacts can store `identityNumber` linked to BananaOS Identity

### Banana SIM
- Identity sync pulls phone number from SIM profile
- Phone lookup validates numbers against contact database

### Dependent Apps (via `contactsApi.ts`)
- **Phone** — favorites, lookup, recent
- **SMS** — contact search, lookup by phone
- **Messenger** — contact profiles
- **Police / Justice** — emergency contacts, lookup

```typescript
import { contactsApi } from '@/services/contactsApi';

const favorites = await contactsApi.getFavorites('com.bananaos.phone');
const contact = await contactsApi.lookupByPhone('+1-BNA-555-1234', 'com.bananaos.messages');
```

## Socket Events

| Event | Trigger |
|-------|---------|
| `contacts:created` | New contact |
| `contacts:updated` | Contact modified |
| `contacts:deleted` | Contact removed |
| `contacts:imported` | Bulk import |
| `contacts:exported` | Export completed |
| `contacts:favorite:changed` | Favorite toggled |
| `contacts:blocked` | Contact blocked |
| `contacts:unblocked` | Contact unblocked |
| `contacts:group:created` | New group |
| `contacts:notification` | App notification |

## Flows

### Create Contact
1. User submits contact with at least one phone number
2. Permission `edit_contacts` checked
3. Contact saved with auto-generated fullName
4. Audit log created
5. Socket event emitted

### Import Contacts
1. User submits JSON array
2. Permission `import_contacts` checked
3. Each contact validated and created
4. Audit log with import count
5. Notification sent

## Tests

```bash
npx vitest run src/apps/contacts/__tests__/contacts.test.ts
```

## Roadmap

- vCard (.vcf) import/export
- Contact photo upload via camera
- Merge duplicate contacts
- Shared contact groups across devices
- Deep integration with Phone dialer UI
