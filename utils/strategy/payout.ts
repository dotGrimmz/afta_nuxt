export type StrategyPayoutParams = {
  currency: "gold" | "diamond";
  cardCost: number;
  cardsSold: number;
  housePercent: number; // e.g. 0.1 for 10%
  splits: { first: number; second: number; third: number };
  exchangeRate: number; // gold per diamond
  conversionFee: number; // e.g. 0.0025
};

export type StrategyPayoutResult =
  | {
      spendable: number;
      houseTake: number;
      prizePool: number;
      payouts: {
        first: number;
        second: number;
        third: number;
      };
      notes: {
        conversionApplied: boolean;
        perCard: string;
      };
    }
  | {
      error: string;
    };

const roundGold = (value: number): number => Math.max(0, Math.round(value));

const formatPerCard = (params: StrategyPayoutParams): string => {
  const suffix = params.currency === "diamond" ? "diamonds" : "gold";
  return `${params.cardCost} ${suffix}`;
};

const validateSplits = (splits: StrategyPayoutParams["splits"]): boolean => {
  const total = splits.first + splits.second + splits.third;
  return Math.abs(total - 1) < 1e-6;
};

export const computeStrategyPayout = (
  params: StrategyPayoutParams
): StrategyPayoutResult => {
  const {
    currency,
    cardCost,
    cardsSold,
    housePercent,
    splits,
    exchangeRate,
    conversionFee,
  } = params;

  if (cardsSold < 3) {
    return { error: "Minimum 3 participants required" };
  }
  if (!validateSplits(splits)) {
    return { error: "Winner split percentages must sum to 1.0" };
  }
  if (housePercent < 0 || housePercent >= 1) {
    return { error: "House percentage must be between 0 and 1" };
  }

  let spendable: number;
  let conversionApplied = false;

  if (currency === "diamond") {
    const totalDiamonds = cardCost * cardsSold;
    const grossGold = totalDiamonds * exchangeRate;
    spendable = grossGold * (1 - conversionFee);
    conversionApplied = true;
  } else {
    spendable = cardCost * cardsSold;
  }

  const houseTake = spendable * housePercent;
  const prizePool = spendable - houseTake;

  const payouts = {
    first: prizePool * splits.first,
    second: prizePool * splits.second,
    third: prizePool * splits.third,
  };

  return {
    spendable: roundGold(spendable),
    houseTake: roundGold(houseTake),
    prizePool: roundGold(prizePool),
    payouts: {
      first: roundGold(payouts.first),
      second: roundGold(payouts.second),
      third: roundGold(payouts.third),
    },
    notes: {
      conversionApplied,
      perCard: formatPerCard(params),
    },
  };
};
