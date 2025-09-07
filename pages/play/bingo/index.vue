<script setup lang="ts">
const router = useRouter();
const code = ref("");
const error = ref("");

const join = () => {
  console.log("hello?");
  if (!code.value.trim()) {
    error.value = "Please enter a code.";
    return;
  }
  error.value = "";
  router.push(`/play/bingo/${code.value.trim()}`);
};
</script>

<template>
  <main class="flex flex-col items-center justify-center h-screen space-y-6">
    <div class="bg-gray-800 p-6 rounded-lg w-full max-w-md shadow">
      <h1 class="text-2xl font-bold mb-4 text-center">Join Bingo Game</h1>
      <input
        v-model="code"
        type="text"
        placeholder="Enter your join code"
        class="w-full p-2 rounded bg-gray-900 border border-gray-600 text-white"
      />
      <p v-if="error" class="text-red-500 text-sm mt-2">{{ error }}</p>
      <UButton @click="join" color="primary" class="w-full mt-4">
        Join Game
      </UButton>
    </div>
  </main>
</template>
