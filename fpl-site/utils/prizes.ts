export const PREMIER_PRIZES: Record<string, string> = {
  "1": "Champion $230",
  "2": "Champions League $110",
  "3": "Champions League $100",
  "4": "Champions League $90",
  "5": "Europa League $55",
  "6": "Europa League $45",
  "7": "Conference League $35",
  "8": "Battle of The Mid",
  "9": "Battle of The Mid",
  "10": "Battle of The Mid",
  "11": "Battle of The Mid",
  "12": "Battle of The Mid",
  "13": "Battle of The Mid",
  "14": "Battle of The Mid",
  "15": "Battle of The Mid",
  "16": "Relegation Battle",
  "17": "Relegation",
  "18": "Relegation",
  "19": "Relegation",
  "20": "Relegation",
};

export const CHAMP_PRIZES: Record<string, string> = {
  "1": "Champion $65",
  "2": "Promotion $45",
  "3": "Promotion $40",
  "4": "Promotion $30",
  "5": "Upper Mid $25",
  "6": "Upper Mid $20",
  "7": "Upper Mid $15",
  "8": "Battle of The Mid",
  "9": "Battle of The Mid",
  "10": "Battle of The Mid",
  "11": "Battle of The Mid",
  "12": "Battle of The Mid",
  "13": "Battle of The Mid",
  "14": "Battle of The Mid",
  "15": "Battle of The Mid",
  "16": "Battle of The Mid",
  "17": "Shame Battle",
  "18": "Shame Battle",
  "19": "Shame Battle",
  "20": "Shame",
};

export function getPrizeLabel(league: string, position: number): string {
  const map = league === "premier" ? PREMIER_PRIZES : CHAMP_PRIZES;
  return map[String(position)] ?? "";
}
