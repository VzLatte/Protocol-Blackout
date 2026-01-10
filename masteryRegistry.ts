
import { UnitType, MasteryNode } from './types';

// Generic Nodes for other units to avoid empty screens
const GENERIC_NODES: MasteryNode[] = [
    { id: 'g_n1', levelReq: 1, type: 'STAT', name: 'Optimized Plating', description: '+50 Max HP', cost: 1, stats: { maxHp: 50, hp: 50 } },
    { id: 'g_n2', levelReq: 2, type: 'STAT', name: 'Servo Calibration', description: '+0.1 Movement Speed', cost: 1, stats: { speed: 0.1 }, parentId: 'g_n1' },
    { id: 'g_n3', levelReq: 3, type: 'STAT', name: 'Core Reinforcement', description: '+50 Max HP', cost: 2, stats: { maxHp: 50, hp: 50 }, parentId: 'g_n2' },
];

export const MASTERY_TREES: Record<UnitType, MasteryNode[]> = {
    [UnitType.PYRUS]: [
        { 
            id: 'py_n1', 
            levelReq: 1, 
            type: 'STAT', 
            name: 'Fuel Reserves', 
            description: '+50 Max HP', 
            cost: 1, 
            stats: { maxHp: 50, hp: 50 } 
        },
        { 
            id: 'py_n2', 
            levelReq: 2, 
            type: 'STAT', 
            name: 'Ignition Coil', 
            description: '+10% Attack Damage', 
            cost: 1, 
            stats: { atkMod: 0.1 }, 
            parentId: 'py_n1' 
        },
        { 
            id: 'py_n3', 
            levelReq: 3, 
            type: 'STAT', 
            name: 'Reinforced Alloy', 
            description: '+50 Max HP', 
            cost: 2, 
            stats: { maxHp: 50, hp: 50 }, 
            parentId: 'py_n2' 
        },
        { 
            id: 'py_n4', 
            levelReq: 4, 
            type: 'STAT', 
            name: 'Pre-Heat', 
            description: '+5 Starting AP', 
            cost: 2, 
            stats: { ap: 5 }, 
            parentId: 'py_n3' 
        },
        // --- LEVEL 5 LOGIC GATE ---
        { 
            id: 'py_gate_a', 
            levelReq: 5, 
            type: 'GATE', 
            name: 'OVERCLOCK', 
            description: 'LOGIC FORK: +20% Damage, but -50 Max HP. High risk, high heat.', 
            cost: 3, 
            stats: { atkMod: 0.2, maxHp: -50, hp: -50 }, 
            parentId: 'py_n4',
            conflictId: 'py_gate_b'
        },
        { 
            id: 'py_gate_b', 
            levelReq: 5, 
            type: 'GATE', 
            name: 'HEAT SINK', 
            description: 'LOGIC FORK: Immunity to BURN status, but -10% Damage. Safe & stable.', 
            cost: 3, 
            stats: { atkMod: -0.1, immuneTo: ['BURN'] }, 
            parentId: 'py_n4',
            conflictId: 'py_gate_a'
        },
        // --------------------------
        { 
            id: 'py_n6', 
            levelReq: 6, 
            type: 'STAT', 
            name: 'Solar Battery', 
            description: '+100 Max HP', 
            cost: 3, 
            stats: { maxHp: 100, hp: 100 }, 
            parentId: 'py_gate_a' // Accessible from A
        },
        { 
            id: 'py_n6_alt', 
            levelReq: 6, 
            type: 'STAT', 
            name: 'Solar Battery', 
            description: '+100 Max HP', 
            cost: 3, 
            stats: { maxHp: 100, hp: 100 }, 
            parentId: 'py_gate_b' // Accessible from B
        }
    ],
    [UnitType.AEGIS]: GENERIC_NODES,
    [UnitType.GHOST]: GENERIC_NODES,
    [UnitType.REAPER]: GENERIC_NODES,
    [UnitType.HUNTER]: GENERIC_NODES,
    [UnitType.MEDIC]: GENERIC_NODES,
};
