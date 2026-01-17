# Copilot / AI Agent Instructions — Protocol Blackout

Purpose: give an AI coding agent the exact, actionable knowledge to be productive quickly in this repo.

High-level architecture
- Two main apps: `protocol-client/` (React + Vite UI) and `protocol-server/` (Colyseus-based realtime server). Shared domain models live in `shared/` used by both sides.
- The client composes application state from many small hooks in `protocol-client/src/hooks/` (notably `useGameState`, `useBattleEngine`, `useCampaignManager`, `useMultiplayer`). UI is in `protocol-client/src/components/` grouped by `layout`, `views`, and `ui`.
- Server rooms and authoritative state are in `protocol-server/src/rooms/` (see `CombatRoom.ts`). Communication uses Colyseus messages; client uses `colyseus.js` in `useMultiplayer`.

Key data flows & conventions
- Game state is assembled in `useGameState()` (client). It merges local `useBattleEngine()` state with `useMultiplayer()` when `isMultiplayerMode` is set. Look for the `activeState` object in `useGameState.ts` for how values are chosen.
- Resolution replay: `useBattleEngine` stores a pre-resolution snapshot in `prevPlayers` and the post-resolution in `players`. UIs use `prevPlayers` for the replay (`ResolutionView.tsx`). If you change resolution flow, preserve that snapshot behavior.
- Phase-driven rendering: `src/App.tsx` switches on `Phase` enum (see `shared/types.ts`). Adding a view usually means adding a `case` to `renderActiveView()`.
- Hooks pattern: prefer small, single-responsibility hooks that return state + actions. `useCampaignManager` handles campaign level creation and map generation (`generateMap()`), and calls into the battle engine.

Important files to inspect for common tasks
- App/router: `protocol-client/src/App.tsx` — maps `Phase` -> view and is the best place to add global phase handling.
- State composition: `protocol-client/src/hooks/useGameState.ts` — central merge of settings, progression, battle and multiplayer.
- Local battle logic: `protocol-client/src/hooks/useBattleEngine.ts` — players, submissions, executeResolution(), prevPlayers snapshot, phase transitions.
- Multiplayer: `protocol-client/src/hooks/useMultiplayer.ts` and `protocol-server/src/rooms/CombatRoom.ts` — network message handlers and authoritative state updates.
- Campaign levels: `shared/campaignRegistry.ts` and client `useCampaignManager.ts` — level definitions, rewards, and the `startCampaignLevel` flow.
- UI: `protocol-client/src/components/views/*` — `SelectionView.tsx`, `TurnEntryView.tsx`, `ResolutionView.tsx` demonstrate typical view patterns and rely on props from `useGameState`.

Developer workflows (how to run & debug)
- Install + run client:
```bash
cd protocol-client
npm install
npm run dev    # starts Vite dev server
```
- Install + run server (Colyseus):
```bash
cd protocol-server
npm install
npm run dev    # ts-node-dev serving src/index.ts
```
- Use two terminals (or a multiplexer) to run both concurrently. The client talks to the Colyseus server for multiplayer flows.

Project-specific conventions & patterns
- Phases drive navigation and the UI. The `Phase` enum (in `shared/types.ts`) is authoritative — change it there if adding new high-level states.
- `players` vs `prevPlayers` vs `targetPlayers`: `prevPlayers` is the pre-resolution snapshot; `targetPlayers` is used by the multiplayer hook to represent the state at the end of resolution. Keep naming consistent when modifying resolution logic.
- `playSfx` / `AudioService` is a singleton (`protocol-client/src/services/audioService.ts`) used widely for feedback — avoid breaking its usage pattern.
- `UNITS` registry lives in `shared/operativeRegistry.ts`; add new unit definitions there and the UI will pick them up. Many views expect a `unit` object with `hp`, `maxHp`, `range`, `speed`, and `special` fields.

Integration points and cross-component communication
- Client -> Server: `useMultiplayer` sends actions/messages (e.g. `room.send('selectUnit', { type })`). Modify both client and server handlers together.
- Server authoritative logic: `protocol-server/src/rooms/CombatRoom.ts` initializes maps and enforces game rules; for rule changes, update both server and client expectations in `shared/` types and in `useBattleEngine`.
- Map generation: `generateMap()` is used by campaign manager (`useCampaignManager.ts`). If you change map schema, update `shared/constants.ts` and `ResolutionView`/`TacticalGrid` renderers.

Small gotchas discovered in code
- `startCampaignLevel` may be called with either an ID or a level object from the UI (`NodeSelectorView.tsx`) — follow that pattern or make changes in both places.
- Views expect certain player properties (e.g., `loadout`, `unit`) to be non-null; initialization code in `useCampaignManager` and `finalizePlayers` should set sensible defaults.
- When changing resolution visuals, ensure `resolutionLogs` structure (see `resolveCombat` in `protocol-client/src/logic/combat`) remains compatible with `ResolutionView` SVG rendering.

How to make a small change safely (example)
- Add a new phase and view:
  1. Add enum value in `shared/types.ts`.
  2. Create view in `protocol-client/src/components/views/` following existing patterns.
  3. Add a `case` in `protocol-client/src/App.tsx` `renderActiveView()` to render the view.
  4. Update any server-side transitions that should trigger the phase.

If you need more context
- Search for `useGameState`, `useBattleEngine`, `useMultiplayer`, `startCampaignLevel`, and `CombatRoom` to see the main integration surfaces.
- Ask for desired change scope (client-only vs server & protocol change). I can produce diffs that update both sides consistently.

End — please review and tell me which areas you want expanded or if you want an inline checklist for setting up a specific dev flow (e.g., headless multiplayer test harness).
