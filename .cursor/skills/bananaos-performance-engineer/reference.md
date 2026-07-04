# BananaOS Performance Engineer — Reference

## Performance Checklist (per feature/PR)

### Frontend
- [ ] List screens paginated or virtualized when >100 items
- [ ] Search debounced (not query per keystroke)
- [ ] `useQuery` has appropriate `staleTime` / `enabled`
- [ ] Zustand selectors return stable references
- [ ] No inline object/array literals passed to memoized children
- [ ] Heavy screens lazy-loaded if rarely opened (Admin)
- [ ] Images use appropriate size; avatars use initials fallback
- [ ] `refetchInterval` only where sockets don't cover updates
- [ ] Loading states don't block entire OS shell

### Backend
- [ ] All `find()` have `.limit()` or pagination params
- [ ] Dashboard uses `Promise.all` for independent reads
- [ ] No N+1: batch `find({ _id: { $in: ids } })` instead of loop
- [ ] Indexes on `userId`, sort fields, foreign keys
- [ ] Aggregation for sums/counts vs loading all docs
- [ ] `.lean()` on read-only list responses
- [ ] Projection excludes large fields (notes, avatar URLs) in lists

### Database
- [ ] Compound indexes match query filter + sort
- [ ] Unique indexes where needed (no full collection scans)
- [ ] `explain('executionStats')` on new complex queries
- [ ] Transactions only for multi-doc atomic writes (provisioning)
- [ ] TTL index on sessions/expiring data

### Realtime
- [ ] One emit per mutation (not per field change)
- [ ] `emitToUser` not `io.emit` for private data
- [ ] Frontend invalidates query keys — not duplicate socket state
- [ ] No high-frequency socket events (use polling throttle if needed)

### Animations
- [ ] `transform` and `opacity` only (GPU layers)
- [ ] `useReducedMotion()` respected
- [ ] `layoutId` used sparingly (one per tab group)
- [ ] No animating `width`/`height` on large lists

### Build & Startup
- [ ] `npm run build` succeeds
- [ ] No unnecessary imports of entire libraries
- [ ] Shared code in `components/shared/` not duplicated per app

---

## React Optimization Guide

### Data fetching (preferred pattern)

```tsx
// ✅ TanStack Query — server state
const { data, isLoading } = useQuery({
  queryKey: ['contacts', 'list', searchQuery],
  queryFn: () => contactsService.list(),
  staleTime: 30_000,           // don't refetch for 30s
  enabled: isAuthenticated,
});

// ✅ Zustand — UI state only
const activeTab = useContactsStore((s) => s.activeTab);
```

### Zustand selector pitfall (infinite loop)

```tsx
// ❌ BAD — new array every render
const notifications = useStore((s) => s.notifications.slice(0, 3));

// ✅ GOOD
const all = useStore((s) => s.notifications);
const notifications = all.slice(0, 3);
```

### Memoization

```tsx
const filtered = useMemo(
  () => contacts.filter((c) => c.fullName.includes(q)),
  [contacts, q]
);

const handlePress = useCallback((id: string) => {
  setSelectedId(id);
}, []);

export const ContactRow = memo(function ContactRow({ contact }: Props) {
  return <ContactCard contact={contact} />;
});
```

### Virtualized lists (>100 items)

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

const parentRef = useRef<HTMLDivElement>(null);
const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 64,
});
```

### Lazy loading rare screens

```tsx
import { lazy, Suspense } from 'react';

const AdminScreen = lazy(() => import('./screens/AdminScreen'));

<Suspense fallback={<LoadingSpinner />}>
  {activeTab === 'admin' && <AdminScreen />}
</Suspense>
```

### Search debounce

```tsx
const [query, setQuery] = useState('');
const debouncedQuery = useDebounce(query, 300);

useQuery({
  queryKey: ['search', debouncedQuery],
  queryFn: () => service.search(debouncedQuery),
  enabled: debouncedQuery.length >= 2,
});
```

### Image optimization

- External URLs: Next.js `Image` with `width`/`height`
- Avatars: `ContactAvatar` initials pattern (no network for default)
- Avoid large base64 in state

### React Query invalidation (not over-fetch)

```tsx
// ✅ Targeted invalidation
queryClient.invalidateQueries({ queryKey: ['contacts'] });

// ❌ Avoid refetching everything
queryClient.invalidateQueries(); // too broad
```

---

## MongoDB Optimization Guide

### Indexes (define in schema)

```typescript
contactSchema.index({ userId: 1, fullName: 1 });
contactSchema.index({ userId: 1, 'phoneNumbers.number': 1 });
contactSchema.index({ userId: 1, permission: 1 }, { unique: true });
```

### Pagination

```typescript
const limit = Math.min(Number(req.query.limit ?? 50), 200);
const skip = Number(req.query.offset ?? 0);

const items = await Contact.find({ userId, status: 'active' })
  .sort({ fullName: 1 })
  .skip(skip)
  .limit(limit)
  .lean();
```

### Avoid N+1

```typescript
// ❌ N+1
for (const sim of sims) {
  sim.phoneNumber = await PhoneNumber.findById(sim.phoneNumberId);
}

