
import { Item, ItemSlot, DamageType } from './types';

export const ITEMS: Record<string, Item> = {
  'W_VECTOR': {
    id: 'W_VECTOR',
    name: 'Vector SMG',
    description: 'Lightweight Kinetic weapon. Increases mobility.',
    slot: ItemSlot.PRIMARY,
    cost: 50,
    range: 3,
    damageType: DamageType.KINETIC,
    weight: 1 // +1 Speed
  },
  'W_PLASMA': {
    id: 'W_PLASMA',
    name: 'Plasma Rifle',
    description: 'Balanced Energy weapon. Melts shields.',
    slot: ItemSlot.PRIMARY,
    cost: 150,
    range: 5,
    damageType: DamageType.ENERGY,
    weight: 0
  },
  'W_THUMPER': {
    id: 'W_THUMPER',
    name: 'Thumper GL',
    description: 'Heavy Explosive launcher. Destroys cover.',
    slot: ItemSlot.PRIMARY,
    cost: 300,
    range: 4,
    damageType: DamageType.EXPLOSIVE,
    weight: -1 // -1 Speed
  },
  'U_STIM': {
    id: 'U_STIM',
    name: 'Stim Injector',
    description: 'Restores 200 HP immediately.',
    slot: ItemSlot.SECONDARY,
    cost: 50,
    maxUses: 2,
    effectType: 'HEAL',
    effectValue: 200
  },
  'U_EMP': {
    id: 'U_EMP',
    name: 'EMP Grenade',
    description: 'Drains 5 AP from target enemy.',
    slot: ItemSlot.SECONDARY,
    cost: 100,
    maxUses: 1,
    effectType: 'EMP',
    effectValue: 5
  },
  'S_AEGIS': {
    id: 'S_AEGIS',
    name: 'Aegis Standard',
    description: 'Reliable kinetic plating. Standard defense.',
    slot: ItemSlot.SHIELD,
    cost: 50,
    defenseType: 'STANDARD',
    mitigationMod: 1.0
  },
  'S_REFLECT': {
    id: 'S_REFLECT',
    name: 'Mirror Plate',
    description: 'Reflects 10% of blocked damage back.',
    slot: ItemSlot.SHIELD,
    cost: 200,
    defenseType: 'REFLECT',
    mitigationMod: 0.9
  }
};

export const ARMORY_ITEMS: Item[] = Object.values(ITEMS);
