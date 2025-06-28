<template>
  <div class="min-h-screen bg-gray-900 text-white flex">
    <!-- Sidebar (hidden on very small screens) -->
    <aside class="w-64 bg-gray-800 p-6 space-y-4 hidden sm:block">
      <h2 class="text-xl font-semibold mb-4">AFTA Admin</h2>
      <NuxtLink to="/admin" class="block hover:text-blue-400 transition">
        📊 Dashboard
      </NuxtLink>
      <!-- add more links later -->
    </aside>

    <!-- Main content -->
    <main class="flex-1 p-6 overflow-y-auto">
      <slot />
    </main>
  </div>
</template>
