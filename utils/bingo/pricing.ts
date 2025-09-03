export const CARD_COST = 800; // diamonds per card
export const FREE_SPACE_FEE = 200; // extra per card if free space enabled

export const calculateCost = (numCards: number, freeSpace: boolean): number => {
  return numCards * CARD_COST + (freeSpace ? numCards * FREE_SPACE_FEE : 0);
};
