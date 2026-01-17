
import { Player, UnitType, TileType, GridMap, ItemSlot } from '../../src/shared/types';
import { UNITS } from '../../src/shared/operativeRegistry';
import { ITEMS } from '../../src/shared/itemRegistry';

// Helper to map 1D array from schema to 2D grid
export function mapSchemaToMap(schemaMap: any): GridMap {
    if (!schemaMap || !schemaMap.tiles) return { id: 'temp', name: 'Loading...', tiles: [] };
    
    const tiles: TileType[][] = [];
    
    // Assuming schemaMap.tiles is an ArraySchema of TileRowSchema (which has columns)
    schemaMap.tiles.forEach((row: any) => {
        const r: TileType[] = [];
        const columns = row.columns || row; 
        columns.forEach((val: number) => r.push(val));
        tiles.push(r);
    });

    return {
        id: schemaMap.id,
        name: "MULTIPLAYER_GRID",
        tiles: tiles
    };
}

export function mapSchemaToPlayer(schemaPlayer: any,fallbackId: string, currentSessionId: string): Player {
    // Map basic stats
    const unitType = schemaPlayer.unit?.type as UnitType;
    const unitData = UNITS[unitType] || null;
    
    // Hydrate loadout first to check IDs
    const primary = schemaPlayer.loadout?.primary?.id ? ITEMS[schemaPlayer.loadout.primary.id] || null : null;
    const secondary = schemaPlayer.loadout?.secondary?.id ? ITEMS[schemaPlayer.loadout.secondary.id] || null : null;
    const shield = schemaPlayer.loadout?.shield?.id ? ITEMS[schemaPlayer.loadout.shield.id] || null : null;

    const id = schemaPlayer.id || schemaPlayer.sessionId || fallbackId;

    const p: Player = {
        id: id,
        name: schemaPlayer.name || "UNKNOWN_OPERATIVE",
        isAI: schemaPlayer.isAI,
        isEliminated: schemaPlayer.isEliminated,
        isReady: schemaPlayer.isReady, // New: Ready State
        hp: schemaPlayer.hp,
        maxHp: schemaPlayer.maxHp,
        ap: schemaPlayer.ap,
        position: { x: schemaPlayer.position.x, y: schemaPlayer.position.y },
        
        // Complex Objects
        unit: unitData,
        
        // Statuses
        statuses: schemaPlayer.statuses ? schemaPlayer.statuses.map((s: any) => ({
            type: s.type,
            duration: s.duration,
            value: s.value
        })) : [],

        // Combat State
        moveFatigue: schemaPlayer.moveFatigue,
        blockFatigue: schemaPlayer.blockFatigue,
        totalReservedAp: schemaPlayer.totalReservedAp,
        cooldown: schemaPlayer.cooldown,
        activeUsed: schemaPlayer.activeUsed,
        desperationUsed: schemaPlayer.desperationUsed,
        isAbilityActive: schemaPlayer.isAbilityActive,
        captureTurns: schemaPlayer.captureTurns,
        
        // Loadout (Hydrated from Registry)
        loadout: { primary, secondary, shield },
        
        // Uses Hydration: Current from Server, Max from Registry
        itemUses: { 
            current: schemaPlayer.itemUsesCurrent || 0, 
            max: secondary?.maxUses || 0 
        }, 
        
        statModifiers: {},
        // Multiplayer submit state
        hasSubmitted: schemaPlayer.hasSubmitted || false
    };
    if (!id) {
        console.error("[MAPPER] Critical Error: Player schema has no valid ID!", schemaPlayer);
    }

    return p;
}