// ✅ Batch
const ids = sims.map((s) => s.phoneNumberId).filter(Boolean);
const numbers = await PhoneNumber.find({ _id: { $in: ids } });
const map = new Map(numbers.map((n) => [n._id.toString(), n]));
```

### Dashboard parallel reads

```typescript
const [total, favorites, recent] = await Promise.all([
  Contact.countDocuments({ userId, status: 'active' }),
  Contact.countDocuments({ userId, isFavorite: true }),
  Contact.find({ userId }).sort({ lastContactedAt: -1 }).limit(5).lean(),
]);
```

### Aggregation (sums/counts)

```typescript
const result = await BankAccount.aggregate([
  { $match: { userId: new Types.ObjectId(userId), status: 'active' } },
  { $group: { _id: null, total: { $sum: '$balance' } } },
]);
```

### Projection (list views)

```typescript
Contact.find({ userId })
  .select('firstName lastName phoneNumbers isFavorite avatar')
  .lean();
```

### Lean queries

Use `.lean()` when you don't need Mongoose document methods (lists, exports, dashboards).

### Regex search

```typescript
// Indexed fields only for prefix search; full regex on large collections is slow
{ fullName: new RegExp(`^${escapeRegex(q)}`, 'i') }  // prefix
// For full search, consider text index:
contactSchema.index({ fullName: 'text', email: 'text' });
```

### Transactions (multi-document)

Use only when atomicity required (SIM provision: profile + number + settings):

```typescript
const session = await mongoose.startSession();
try {
  session.startTransaction();
  // ... multiple creates with { session }
  await session.commitTransaction();
} catch (e) {
  await session.abortTransaction();
  throw e;
} finally {
  session.endSession();
}
```

---

## Socket.io Optimization Guide

### Emit minimally

```typescript
// ✅ One emit per user action
await contact.save();
emitToUser(userId, 'contacts:updated', { contactId: contact._id.toString() });

// ❌ Don't emit on every intermediate step
emitToUser(userId, 'contacts:field:changed', { field: 'firstName' });
```

### Room isolation (already in repo)

```typescript
// socketService.ts
socket.join(`user:${userId}`);
io.to(`user:${userId}`).emit(event, payload);
```

### Frontend: invalidate, don't duplicate

```typescript
realtimeService.on('contacts:updated', () => {
  queryClient.invalidateQueries({ queryKey: ['contacts'] });
});
// Don't copy socket payload into Zustand store
```

### Event batching (high-volume imports)

```typescript
// After bulk import — one emit, not per row
emitToUser(userId, 'contacts:imported', { imported: 50, failed: 2 });
```

### Connection efficiency

- JWT auth on connect (no reconnect without token)
- `pingInterval: 25000` already configured
- Unsubscribe listeners on unmount in `use*Realtime` hooks

---

## Animation Performance

```tsx
import { useReducedMotion } from 'framer-motion';

const reduceMotion = useReducedMotion();

<motion.div
  initial={reduceMotion ? false : { opacity: 0, y: 15 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
/>
```

**GPU-friendly:** `transform`, `opacity`  
**Avoid:** `width`, `height`, `top`, `left`, `box-shadow` animations on lists

**Realtime clock:** `setInterval` 1000ms on lock screen is acceptable; don't use 60fps intervals for data.

---

## Bundle Size

- Apps registered via `registerSystemApps.ts` — all imported at boot today
- Future: dynamic `import()` per app component in `appRouter` when app count grows
- Tree-shake: import specific functions, not entire lodash
- Check build output: `npm run build --workspace=@bananaos/web`

---

## Performance Review Template

```markdown
## Performance Review: [Feature/App]

### Context
- Files changed:
- User-facing hot path: [dashboard / list / search / realtime]

### Measurements
| Metric | Before | After | Target |
|--------|--------|-------|--------|
| API p95 (list) | | | <200ms |
| Query count (dashboard) | | | ≤5 parallel |
| Bundle chunk (app) | | | — |
| Socket events per action | | | 1 |

### Findings

#### 🔴 Regression risk
- ...

#### 🟡 Improvement opportunity
- ...

#### 🟢 Already efficient
- ...

### Recommendations
1. ...
2. ...

### Verdict
[ ] Approve  [ ] Optimize before merge  [ ] Needs measurement
```

---

## Anti-Patterns in BananaOS

| Anti-pattern | Fix |
|--------------|-----|
| `find()` without limit | Add `.limit(100)` + pagination |
| Sequential dashboard awaits | `Promise.all` |
| Store API list in Zustand + React Query | React Query only |
| Socket + poll every 5s for same data | Socket invalidate OR poll, not both |
| `refetchInterval: 1000` | Use socket or 30–60s interval |
| Memo on every component | Memo list items and expensive charts only |
| Premature `useCallback` everywhere | Only when passed to memoized children |
| Full document fetch for list row | `.select()` projection |

---

## Verification Commands

```bash
# Production build (bundle analysis)
npm run build --workspace=@bananaos/web
npm run build --workspace=@bananaos/api

# Tests still pass after optimization
npx vitest run src/apps/<app>/__tests__/

# MongoDB explain (in mongosh)
db.contacts.find({ userId: ObjectId("...") }).explain("executionStats")
```
