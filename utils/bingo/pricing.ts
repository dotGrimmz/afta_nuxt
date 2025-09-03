export const CARD_COST = 800;
export const FREE_SPACE_FEE = 200;

export const calculateContribution = (numCards: number, freeSpace: boolean) => {
  return numCards * CARD_COST + (freeSpace ? FREE_SPACE_FEE : 0);
};
