
import { PlayerSchema, PositionSchema, StatusEffectSchema } from "../rooms/schema/CombatState";
import { Player, Position, UnitType, TileType } from "../../../shared/types";
import { UNITS } from "../shared/operativeRegistry";
import { ITEMS } from "../shared/itemRegistry";

// Convert Schema to Engine Player (Read Only for calculation)
export function toEnginePlayer(schema: PlayerSchema): Player {
    const secondaryId = schema.loadout?.secondary?.id;
    // Hydrate Max from Server Registry
    const maxUses = secondaryId && ITEMS[secondaryId] ? ITEMS[secondaryId].maxUses || 0 : 0;
    
    // Hydrate Item Objects for logic (weight, range, etc)
    const primary = schema.loadout?.primary?.id ? ITEMS[schema.loadout.primary.id] || null : null;
    const secondary = schema.loadout?.secondary?.id ? ITEMS[schema.loadout.secondary.id] || null : null;
    const shield = schema.loadout?.shield?.id ? ITEMS[schema.loadout.shield.id] || null : null;

    return {
        id: schema.id,
        name: schema.name,
        isAI: schema.isAI,
        isEliminated: schema.isEliminated,
        hp: schema.hp,
        maxHp: schema.maxHp,
        ap: schema.ap,
        position: { x: schema.position.x, y: schema.position.y },
        unit: UNITS[schema.unit.type as UnitType],
        statuses: schema.statuses.map(s => ({ type: s.type as any, duration: s.duration, value: s.value })),
        moveFatigue: schema.moveFatigue,
        blockFatigue: schema.blockFatigue,
        totalReservedAp: schema.totalReservedAp,
        cooldown: schema.cooldown,
        activeUsed: schema.activeUsed,
        desperationUsed: schema.desperationUsed,
        isAbilityActive: schema.isAbilityActive,
        captureTurns: schema.captureTurns,
        loadout: { primary, secondary, shield },
        itemUses: { current: schema.itemUsesCurrent, max: maxUses },
        // ... map remaining fields
    };
}

// Update Schema from Engine Player (Write Back)
export function applyEngineUpdates(schema: PlayerSchema, enginePlayer: Player) {
    schema.hp = enginePlayer.hp;
    schema.maxHp = enginePlayer.maxHp;
    schema.ap = enginePlayer.ap;
    schema.isEliminated = enginePlayer.isEliminated;
    schema.moveFatigue = enginePlayer.moveFatigue;
    schema.blockFatigue = enginePlayer.blockFatigue;
    schema.cooldown = enginePlayer.cooldown;
    schema.activeUsed = enginePlayer.activeUsed;
    schema.desperationUsed = enginePlayer.desperationUsed;
    schema.captureTurns = enginePlayer.captureTurns;
    
    // Write back item usage
    schema.itemUsesCurrent = enginePlayer.itemUses.current;

    // Position
    schema.position.x = enginePlayer.position.x;
    schema.position.y = enginePlayer.position.y;

    // Statuses - naive replace
    schema.statuses.clear();
    enginePlayer.statuses.forEach(s => {
        const eff = new StatusEffectSchema();
        eff.type = s.type;
        eff.duration = s.duration;
        eff.value = s.value || 0;
        schema.statuses.push(eff);
    });
}
