<template>
  <div class="p-6 bg-gray-900 text-white rounded-xl space-y-6">
    <!-- Inputs -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm mb-1">🎯 Desired Payout (d)</label>
        <input
          v-model.number="payout"
          type="number"
          class="w-full p-2 rounded bg-gray-800 border border-gray-700"
        />
      </div>
      <div>
        <label class="block text-sm mb-1">🏠 House Take (d)</label>
        <input
          v-model.number="house"
          type="number"
          class="w-full p-2 rounded bg-gray-800 border border-gray-700"
        />
      </div>
      <div>
        <label class="block text-sm mb-1">🎟 Ticket Price (d, optional)</label>
        <input
          v-model.number="ticket"
          type="number"
          class="w-full p-2 rounded bg-gray-800 border border-gray-700"
        />
      </div>
      <div class="md:col-span-2">
        <label class="block text-sm mb-1">👥 Player Counts</label>
        <input
          v-model="playersInput"
          type="text"
          class="w-full p-2 rounded bg-gray-800 border border-gray-700"
          placeholder="6,8,10,12"
        />
        <p class="mt-1 text-xs text-gray-400">
          Enter any player counts separated by commas or spaces. Each unique
          value will be evaluated.
        </p>
      </div>
    </div>

    <div class="flex flex-wrap items-end gap-3">
      <label class="flex items-center gap-2 text-sm">
        <input
          v-model="goldView"
          type="checkbox"
          class="h-4 w-4 rounded border-gray-600 bg-gray-800"
        />
        <span>Show gold equivalents</span>
      </label>

      <div v-if="goldView" class="flex items-center gap-2 text-sm">
        <label class="text-sm">Diamonds per gold</label>
        <input
          v-model.number="diamondsPerGold"
          type="number"
          min="1"
          class="w-24 p-2 rounded bg-gray-800 border border-gray-700"
        />
      </div>

      <div class="flex-1"></div>

      <button
        type="button"
        class="px-3 py-2 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 transition"
        @click="resetForm"
      >
        Clear
      </button>
      <button
        type="button"
        class="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="!sentence"
        @click="copySentence"
      >
        Copy Sentence
      </button>
      <span v-if="copyFeedback" class="text-xs text-green-400">{{
        copyFeedback
      }}</span>
    </div>

    <!-- Scenarios Table -->
    <div
      v-if="!playerCounts.length"
      class="p-4 rounded bg-gray-800 text-sm text-gray-300"
    >
      Add at least one player count to calculate scenarios.
    </div>
    <table v-else class="w-full text-left border-collapse">
      <thead>
        <tr class="bg-gray-800 text-gray-300">
          <th class="p-2">Cards</th>
          <th class="p-2">Ticket Price</th>
          <th class="p-2">Gross</th>
          <th class="p-2">Winner</th>
          <th class="p-2">House</th>
          <th class="p-2">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in scenarios"
          :key="row.players"
          :class="[
            'cursor-pointer',
            selected?.players === row.players
              ? 'bg-yellow-700'
              : 'hover:bg-gray-800',
          ]"
          @click="selected = row"
        >
          <td class="p-2">{{ row.players }}</td>
          <td class="p-2">{{ formatAmount(row.ticketPrice) }}</td>
          <td class="p-2">{{ formatAmount(row.gross) }}</td>
          <td class="p-2">{{ formatAmount(row.winner) }}</td>
          <td class="p-2">{{ formatAmount(row.house) }}</td>
          <td class="p-2">
            <span v-if="row.funded" class="text-green-400">✅</span>
            <span v-else class="text-red-400">⚠️</span>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Sentence Preview -->
    <div v-if="selected" class="p-4 bg-gray-800 rounded-lg">
      <p>{{ sentence }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from "vue";

const DEFAULT_PAYOUT = 8000;
const DEFAULT_HOUSE = 0;
const DEFAULT_TICKET: number | null = null;
const DEFAULT_PLAYERS = "2,4,6,8,10,12,14,16,18,20";
const DEFAULT_DIAMONDS_PER_GOLD = 100;

type ScenarioRow = {
  players: number;
  ticketPrice: number;
  gross: number;
  winner: number;
  house: number;
  funded: boolean;
};

const payout = ref<number>(DEFAULT_PAYOUT);
const house = ref<number>(DEFAULT_HOUSE);
const ticket = ref<number | null>(DEFAULT_TICKET);
const playersInput = ref<string>(DEFAULT_PLAYERS);
const selected = ref<ScenarioRow | null>(null);
const goldView = ref(false);
const diamondsPerGold = ref<number>(DEFAULT_DIAMONDS_PER_GOLD);
const copyFeedback = ref<string>("");

let copyTimeout: ReturnType<typeof setTimeout> | null = null;

const scheduleFeedbackClear = () => {
  if (copyTimeout) clearTimeout(copyTimeout);
  copyTimeout = setTimeout(() => {
    copyFeedback.value = "";
    copyTimeout = null;
  }, 2000);
};

const numberFormatter = new Intl.NumberFormat("en-US");

const playerCounts = computed<number[]>(() => {
  const counts = playersInput.value
    .split(/[\s,]+/)
    .map((value) => Number.parseInt(value, 10))
    .filter((num) => Number.isFinite(num) && num > 0);

  const uniqueSorted = Array.from(new Set(counts)).sort((a, b) => a - b);
  return uniqueSorted;
});

const scenarios = computed<ScenarioRow[]>(() => {
  return playerCounts.value.map((players) => {
    let gross = 0;
    let winner = 0;
    let ticketPrice = 0;

    if (ticket.value !== null && !Number.isNaN(ticket.value)) {
      ticketPrice = Math.max(0, ticket.value);
      gross = players * ticketPrice;
      winner = gross - house.value;
    } else {
      ticketPrice = Math.max(
        0,
        Math.ceil((payout.value + house.value) / Math.max(players, 1))
      );
      gross = players * ticketPrice;
      winner = gross - house.value;
    }

    return {
      players,
      ticketPrice,
      gross,
      winner,
      house: house.value,
      funded: winner >= payout.value,
    };
  });
});

watch(
  () => scenarios.value,
  (rows) => {
    if (!selected.value) return;
    const match = rows.find((row) => row.players === selected.value?.players);
    selected.value = match ?? null;
  },
  { immediate: true }
);

watch(playersInput, () => {
  if (!playerCounts.value.length) {
    selected.value = null;
  }
});

const formatAmount = (diamonds: number) => {
  const sanitized = Number.isFinite(diamonds)
    ? Math.max(0, Math.round(diamonds))
    : 0;
  const diamondText = `${numberFormatter.format(sanitized)} d`;

  if (!goldView.value) {
    return diamondText;
  }

  const rate = diamondsPerGold.value;
  if (!rate || rate <= 0) {
    return diamondText;
  }

  const goldValue = sanitized / rate;
  return `${diamondText} (${goldValue.toFixed(2)} g)`;
};

const sentence = computed(() => {
  if (!selected.value) return "";
  const row = selected.value;
  const ticketText = formatAmount(row.ticketPrice);
  const grossText = formatAmount(row.gross);
  const payoutText = formatAmount(payout.value);
  const winnerText = formatAmount(row.winner);
  const houseText = formatAmount(row.house);

  if (!row.funded) {
    return `With ${row.players} players at ${ticketText} each, the gross pot would be ${grossText} — not enough to fund the advertised payout of ${payoutText}.`;
  }

  return `With ${row.players} players at ${ticketText} each, the gross pot is ${grossText}. The winner takes ${winnerText}, and the house keeps ${houseText}.`;
});

const resetForm = () => {
  payout.value = DEFAULT_PAYOUT;
  house.value = DEFAULT_HOUSE;
  ticket.value = DEFAULT_TICKET;
  playersInput.value = DEFAULT_PLAYERS;
  selected.value = null;
  goldView.value = false;
  diamondsPerGold.value = DEFAULT_DIAMONDS_PER_GOLD;
  copyFeedback.value = "";
  if (copyTimeout) {
    clearTimeout(copyTimeout);
    copyTimeout = null;
  }
};

const copySentence = async () => {
  if (!sentence.value) return;
  if (typeof navigator === "undefined" || !navigator?.clipboard) {
    copyFeedback.value = "Clipboard unavailable";
    scheduleFeedbackClear();
    return;
  }

  try {
    await navigator.clipboard.writeText(sentence.value);
    copyFeedback.value = "Copied!";
  } catch (error) {
    console.error("Unable to copy", error);
    copyFeedback.value = "Copy failed";
  }
  scheduleFeedbackClear();
};

onUnmounted(() => {
  if (copyTimeout) {
    clearTimeout(copyTimeout);
    copyTimeout = null;
  }
});
</script>
