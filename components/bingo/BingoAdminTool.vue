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
      <h3 class="text-lg font-semibold">Save Pricing Preset</h3>
      <p class="text-xs text-gray-400">
        Use the current ticket and payout setup to add a reusable preset to the
        dashboard list.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm mb-1">Preset Name</label>
          <input
            v-model="presetName"
            type="text"
            class="w-full p-2 rounded bg-gray-800 border border-gray-700"
            placeholder="e.g. Friday Night 50%"
          />
        </div>
        <div>
          <label class="block text-sm mb-1">Base Card Cost (d)</label>
          <input
            v-model.number="presetBaseCardCost"
            type="number"
            min="0"
            step="0.01"
            class="w-full p-2 rounded bg-gray-800 border border-gray-700"
            placeholder="Leave blank to use ticket price"
          />
          <p class="mt-1 text-xs text-gray-500">
            Derived card cost: {{ derivedBaseAmountLabel }} • Using:
            {{ effectiveBaseAmountLabel }}
          </p>
        </div>
        <div>
          <label class="block text-sm mb-1">Free Space Cost (d)</label>
          <input
            v-model.number="presetFreeSpaceCost"
            type="number"
            min="0"
            step="0.01"
            class="w-full p-2 rounded bg-gray-800 border border-gray-700"
          />
        </div>
        <div>
          <label class="block text-sm mb-1">Auto Mark Cost (d)</label>
          <input
            v-model.number="presetAutoMarkCost"
            type="number"
            min="0"
            step="0.01"
            class="w-full p-2 rounded bg-gray-800 border border-gray-700"
          />
        </div>
        <div>
          <label class="block text-sm mb-1">Preset Payout %</label>
          <input
            v-model.number="presetPayoutPercent"
            type="number"
            min="0"
            max="100"
            step="0.1"
            class="w-full p-2 rounded bg-gray-800 border border-gray-700"
            placeholder="e.g. 50"
          />
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-3 text-xs text-gray-400">
        <span>{{ presetPayoutPercentageLabel }}</span>
      </div>
      <div v-if="presetPreviewRows.length" class="flex flex-wrap gap-2 text-xs">
        <div
          v-for="row in presetPreviewRows"
          :key="row.cards"
          class="inline-flex items-center gap-2 px-3 py-2 rounded border border-gray-700 bg-gray-800/70 text-gray-200"
        >
          <span class="font-semibold">{{ row.cards }} cards</span>
          <span class="text-emerald-300">payout {{ row.payoutLabel }}</span>
          <span class="text-slate-300">house {{ row.houseLabel }}</span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!canCreatePreset"
          @click="handleCreatePresetClick"
        >
          Create Pricing Preset
        </button>
        <span v-if="presetFeedback" class="text-xs text-emerald-400">{{
          presetFeedback
        }}</span>
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

const props = defineProps<{
  baseCardCost?: number | null;
  freeSpaceCost?: number | null;
  autoMarkCost?: number | null;
  presetName?: string | null;
  presetPayoutPercentage?: number | null;
}>();

const emit = defineEmits<{
  (
    e: "create-preset",
    payload: {
      name: string;
      baseCardCost: number;
      freeSpaceCost: number;
      autoMarkCost: number;
      payout?: number;
      payoutPercentage?: number;
    }
  ): void;
}>();

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

const presetName = ref<string>(props.presetName ?? "");
const presetBaseCardCost = ref<number | null>(
  props.baseCardCost ?? null
);
const presetFreeSpaceCost = ref<number>(
  Number.isFinite(Number(props.freeSpaceCost))
    ? Number(props.freeSpaceCost)
    : 0
);
const presetAutoMarkCost = ref<number>(
  Number.isFinite(Number(props.autoMarkCost))
    ? Number(props.autoMarkCost)
    : 0
);
const presetPayoutPercent = ref<number | null>(
  typeof props.presetPayoutPercentage === "number"
    ? Math.round(props.presetPayoutPercentage * 100)
    : Math.round(DEFAULT_PAYOUT_PERCENT * 100)
);
const presetFeedback = ref("");

const copyFeedback = ref("");
let copyTimeout: ReturnType<typeof setTimeout> | null = null;
let presetTimeout: ReturnType<typeof setTimeout> | null = null;

