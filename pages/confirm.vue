<script setup lang="ts">
const user = useSupabaseUser();
const redirectInfo = useSupabaseCookieRedirect();

watch(
  user,
  () => {
    if (user.value) {
      console.log(user.value, "user info");
      const path = redirectInfo.pluck();
      return navigateTo(path || "/dashboard");
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="min-h-screen grid place-items-center text-white">
    Signing you in…
  </div>
</template>
