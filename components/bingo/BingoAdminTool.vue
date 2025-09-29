<template>
  <div class="p-6 bg-gray-900 text-white rounded-xl space-y-8">
    <section class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div>
        <label class="block text-sm mb-1">👥 Player Count</label>
        <input
          v-model.number="playerCount"
          type="number"
          min="0"
          class="w-full p-2 rounded bg-gray-800 border border-gray-700"
          placeholder="e.g. 12"
        />
      </div>
      <div>
        <label class="block text-sm mb-1">🎟 Ticket Price (optional)</label>
        <input
          v-model.number="ticketPrice"
          type="number"
          min="0"
          step="0.01"
          class="w-full p-2 rounded bg-gray-800 border border-gray-700"
          placeholder="e.g. 50"
        />
        <p class="mt-1 text-xs text-gray-400">
          When provided, gross = players × ticket price.
        </p>
      </div>
      <div>
        <label class="block text-sm mb-1">🏆 Default Payout %</label>
        <input
          v-model.number="payoutPercentModel"
          type="number"
          min="0"
          max="100"
          class="w-full p-2 rounded bg-gray-800 border border-gray-700"
        />
        <p class="mt-1 text-xs text-gray-400">
          Applied when auto-calculating shares.
        </p>
      </div>
    </section>

    <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm mb-1">🎯 Player Payout (d)</label>
        <input
          v-model.number="payoutModel"
          type="number"
          min="0"
          step="0.01"
          class="w-full p-2 rounded bg-gray-800 border border-gray-700"
        />
        <p class="mt-1 text-xs text-gray-400">
          {{
            hasTicketInputs
              ? "Adjusting payout keeps total equal to gross."
              : "Gross adjusts to match payout + house."
          }}
        </p>
      </div>
      <div>
        <label class="block text-sm mb-1">🏠 House Take (d)</label>
        <input
          v-model.number="houseModel"
          type="number"
          min="0"
          step="0.01"
          class="w-full p-2 rounded bg-gray-800 border border-gray-700"
        />
        <p class="mt-1 text-xs text-gray-400">
          {{
            hasTicketInputs
              ? "Remainder of the gross after payout."
              : "Gross updates when adjusted."
          }}
        </p>
      </div>
    </section>

    <section class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
      <div class="bg-gray-800/80 rounded-lg p-4 border border-gray-700">
        <p class="text-gray-400">Gross Pot</p>
        <p class="text-2xl font-semibold">{{ formatAmount(gross) }}</p>
        <p class="text-xs text-gray-400 mt-2">
          Players: {{ playerCountDisplay }} • Ticket: {{ ticketPriceDisplay }}
        </p>
      </div>
      <div class="bg-gray-800/80 rounded-lg p-4 border border-gray-700">
        <p class="text-gray-400">Winner Payout</p>
        <p class="text-2xl font-semibold">{{ formatAmount(payout) }}</p>
        <p class="text-xs text-gray-400 mt-2">{{ payoutPercentLabel }}</p>
      </div>
      <div class="bg-gray-800/80 rounded-lg p-4 border border-gray-700">
        <p class="text-gray-400">House Take</p>
        <p class="text-2xl font-semibold">{{ formatAmount(house) }}</p>
        <p class="text-xs text-gray-400 mt-2">Zero-sum with payout.</p>
      </div>
    </section>

    <section class="space-y-3">
      <h3 class="text-lg font-semibold">Ticket Price Suggestions</h3>
      <p class="text-xs text-gray-400">
        Based on current payout + house totals. Click to apply a price.
      </p>
      <div v-if="!ticketSuggestions.length" class="text-sm text-gray-400">
        Provide a player count along with payout and house values to see
        suggestions.
      </div>
      <div v-else class="flex flex-wrap gap-2">
        <button
          v-for="option in ticketSuggestions"
          :key="option.label"
          type="button"
          class="px-3 py-2 rounded bg-emerald-600/20 border border-emerald-400/40 hover:bg-emerald-500/30 transition"
          @click="applyTicketSuggestion(option.value)"
        >
          <span class="font-semibold">{{ option.label }}</span>
          <span class="ml-2 text-sm text-emerald-200">
            {{ formatAmount(option.value) }}
          </span>
        </button>
      </div>
    </section>

    <section class="space-y-3">
      <h3 class="text-lg font-semibold">Winning Odds</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div class="bg-gray-800/70 border border-gray-700 rounded-lg p-4">
          <p class="text-gray-400">Chance per Card</p>
          <p class="text-xl font-semibold">{{ oddsPerCardLabel }}</p>
          <p class="text-xs text-gray-400 mt-2">
            Every distinct card sold has an equal draw probability.
          </p>
        </div>
        <div class="bg-gray-800/70 border border-gray-700 rounded-lg p-4 md:col-span-2">
          <label class="text-gray-400 text-xs uppercase tracking-wide block mb-2">
            Cards owned by a single player
          </label>
          <div class="flex flex-wrap items-center gap-3">
            <input
              v-model.number="cardsOwnedModel"
              type="number"
              min="0"
              :max="playerCountNumber || undefined"
              class="w-24 p-2 rounded bg-gray-800 border border-gray-700"
            />
            <p class="text-sm text-gray-300">{{ cardsOwnedOddsLabel }}</p>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            Odds increase linearly with cards owned (one winning card drawn).
          </p>
        </div>
      </div>
    </section>

    <section class="space-y-2">
      <h3 class="text-lg font-semibold">Summary</h3>
      <p
        class="bg-gray-800/80 border border-gray-700 rounded-lg p-4 text-sm leading-relaxed"
      >
        {{ summary }}
      </p>
    </section>

    <div class="flex flex-wrap items-center gap-3">
      <button
        type="button"
        class="px-3 py-2 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 transition"
        @click="resetForm"
      >
        Reset
      </button>
      <button
        type="button"
        class="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="!summary"
        @click="copySummary"
      >
        Copy Summary
      </button>
      <span v-if="copyFeedback" class="text-xs text-green-400">{{
        copyFeedback
      }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";

const DEFAULT_PLAYER_COUNT = 12;
const DEFAULT_PAYOUT_PERCENT = 0.8;
const DEFAULT_CARDS_OWNED = 1;

const playerCount = ref<number | null>(DEFAULT_PLAYER_COUNT);
const ticketPrice = ref<number | null>(null);
const payoutPercent = ref(DEFAULT_PAYOUT_PERCENT);
const payout = ref(0);
const house = ref(0);
const gross = ref(0);
const lastEdited = ref<"none" | "payout" | "house">("none");
const cardsOwned = ref<number>(DEFAULT_CARDS_OWNED);

const copyFeedback = ref("");
let copyTimeout: ReturnType<typeof setTimeout> | null = null;

const STORAGE_KEY = "bingo-admin-tool-state";
type PersistedState = {
  playerCount: number | null;
  ticketPrice: number | null;
  payoutPercent: number;
  payout: number;
  house: number;
  gross: number;
  cardsOwned: number;
};

let isHydrating = true;

const persistState = () => {
  if (isHydrating || typeof window === "undefined") return;

  const payload: PersistedState = {
    playerCount: playerCount.value ?? null,
    ticketPrice: ticketPrice.value ?? null,
    payoutPercent: payoutPercent.value,
    payout: payout.value,
    house: house.value,
    gross: gross.value,
    cardsOwned: cardsOwned.value,
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("Unable to persist bingo admin tool state", err);
  }
};

const restorePersistedState = () => {
  if (typeof window === "undefined") {
    isHydrating = false;
    return;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw) as Partial<PersistedState>;

    if (parsed.playerCount !== undefined) {
      playerCount.value = parsed.playerCount;
    }
    if (parsed.ticketPrice !== undefined) {
      ticketPrice.value = parsed.ticketPrice;
    }
    if (parsed.payoutPercent !== undefined) {
      payoutPercent.value = parsed.payoutPercent;
    }
    if (parsed.payout !== undefined) {
      payout.value = parsed.payout;
    }
    if (parsed.house !== undefined) {
      house.value = parsed.house;
    }
    if (parsed.gross !== undefined) {
      gross.value = parsed.gross;
    }
    if (parsed.cardsOwned !== undefined) {
      cardsOwned.value = parsed.cardsOwned;
    }
  } catch (err) {
    console.warn("Unable to restore bingo admin tool state", err);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (removeErr) {
      console.warn("Unable to clear persisted bingo admin tool state", removeErr);
    }
  } finally {
    isHydrating = false;
  }
};

