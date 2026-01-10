
export const ESCALATION_PHASES = [
  { name: 'ENGAGEMENT', rounds: [1, 5], baseIncome: 20 },
  { name: 'ESCALATION', rounds: [6, 10], baseIncome: 25 },
  { name: 'BLACKOUT', rounds: [11, 999], baseIncome: 35 },
];

export const MAX_AP = 50;
export const ROLLOVER_CAP = 15;

export function getCurrentEscalation(round: number) {
  return ESCALATION_PHASES.find(p => round >= p.rounds[0] && round <= p.rounds[1]) || ESCALATION_PHASES[ESCALATION_PHASES.length - 1];
}

export function calculateIncome(currentAp: number, round: number, difficultyCapOverride?: number): { total: number, vented: number } {
  const esc = getCurrentEscalation(round);
  
  // Apply Rollover Cap logic
  const carriedOver = Math.min(currentAp, ROLLOVER_CAP);
  const vented = Math.max(0, currentAp - ROLLOVER_CAP);
  
  const rawTotal = carriedOver + esc.baseIncome;
  
  // Hard Cap at 50 (or difficulty override)
  const limit = difficultyCapOverride !== undefined ? Math.min(MAX_AP, difficultyCapOverride) : MAX_AP;
  const total = Math.min(limit, rawTotal);

  return { total, vented };
}
