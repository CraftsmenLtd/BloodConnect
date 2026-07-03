# U5 Mobile Client — Tech Stack Decisions

| Concern | Decision | Rationale |
|---|---|---|
| Real-time | React Native global `WebSocket` | Built-in; no dep. |
| Offline queue | `@react-native-async-storage/async-storage` (present) | Persistent queue across restarts. |
| REST | existing `useFetchClient` / `useFetchData` hooks | Matches repo pattern. |
| Navigation | react-navigation `routes`/`SCREENS` (present) | Repo standard. |
| `clientMessageId` | tiny local helper (timestamp + random) | Uniqueness for dedup; **no `uuid` dep**. |
| List rendering | `FlatList` (RN) | Virtualized. |
| Tests | jest-expo + `@testing-library/react-native` (present) + fast-check (root) | Hooks/components + PBT for pure reducers. |
| Backend addition | `chatListChannels` REST handler reusing U1 `listChannelsForUser` + `cursor` helpers (U4) | Inbox dependency. |

## New Dependencies
- **None** (mobile or backend). `async-storage` + `@testing-library/react-native` already present;
  `clientMessageId` via a local helper.

## New config
- `WEBSOCKET_URL` in the mobile env/config (WSS endpoint).

## PBT-09 Compliance
- fast-check (root devDependency) used for the offline-queue/ordering reducer properties; the queue
  reducer is pure and testable outside React.
