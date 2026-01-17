import { useState, useRef, useEffect, useCallback } from 'react';
import * as Colyseus from 'colyseus.js';
import { Player, GridMap, ResolutionLog, Phase, Action, UnitType } from '../shared/types';
import { mapSchemaToPlayer, mapSchemaToMap } from '../utils/clientSchemaMapper';

// --- CONFIGURATION ---
const BASE_URL = import.meta.env.VITE_SERVER_URL || "https://miniature-halibut-5g4gg6g4v9p73pgjv-8080.app.github.dev";
const WS_HOST = import.meta.env.VITE_WS_HOST || "miniature-halibut-5g4gg6g4v9p73pgjv-8080.app.github.dev";
const WS_PORT = import.meta.env.VITE_WS_PORT || "443";
const WS_PROTOCOL = import.meta.env.VITE_WS_PROTOCOL || "wss";

// SINGLETON CLIENT
const globalClient = new Colyseus.Client(BASE_URL);

// --- GLOBAL LOCK ---
// Defines a variable OUTSIDE the hook. This persists even if React
// remounts the component 100 times in Strict Mode.
let isGlobalJoining = false;

export function useMultiplayer() {
    // Connection State
    const [room, setRoom] = useState<Colyseus.Room | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Game State
    const [players, setPlayers] = useState<Player[]>([]);
    const [targetPlayers, setTargetPlayers] = useState<Player[]>([]); 
    const [activeMap, setActiveMap] = useState<GridMap | null>(null);
    const [round, setRound] = useState(1);
    const [phase, setPhase] = useState<Phase>(Phase.GAME_TYPE_SELECTION);
    const [logs, setLogs] = useState<ResolutionLog[]>([]);
    const [turnTimer, setTurnTimer] = useState(30);
    const [sessionId, setSessionId] = useState<string>("");
    const [winnerId, setWinnerId] = useState<string | null>(null);
    const [isResolving, setIsResolving] = useState(false);

    // Refs
    // Tracks if THIS specific component instance is alive
    const isMountedRef = useRef(true);
    
    // Server State Mirror
    const serverStateRef = useRef({
        players: [] as Player[],
        phase: Phase.GAME_TYPE_SELECTION,
        round: 1,
        map: null as GridMap | null
    });

    // --- LIFECYCLE MANAGEMENT ---
    useEffect(() => {
        isMountedRef.current = true;
        
        return () => {
            // COMPONENT DEATH CLEANUP
            isMountedRef.current = false;
            
            if (room) {
                console.log("[NETWORK] Cleanup: Leaving room on unmount.");
                room.leave();
            }
            
            // Safety: If we unmount while connecting, free the global lock
            if (isGlobalJoining) {
                console.warn("[NETWORK] Unmounting during join. Resetting global lock.");
                isGlobalJoining = false;
            }
        };
    }, [room]);

    const setupRoomListeners = useCallback((roomInstance: Colyseus.Room) => {
        setSessionId(roomInstance.sessionId);

        roomInstance.onStateChange((state: any) => {
            // Prevent updates if component is dead
            if (!isMountedRef.current) return;

            const mappedPlayers = Array.from(state.players.entries()).map(([key, value]) =>
                mapSchemaToPlayer(value, roomInstance.sessionId, key)
            );
            
            // 1. Update Players
            setPlayers(mappedPlayers);
            
            // 2. Map Phase & Logic
            const phaseMap: Record<string, Phase> = {
                "LOBBY": Phase.MULTIPLAYER_LOBBY,
                "INPUT": Phase.TURN_ENTRY,
                "RESOLUTION": Phase.RESOLUTION,
                "GAMEOVER": Phase.GAME_OVER
            };
            
            const clientPhase = phaseMap[state.phase] || Phase.GAME_TYPE_SELECTION;

            let currentMap = serverStateRef.current.map;
            if (state.map?.tiles?.length > 0) {
                const mappedMap = mapSchemaToMap(state.map);
                if (!currentMap || currentMap.id !== mappedMap.id) {
                    currentMap = mappedMap;
                    setActiveMap(mappedMap);
                }
            }

            // Sync Reference
            serverStateRef.current = {
                players: mappedPlayers,
                phase: clientPhase,
                round: state.round,
                map: currentMap
            };

            // React Update Policy
            if (!isResolving) {
                setPhase(clientPhase);
                setRound(state.round);
            }
            
            setTurnTimer(state.turnTimer);
        });

        roomInstance.onMessage("resolutionLogs", (serverLogs: any[]) => {
            if (!isMountedRef.current) return;
            
            // Validate serverLogs structure
            if (!Array.isArray(serverLogs)) {
                console.error("[NETWORK] Invalid resolutionLogs format:", serverLogs);
                return;
            }
            
            console.log("[NETWORK] Resolution starting.");
            // Enrich logs with attacker/target names using current server player snapshot
            const playerMap: Record<string, any> = {};
            serverStateRef.current.players.forEach((p: any) => { playerMap[p.id] = p; });
            const enriched = (serverLogs || []).map(l => ({
                ...l,
                attackerName: l.attackerName || playerMap[l.attackerId]?.name,
                targetName: l.targetName || playerMap[l.targetId]?.name
            }));

            setLogs(enriched);
            setIsResolving(true);
            setPhase(Phase.RESOLUTION);
            setTargetPlayers(serverStateRef.current.players);
            // Ensure players are visible on the client during resolution
            setPlayers(serverStateRef.current.players);
        });

        roomInstance.onMessage("gameOver", (data: { winnerId: string }) => {
            if (!isMountedRef.current) return;
            
            // Validate gameOver data structure
            if (!data || typeof data !== 'object') {
                console.error("[NETWORK] Invalid gameOver message format:", data);
                return;
            }
            
            setWinnerId(data.winnerId || null);
            setPhase(Phase.GAME_OVER);
        });

        roomInstance.onMessage("error", (msg) => {
            if (!isMountedRef.current) return;
            
            // Validate error message structure
            const errorMessage = msg?.message || 'Unknown error occurred';
            console.error("[NETWORK] Server error:", errorMessage);
            setError(errorMessage);
            setTimeout(() => {
                if (isMountedRef.current) setError(null);
            }, 5000);
        });

        roomInstance.onLeave((code) => {
            console.warn("[NETWORK] Disconnected:", code);
            // Critical: Release the lock so the user can rejoin if they want
            isGlobalJoining = false; 

            if (isMountedRef.current) {
                setIsConnected(false);
                setRoom(null);
                if (code !== 1000) setPhase(Phase.GAME_TYPE_SELECTION);
            }
        });
    }, [isResolving]);

    const joinMatch = async (options: any) => {
        // 1. HARD GATE: Global Check
        if (isGlobalJoining) {
            console.warn("[NETWORK] Blocked: Connection already in progress.");
            return;
        }
        if (room || isConnected) {
            console.warn("[NETWORK] Blocked: Already connected.");
            return;
        }

        // 2. SET LOCKS
        isGlobalJoining = true; 
        setIsConnecting(true);

        try {
            console.log("[NETWORK] Requesting Seat Reservation...");
            
            const response = await fetch(`${BASE_URL}/matchmake/joinOrCreate/combat_room`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: options.name })
            });

            if (!response.ok) throw new Error("Matchmaking failed");
            
            // CHECKPOINT 1: Are we still mounted?
            if (!isMountedRef.current) throw new Error("Component unmounted during fetch");

            const reservation = await response.json();
            
            // Overrides
            reservation.server = WS_HOST;
            reservation.protocol = WS_PROTOCOL;
            reservation.port = parseInt(WS_PORT);

            console.log("[NETWORK] Consuming Reservation:", reservation.sessionId);
            
            const roomInstance = await globalClient.consumeSeatReservation(reservation);
            
            // CHECKPOINT 2: Are we still mounted?
            if (!isMountedRef.current) {
                roomInstance.leave(); // Kill the connection we just made
                throw new Error("Component unmounted during connection");
            }

            // SUCCESS
            setRoom(roomInstance);
            setIsConnected(true);
            setupRoomListeners(roomInstance);

        } catch (e: any) {
            console.error("[NETWORK] Join failed:", e);
            // ONLY unlock if we failed. If success, onLeave handles the unlock.
            isGlobalJoining = false; 
            
            if (isMountedRef.current) {
                setError(e.message);
            }
        } finally {
            if (isMountedRef.current) {
                setIsConnecting(false);
            }
        }
    };

    const selectUnit = (unitType: UnitType) => {
        if (!room) return;
        room.send("selectUnit", { type: unitType });
    };

    const submitAction = (action: Action) => {
        if (!room) return;
        room.send("submitTurn", action);
    };

    const toggleReady = () => {
        if (!room) return;
        room.send("toggleReady");
    };

    const leaveMatch = () => {
        if (room) {
            console.log("[NETWORK] Manually leaving match");
            room.leave();
            setRoom(null);
        }
        
        // Force unlock and complete state reset
        isGlobalJoining = false;
        setIsConnected(false);
        setIsConnecting(false);
        setIsResolving(false);
        setError(null);
        setPhase(Phase.GAME_TYPE_SELECTION);
        setPlayers([]);
        setTargetPlayers([]);
        setActiveMap(null);
        setRound(1);
        setLogs([]);
        setTurnTimer(30);
        setWinnerId(null);
        setSessionId("");
        
        // Reset server state reference
        serverStateRef.current = {
            players: [],
            phase: Phase.GAME_TYPE_SELECTION,
            round: 1,
            map: null
        };
    };

    const onResolutionComplete = useCallback(() => {
        if (!isMountedRef.current) return;
        console.log("[UI] Animation complete. Catching up to server state.");
        setIsResolving(false);
        setLogs([]);
        
        const s = serverStateRef.current;
        setPlayers(s.players);
        setPhase(s.phase);
        setRound(s.round);
        setTargetPlayers([]); 
    }, []);

    return {
        isConnected, 
        isConnecting, 
        error, 
        room,
        sessionId,
        players, 
        targetPlayers, 
        activeMap, 
        round, 
        phase, 
        logs, 
        turnTimer, 
        winnerId, 
        isResolving,
        joinMatch,
        selectUnit,
        leaveMatch, 
        submitAction, 
        toggleReady, 
        onResolutionComplete
    };
}