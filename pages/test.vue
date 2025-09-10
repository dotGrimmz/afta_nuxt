<template>
  <div class="p-6">
    <UButton color="success" @click="handleClick">
      Parse challenge.html
    </UButton>

    <div v-if="loading">Loading…</div>
    <div v-if="error" class="text-red-500">Error: {{ error }}</div>
    <div v-if="result" class="break-words text-green-400">
      Hidden string: {{ result }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import * as cheerio from "cheerio";

const loading = ref(false);
const error = ref<string | null>(null);
const result = ref<string | null>(null);

const handleClick = async () => {
  loading.value = true;
  error.value = null;
  result.value = null;

  try {
    // Fetch the static challenge.html
    const res = await fetch("http://localhost:3000/challenge.html");
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

    const html = await res.text();

    // Parse with Cheerio
    const $ = cheerio.load(html);
    const chars: string[] = [];

    $("[value]").each((_, el) => {
      const val = $(el).attr("value");
      // Skip long random-looking strings, keep 1-character values
      if (val && val.length === 1) {
        chars.push(val);
      }
    });

    result.value = chars.join("");
  } catch (err: any) {
    console.error("Parse error:", err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};
</script>
