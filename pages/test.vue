<template>
  <div class="min-h-screen bg-primary/10 text-primary p-gutter space-y-6">
    <h1 class="text-4xl font-heading font-bold">Heading: DM Sans</h1>
    <p class="font-sans">
      Body: Inter — this should be clean, sans-serif, and in forced dark mode.
    </p>

    <div class="flex gap-3">
      <button class="px-4 py-2 rounded-soft bg-primary text-black/90">
        Primary
      </button>
      <button class="px-4 py-2 rounded-soft bg-secondary text-black/90">
        Secondary
      </button>
      <button class="px-4 py-2 rounded-soft bg-accent text-black/90">
        Accent
      </button>
    </div>

    <div class="rounded-card p-4 border border-white/10 max-w-content">
      Max width cap demo (container=1200px): resize browser to test.
    </div>
  </div>
</template>
