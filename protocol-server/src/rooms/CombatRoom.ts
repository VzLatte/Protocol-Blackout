import { Room, Client } from "colyseus";
import { CombatState, PlayerSchema, TileRowSchema } from "./schema/CombatState";
import { 
    TurnData, 
    Action, 
    GameMode, 
    DifficultyLevel, 
    HazardType, 
    UnitType, 
    TileType, 
    GridMap 
} from "../shared/types";
import { resolveCombat } from "../shared/logic/combat";
import { toEnginePlayer, applyEngineUpdates } from "../utils/schemaMapper";
import { generateMap } from "../shared/utils/mapGenerator";
import { UNITS } from "../shared/operativeRegistry";

export class CombatRoom extends Room<CombatState> {
    
    playerSubmissions: Map<string, TurnData> = new Map();
    forfeitTimers: Map<string, any> = new Map(); // Track disconnect countdowns

    onCreate(options: any) {
        console.log("[ROOM] Creating CombatRoom...");
        this.maxClients = 2;
        this.setSeatReservationTime(10);

        try {
            // 1. Initialize State
            this.setState(new CombatState());
            

            // 2. Generate Map Data from Shared Utility
            const mapData = generateMap(1, Date.now());

            if (!mapData || !mapData.tiles) {
                throw new Error("FAILED_TO_GENERATE_MAP_DATA");
            }

            // 3. Sync State Metadata
            this.state.map.id = mapData.id;

            // 4. Populate Schema Tiles
            mapData.tiles.forEach((row: number[]) => {
                const rowSchema = new TileRowSchema();
                row.forEach((tileVal: number) => {
                    rowSchema.columns.push(tileVal);
                });
                this.state.map.tiles.push(rowSchema);
            });

            console.log(`[ROOM] Map Initialized: ${mapData.id}`);
            console.log("Room Created:", this.roomId);
  

            // 5. Message Handler: Turn Submission
            this.onMessage("submitTurn", (client, action: Action) => {
                const validation = this.validateAction(client.sessionId, action);
                if (validation.valid) {
                    this.handleSubmission(client.sessionId, action);
                } else {
                    client.send("error", { message: validation.reason });
                }
            });

            // 6. Message Handler: Ready Toggle
            this.onMessage("toggleReady", (client) => {
                const player = this.state.players.get(client.sessionId);
                if (player) {
                    player.isReady = !player.isReady;
                    console.log(`[READY] Player ${client.sessionId}: ${player.isReady}`);
                    this.checkStartGame();
                }
            });

        } catch (error) {
            console.error(">> CRITICAL_ERROR_IN_ONCREATE:", error);
            this.disconnect();
        }
    }

    validateAction(sessionId: string, action: Action): { valid: boolean; reason?: string } {
        const player = this.state.players.get(sessionId);
        if (!player) return { valid: false, reason: "PLAYER_NOT_FOUND" };

        const totalCost = (action.attackAp || 0) + (action.blockAp || 0) + (action.moveAp || 0);

        if (totalCost > player.ap) {
            return { valid: false, reason: `AP_OVERFLOW: Req ${totalCost}, Has ${player.ap}` };
        }

        if (this.state.phase !== "INPUT") {
            return { valid: false, reason: "INVALID_PHASE" };
        }

        return { valid: true };
    }

    onJoin(client: Client, options: any) {
    // REJECT if the ID already exists in the map
    if (this.state.players.has(client.sessionId)) {
        console.log("Session already exists. Skipping.");
        return;
    }

    const player = new PlayerSchema();
    player.id = client.sessionId;
    player.name = options.name || "OPERATIVE";
    
    // REMOVE THE SUFFIX LOGIC HERE for now. 
    // If a second player joins with the same name, let it happen 
    // so we can see their real Session IDs in the console.

    this.state.players.set(client.sessionId, player);
}

    onLeave(client: Client, consented: boolean) {
        this.state.players.delete(client.sessionId);
  console.log(client.sessionId, "left. Remaining:", this.state.players.size);
        const player = this.state.players.get(client.sessionId);
        if (!player) return;

        player.connected = false;
        player.isReady = false;

        if (consented) {
            console.log(`[LEFT] ${client.sessionId} - Immediate Forfeit`);
            this.handleForfeit(client.sessionId);
        } else {
            console.log(`[DC] ${client.sessionId} - Starting 60s forfeit timer.`);
            const timer = this.clock.setTimeout(() => {
                this.handleForfeit(client.sessionId);
            }, 60000);
            this.forfeitTimers.set(client.sessionId, timer);
        }
    }
    
    handleForfeit(failedId: string) {
        const winner = Array.from(this.state.players.values()).find(p => p.id !== failedId);
        this.state.phase = "GAMEOVER";
        this.broadcast("gameOver", { 
            winnerId: winner?.id || null, 
            reason: "FORFEIT_BY_DISCONNECT" 
        });
    }

    // --- TURN LOGIC ---

    checkStartGame() {
        const players = Array.from(this.state.players.values());
        const allReady = players.every(p => p.isReady && p.connected);
        if (this.clients.length === this.maxClients && allReady) {
            this.startTurn();
        }
    }

    startTurn() {
        this.state.phase = "INPUT";
        // Use 15s per request for faster multiplayer testing and consistent client-side 15s display
        this.state.turnTimer = 15;

        this.clock.clear(); // Safely clear all intervals/timeouts
        this.clock.setInterval(() => {
            this.state.turnTimer--;
            if (this.state.turnTimer <= 0) this.resolveTurn();
        }, 1000);
    }

    handleSubmission(sessionId: string, action: Action) {
        const player = this.state.players.get(sessionId);
        if (!player || player.hasSubmitted) return;

        this.playerSubmissions.set(sessionId, { playerId: sessionId, action });
        player.hasSubmitted = true;

        if (this.playerSubmissions.size === this.clients.length) {
            this.resolveTurn();
        }
    }

    resolveTurn() {
        this.clock.clear();
        this.state.phase = "RESOLUTION";

        const currentPlayers = Array.from(this.state.players.values()).map(toEnginePlayer);
        
        currentPlayers.forEach(p => {
            if (!this.playerSubmissions.has(p.id)) {
                this.playerSubmissions.set(p.id, {
                    playerId: p.id,
                    action: { blockAp: 2, attackAp: 0, moveAp: 0, abilityActive: false } 
                });
            }
        });

        const gridMap: GridMap = {
            id: this.state.map.id,
            name: "SERVER_MAP",
            tiles: this.state.map.tiles.map(r => r.columns.map(tile => (tile ?? 0) as TileType))
        };

        const result = resolveCombat(
            currentPlayers,
            Array.from(this.playerSubmissions.values()),
            this.state.round,
            15,
            GameMode.TACTICAL,
            null,
            new Map(),
            DifficultyLevel.NORMAL,
            HazardType.NONE,
            gridMap
        );

        result.nextPlayers.forEach(engP => {
            const schemaP = this.state.players.get(engP.id);
            if (schemaP) applyEngineUpdates(schemaP, engP);
        });

        this.state.round = result.nextRound;
        this.broadcast("resolutionLogs", result.logs);

        const alive = Array.from(this.state.players.values()).filter(p => !p.isEliminated);
        
        if (alive.length <= 1 || this.state.round > 15) {
            this.state.phase = "GAMEOVER";
            this.broadcast("gameOver", { winnerId: alive[0]?.id || null });
        } else {
            this.clock.setTimeout(() => this.startTurn(), 5000);
        }
    }
}