const STORAGE_KEY = "bingo-admin-tool-state";
type PersistedState = {
  playerCount: number | null;
  ticketPrice: number | null;
  payoutPercent: number;
  payout: number;
  house: number;
  gross: number;
  cardsOwned: number;
  presetName?: string;
  presetBaseCardCost?: number | null;
  presetFreeSpaceCost?: number;
  presetAutoMarkCost?: number;
  presetPayoutPercent?: number | null;
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
    presetName: presetName.value,
    presetBaseCardCost: presetBaseCardCost.value,
    presetFreeSpaceCost: presetFreeSpaceCost.value,
    presetAutoMarkCost: presetAutoMarkCost.value,
    presetPayoutPercent: presetPayoutPercent.value,
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
    if (parsed.presetName !== undefined) {
      presetName.value = parsed.presetName ?? "";
    }
    if (parsed.presetBaseCardCost !== undefined) {
      presetBaseCardCost.value = parsed.presetBaseCardCost ?? null;
    }
    if (parsed.presetFreeSpaceCost !== undefined) {
      presetFreeSpaceCost.value = Number(parsed.presetFreeSpaceCost) || 0;
    }
    if (parsed.presetAutoMarkCost !== undefined) {
      presetAutoMarkCost.value = Number(parsed.presetAutoMarkCost) || 0;
    }
    if (parsed.presetPayoutPercent !== undefined) {
      const numeric = Number(parsed.presetPayoutPercent);
      presetPayoutPercent.value =
        Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
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

watch(
  presetPayoutPercent,
  (val) => {
    if (val === null || val === undefined) {
      presetPayoutPercent.value = Math.round(DEFAULT_PAYOUT_PERCENT * 100);
      return;
    }
    const clamped = Math.min(Math.max(val, 0), 100);
    if (clamped !== val) {
      presetPayoutPercent.value = clamped;
    }
  }
);

watch(
  () => props.baseCardCost,
  (val) => {
    if (val === undefined) return;
    if (val === null) {
      presetBaseCardCost.value = null;
      return;
    }
    const numeric = Number(val);
    presetBaseCardCost.value = Number.isFinite(numeric) ? numeric : null;
  },
  { immediate: true }
);

watch(
  () => props.freeSpaceCost,
  (val) => {
    if (val === undefined || val === null) return;
    const numeric = Number(val);
    if (!Number.isFinite(numeric)) return;
    presetFreeSpaceCost.value = clampToTwoDecimals(numeric);
  },
  { immediate: true }
);

watch(
  () => props.autoMarkCost,
  (val) => {
    if (val === undefined || val === null) return;
    const numeric = Number(val);
    if (!Number.isFinite(numeric)) return;
    presetAutoMarkCost.value = clampToTwoDecimals(numeric);
  },
  { immediate: true }
);

watch(
  () => props.presetName,
  (val) => {
    if (val === undefined) return;
    presetName.value = val ?? "";
  },
  { immediate: true }
);

watch(
  () => props.presetPayoutPercentage,
  (val) => {
    if (val === undefined || val === null) return;
    const percent = Number(val) * 100;
    if (!Number.isFinite(percent)) return;
    presetPayoutPercent.value = Math.round(percent);
  },
  { immediate: true }
);

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

const derivedTicketPrice = computed(() => {
  const price = Number(ticketPrice.value);
  if (Number.isFinite(price) && price > 0) {
    return clampToTwoDecimals(price);
  }

  const count = playerCountNumber.value;
  if (count > 0) {
    const estimated = gross.value / count;
    if (Number.isFinite(estimated) && estimated > 0) {
      return clampToTwoDecimals(estimated);
    }
  }

  const fallback = props.baseCardCost;
  if (fallback !== undefined && fallback !== null) {
    const numeric = Number(fallback);
    if (Number.isFinite(numeric) && numeric > 0) {
      return clampToTwoDecimals(numeric);
    }
  }

  return 0;
});

const effectiveBaseCardCost = computed(() => {
  const manual = presetBaseCardCost.value;
  if (manual !== null && Number.isFinite(manual) && manual > 0) {
    return clampToTwoDecimals(manual);
  }
  return derivedTicketPrice.value;
});

const derivedBaseAmountLabel = computed(() =>
  derivedTicketPrice.value > 0 ? formatAmount(derivedTicketPrice.value) : "—"
);

const effectiveBaseAmountLabel = computed(() =>
  formatAmount(effectiveBaseCardCost.value || 0)
);

const presetPayoutPercentageFraction = computed(() => {
  const raw = presetPayoutPercent.value;
  if (raw === null || raw === undefined) {
    return Math.min(Math.max(payoutPercent.value, 0), 1);
  }
  const numeric = Number(raw);
  if (!Number.isFinite(numeric)) {
    return Math.min(Math.max(payoutPercent.value, 0), 1);
  }
  return Math.min(Math.max((numeric / 100), 0), 1);
});

const presetPayoutPercentageLabel = computed(
  () => `${(Math.round(presetPayoutPercentageFraction.value * 1000) / 10).toFixed(1)}% of pot`
);

const canCreatePreset = computed(
  () =>
    presetName.value.trim().length > 0 &&
    effectiveBaseCardCost.value > 0 &&
    presetPayoutPercentageFraction.value > 0
);

const roundToNearestTen = (value: number) => Math.round(value / 10) * 10;

const computePreviewShares = (total: number, pct: number) => {
  const roundedTotal = Math.round(total * 10) / 10;
  const payout = Math.min(
    roundedTotal,
    Math.max(0, roundToNearestTen(roundedTotal * pct))
  );
  const house = Math.max(
    0,
    Math.round((roundedTotal - payout) * 10) / 10
  );

  return { payout, house };
};

const presetPreviewRows = computed(() => {
  const rows: { cards: number; payoutLabel: string; houseLabel: string }[] = [];
  const base = effectiveBaseCardCost.value;
  if (!base) return rows;

  const free = clampToTwoDecimals(Number(presetFreeSpaceCost.value) || 0);
  const auto = clampToTwoDecimals(Number(presetAutoMarkCost.value) || 0);
  const pct = presetPayoutPercentageFraction.value;

  for (const cards of [2, 3, 4, 5]) {
    const rawTotal = cards * base + free + auto;
    const { payout: payoutAmount, house: houseAmount } = computePreviewShares(
      rawTotal,
      pct
    );
    rows.push({
      cards,
      payoutLabel: formatAmount(payoutAmount),
      houseLabel: formatAmount(houseAmount),
    });
  }

  return rows;
});

const schedulePresetFeedbackClear = () => {
  if (presetTimeout) clearTimeout(presetTimeout);
  presetTimeout = setTimeout(() => {
    presetFeedback.value = "";
    presetTimeout = null;
  }, 2000);
};

const handleCreatePresetClick = () => {
  if (!canCreatePreset.value) return;

  emit("create-preset", {
    name: presetName.value.trim(),
    baseCardCost: effectiveBaseCardCost.value,
    freeSpaceCost: clampToTwoDecimals(
      Number(presetFreeSpaceCost.value) || 0
    ),
    autoMarkCost: clampToTwoDecimals(Number(presetAutoMarkCost.value) || 0),
    payout: clampToTwoDecimals(payout.value),
    payoutPercentage:
      Math.round(presetPayoutPercentageFraction.value * 1000) / 1000,
  });

  presetFeedback.value = "Preset added to pricing list.";
  schedulePresetFeedbackClear();
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
    presetName,
    presetBaseCardCost,
    presetFreeSpaceCost,
    presetAutoMarkCost,
    presetPayoutPercent,
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
  presetName.value = props.presetName ?? "";
  presetBaseCardCost.value = props.baseCardCost ?? null;
  presetFreeSpaceCost.value = Number(props.freeSpaceCost ?? 0);
  presetAutoMarkCost.value = Number(props.autoMarkCost ?? 0);
  presetPayoutPercent.value =
    typeof props.presetPayoutPercentage === "number"
      ? Math.round(props.presetPayoutPercentage * 100)
      : null;
  presetFeedback.value = "";
  if (copyTimeout) {
    clearTimeout(copyTimeout);
    copyTimeout = null;
  }
  if (presetTimeout) {
    clearTimeout(presetTimeout);
    presetTimeout = null;
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
  if (presetTimeout) {
    clearTimeout(presetTimeout);
    presetTimeout = null;
  }
});
</script>
