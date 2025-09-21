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
    </div>

    <!-- Scenarios Table -->
    <table class="w-full text-left border-collapse">
      <thead>
        <tr class="bg-gray-800 text-gray-300">
          <th class="p-2">Players</th>
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
          <td class="p-2">{{ row.ticketPrice }}</td>
          <td class="p-2">{{ row.gross }}</td>
          <td class="p-2">{{ row.winner }}</td>
          <td class="p-2">{{ row.house }}</td>
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
import { ref, computed } from "vue";

const payout = ref<number>(8000); // default desired payout
const house = ref<number>(0);
const ticket = ref<number | null>(null);
const selected = ref<any | null>(null);

// Pre-set scenarios (can expand later)
const playerOptions = [6, 8, 10, 12];

// Computed table rows
const scenarios = computed(() => {
  return playerOptions.map((players) => {
    let gross = 0,
      winner = 0,
      ticketPrice = 0;

    if (ticket.value) {
      gross = players * ticket.value;
      winner = gross - house.value;
      ticketPrice = ticket.value;
    } else {
      ticketPrice = Math.ceil((payout.value + house.value) / players);
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

// Sentence generator
const sentence = computed(() => {
  if (!selected.value) return "";
  const row = selected.value;
  if (!row.funded) {
    return `With ${row.players} players at ${row.ticketPrice} diamonds each, the gross pot would be ${row.gross} diamonds — not enough to fund the advertised payout of ${payout.value} diamonds.`;
  }
  return `With ${row.players} players at ${row.ticketPrice} diamonds each, the gross pot is ${row.gross} diamonds. The winner takes ${row.winner} diamonds, and the house keeps ${row.house} diamonds.`;
});
</script>
