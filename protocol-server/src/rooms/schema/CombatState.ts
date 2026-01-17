
import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";
import { TileType, UnitType, AIArchetype, AIDifficulty } from "../../shared/types";

export class PositionSchema extends Schema {
    @type("number") x: number = 0;
    @type("number") y: number = 0;
}

export class StatusEffectSchema extends Schema {
    @type("string") type: string = "";
    @type("number") duration: number = 0;
    @type("number") value: number = 0;
}

export class UnitSchema extends Schema {
    @type("string") type: string = UnitType.PYRUS;
    @type("string") name: string = "";
    @type("number") hp: number = 1000;
    @type("number") maxHp: number = 1000;
    @type("number") speed: number = 1.0;
    @type("number") range: number = 2;
    @type("number") atkStat: number = 1.0;
    @type("number") defStat: number = 1.0;
    @type("string") image: string = "";
}

export class ItemSchema extends Schema {
    @type("string") id: string = "";
    @type("string") slot: string = "PRIMARY";
    @type("string") name: string = "";
}

export class LoadoutSchema extends Schema {
    @type(ItemSchema) primary: ItemSchema = new ItemSchema();
    @type(ItemSchema) secondary: ItemSchema = new ItemSchema();
    @type(ItemSchema) shield: ItemSchema = new ItemSchema();
}

export class PlayerSchema extends Schema {
    @type("string") id: string = "";
    @type("string") sessionId: string = "";
    @type("string") name: string = "Operative";
    @type("boolean") connected: boolean = true;
    @type("boolean") isAI: boolean = false;
    @type("boolean") isEliminated: boolean = false;
    @type("boolean") hasSubmitted: boolean = false;
    @type("boolean") isReady: boolean = false;

    // Stats
    @type("number") hp: number = 1000;
    @type("number") maxHp: number = 1000;
    @type("number") ap: number = 25;
    
    // Position
    @type(PositionSchema) position = new PositionSchema();

    // Combat State
    @type("number") moveFatigue: number = 0;
    @type("number") blockFatigue: number = 0;
    @type("number") totalReservedAp: number = 0;
    @type("number") cooldown: number = 0;
    @type("boolean") activeUsed: boolean = false;
    @type("boolean") desperationUsed: boolean = false;
    @type("boolean") isAbilityActive: boolean = false;
    @type("number") captureTurns: number = 0;
    
    // Item State
    @type("number") itemUsesCurrent: number = 0;

    // Complex Objects
    @type(UnitSchema) unit = new UnitSchema();
    @type([StatusEffectSchema]) statuses = new ArraySchema<StatusEffectSchema>();
    @type(LoadoutSchema) loadout = new LoadoutSchema();
}

export class TileRowSchema extends Schema {
    @type(["number"]) columns = new ArraySchema<number>();
}

export class GridMapSchema extends Schema {
    @type("string") id: string = "";
    @type([TileRowSchema]) tiles = new ArraySchema<TileRowSchema>();
}

export class CombatState extends Schema {
    @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
    @type(GridMapSchema) map = new GridMapSchema();
    @type("number") round: number = 1;
    @type("number") maxRounds: number = 15;
    @type("string") phase: string = "LOBBY"; 
    @type("number") turnTimer: number = 30; 
}
