
export const ESCALATION_PHASES = [
  { name: 'SETUP', rounds: [1, 2], baseIncome: 3, rolloverCap: 5 },
  { name: 'SKIRMISH', rounds: [3, 4], baseIncome: 4, rolloverCap: 7 },
  { name: 'BLACKOUT', rounds: [5, 999], baseIncome: 6, rolloverCap: 10 },
];

export function getCurrentEscalation(round: number) {
  return ESCALATION_PHASES.find(p => round >= p.rounds[0] && round <= p.rounds[1]) || ESCALATION_PHASES[ESCALATION_PHASES.length - 1];
}

export function calculateIncome(currentAp: number, round: number): number {
  const esc = getCurrentEscalation(round);
  return Math.min(esc.rolloverCap, currentAp) + esc.baseIncome;
}