const clearPersistedState = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("Unable to clear bingo admin tool state", err);
  }
};

const scheduleCopyFeedbackClear = () => {
  if (copyTimeout) clearTimeout(copyTimeout);
  copyTimeout = setTimeout(() => {
    copyFeedback.value = "";
    copyTimeout = null;
  }, 2000);
};

onMounted(() => {
  restorePersistedState();
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const hasTicketInputs = computed(() => {
  const count = Number(playerCount.value);
  const price = Number(ticketPrice.value);
  return (
    Number.isFinite(count) && count > 0 && Number.isFinite(price) && price > 0
  );
});

const playerCountNumber = computed(() => {
  const count = Number(playerCount.value);
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
});

const formatAmount = (value: number) => `${numberFormatter.format(value)} d`;

const payoutPercentModel = computed({
  get: () => Math.round(payoutPercent.value * 100),
  set: (val: number) => {
    const normalizedPercent =
      Math.min(Math.max(Number(val) || 0, 0), 100) / 100;
    payoutPercent.value = normalizedPercent;
    if (gross.value > 0) {
      lastEdited.value = "none";
      syncSharesFromGross(gross.value);
    }
  },
});

const clampToTwoDecimals = (value: number) =>
  Number(Math.max(value, 0).toFixed(2));

const syncSharesFromGross = (total: number) => {
  const sanitizedTotal = clampToTwoDecimals(total);
  if (sanitizedTotal <= 0) {
    payout.value = 0;
    house.value = 0;
    return;
  }

  if (lastEdited.value === "payout") {
    const next = Math.min(Math.max(payout.value, 0), sanitizedTotal);
    payout.value = clampToTwoDecimals(next);
    house.value = clampToTwoDecimals(sanitizedTotal - payout.value);
    return;
  }

  if (lastEdited.value === "house") {
    const next = Math.min(Math.max(house.value, 0), sanitizedTotal);
    house.value = clampToTwoDecimals(next);
    payout.value = clampToTwoDecimals(sanitizedTotal - house.value);
    return;
  }

  const suggestedPayout = clampToTwoDecimals(
    sanitizedTotal * payoutPercent.value
  );
  payout.value = Math.min(suggestedPayout, sanitizedTotal);
  house.value = clampToTwoDecimals(sanitizedTotal - payout.value);
};

watch(
  [playerCount, ticketPrice],
  ([count, price]) => {
    const countNum = Number(count);
    const priceNum = Number(price);

    if (
      Number.isFinite(countNum) &&
      countNum > 0 &&
      Number.isFinite(priceNum) &&
      priceNum > 0
    ) {
      const total = clampToTwoDecimals(countNum * priceNum);
      gross.value = total;
      syncSharesFromGross(total);
    } else if (!hasTicketInputs.value) {
      gross.value = clampToTwoDecimals(payout.value + house.value);
    }
  },
  { immediate: true }
);

watch([payout, house], () => {
  if (!hasTicketInputs.value) {
    gross.value = clampToTwoDecimals(payout.value + house.value);
  }
});

const handlePayoutChange = (value: number) => {
  const sanitized = clampToTwoDecimals(Number(value) || 0);
  lastEdited.value = "payout";

  if (hasTicketInputs.value) {
    payout.value = Math.min(sanitized, gross.value);
    house.value = clampToTwoDecimals(gross.value - payout.value);
  } else {
    payout.value = sanitized;
    gross.value = clampToTwoDecimals(payout.value + house.value);
  }
};

const handleHouseChange = (value: number) => {
  const sanitized = clampToTwoDecimals(Number(value) || 0);
  lastEdited.value = "house";

  if (hasTicketInputs.value) {
    house.value = Math.min(sanitized, gross.value);
    payout.value = clampToTwoDecimals(gross.value - house.value);
  } else {
    house.value = sanitized;
    gross.value = clampToTwoDecimals(payout.value + house.value);
  }
};

const payoutModel = computed({
  get: () => payout.value,
  set: (val: number) => handlePayoutChange(val),
});

const houseModel = computed({
  get: () => house.value,
  set: (val: number) => handleHouseChange(val),
});

watch(playerCountNumber, (count) => {
  if (count <= 0) {
    cardsOwned.value = 0;
    return;
  }
  const current = Math.max(Math.floor(Number(cardsOwned.value) || 0), 0);
  if (current === 0) {
    cardsOwned.value = Math.min(DEFAULT_CARDS_OWNED, count);
  } else if (current > count) {
    cardsOwned.value = count;
  } else {
    cardsOwned.value = current;
  }
});

const cardsOwnedModel = computed({
  get: () => cardsOwned.value,
  set: (val: number) => {
    const count = playerCountNumber.value;
    const sanitized = Math.max(Math.floor(Number(val) || 0), 0);
    if (!count) {
      cardsOwned.value = sanitized;
    } else {
      cardsOwned.value = Math.min(sanitized, count);
    }
  },
});

const playerCountDisplay = computed(() =>
  playerCountNumber.value ? `${playerCountNumber.value} players` : "–"
);

const ticketPriceDisplay = computed(() => {
  const price = Number(ticketPrice.value);
  return Number.isFinite(price) && price > 0 ? formatAmount(price) : "–";
});

const payoutPercentLabel = computed(() => {
  if (!gross.value) return "No gross total yet";
  const percent = gross.value
    ? ((payout.value / gross.value) * 100).toFixed(1)
    : "0";
  return `${percent}% of gross`;
});

const ticketSuggestions = computed(() => {
  const count = playerCountNumber.value;
  const total = gross.value;

  if (!count || total <= 0) return [] as { label: string; value: number }[];

  const exact = total / count;
  const roundedUp = Math.ceil(exact);
  const roundedDown = Math.max(Math.floor(exact), 0);
  const toHalf = Math.ceil(exact * 2) / 2;

  const suggestions = [
    { label: "Exact", value: exact },
    { label: "Round Up", value: roundedUp },
    { label: "Round Down", value: roundedDown },
    { label: "Nearest .50", value: toHalf },
  ];

  const seen = new Set<number>();
  const unique: { label: string; value: number }[] = [];

  for (const option of suggestions) {
    const normalized = Number(option.value.toFixed(2));
    if (normalized <= 0 || seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push({ label: option.label, value: normalized });
  }

  return unique;
});

const applyTicketSuggestion = (value: number) => {
  ticketPrice.value = clampToTwoDecimals(value);
  lastEdited.value = "none";
};

const singleCardOdds = computed(() => {
  const count = playerCountNumber.value;
  if (!count) return 0;
  return (1 / count) * 100;
});

const oddsPerCardLabel = computed(() => {
  const count = playerCountNumber.value;
  if (!count) return "—";
  return `1 in ${count} (${singleCardOdds.value.toFixed(2)}%)`;
});

const cardsOwnedOdds = computed(() => {
  const count = playerCountNumber.value;
  if (!count) return 0;
  const owned = Math.min(Math.max(Number(cardsOwned.value) || 0, 0), count);
  return (owned / count) * 100;
});

const cardsOwnedOddsLabel = computed(() => {
  const count = playerCountNumber.value;
  if (!count) return "Add a player count to calculate odds.";
  const owned = Math.min(Math.max(Number(cardsOwned.value) || 0, 0), count);
  if (owned === 0) {
    return "Owning 0 cards means 0% chance of winning.";
  }
  return `Owning ${owned} card${owned === 1 ? "" : "s"} ≈ ${cardsOwnedOdds.value.toFixed(2)}% chance.`;
});

const summary = computed(() => {
  if (!playerCountNumber.value || gross.value <= 0) {
    return "Provide at least a player count and one of ticket price or payout/house to see a summary.";
  }

  const ticketInfo = Number(ticketPrice.value)
    ? `at ${formatAmount(Number(ticketPrice.value))} per ticket`
    : `with a projected ticket price of about ${formatAmount(
        gross.value / playerCountNumber.value
      )}`;

  const oddsInfo = playerCountNumber.value
    ? `Each card has roughly ${singleCardOdds.value.toFixed(2)}% odds. Owning ${cardsOwned.value} card${
        cardsOwned.value === 1 ? "" : "s"
      } ≈ ${cardsOwnedOdds.value.toFixed(2)}%.`
    : "";

  return `With ${
    playerCountNumber.value
  } players ${ticketInfo}, the gross pot is ${formatAmount(
    gross.value
  )}. The winner receives ${formatAmount(
    payout.value
  )}, and the house keeps ${formatAmount(house.value)}. ${oddsInfo}`.trim();
});

watch(
  [
    playerCount,
    ticketPrice,
    payoutPercent,
    payout,
    house,
    gross,
    cardsOwned,
  ],
  () => {
    persistState();
  },
  { flush: "post" }
);

const resetForm = () => {
  isHydrating = true;
  playerCount.value = DEFAULT_PLAYER_COUNT;
  ticketPrice.value = null;
  payoutPercent.value = DEFAULT_PAYOUT_PERCENT;
  payout.value = 0;
  house.value = 0;
  gross.value = 0;
  lastEdited.value = "none";
  cardsOwned.value = DEFAULT_CARDS_OWNED;
  copyFeedback.value = "";
  if (copyTimeout) {
    clearTimeout(copyTimeout);
    copyTimeout = null;
  }
  clearPersistedState();
  nextTick(() => {
    isHydrating = false;
  });
};

const copySummary = async () => {
  if (!summary.value) return;
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    copyFeedback.value = "Clipboard unavailable";
    scheduleCopyFeedbackClear();
    return;
  }

  try {
    await navigator.clipboard.writeText(summary.value);
    copyFeedback.value = "Copied!";
  } catch (err) {
    console.error("Unable to copy summary", err);
    copyFeedback.value = "Copy failed";
  }
  scheduleCopyFeedbackClear();
};

onUnmounted(() => {
  if (copyTimeout) {
    clearTimeout(copyTimeout);
    copyTimeout = null;
  }
});
</script>
