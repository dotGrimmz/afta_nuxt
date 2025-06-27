// /composables/useIsMobile.ts
import { ref, onMounted, onBeforeUnmount } from "vue";

export function useIsMobile() {
  const isMobile = ref(false);
  const isTablet = ref(false);

  let mobileQuery: MediaQueryList | null = null;
  let tabletQuery: MediaQueryList | null = null;

  const updateIsMobile = (e?: MediaQueryListEvent) => {
    if (e) {
      isMobile.value = e.matches;
    } else if (mobileQuery) {
      isMobile.value = mobileQuery.matches;
    }
  };

  const updateIsTablet = (e?: MediaQueryListEvent) => {
    if (e) {
      isTablet.value = e.matches;
    } else if (tabletQuery) {
      isTablet.value = tabletQuery.matches;
    }
  };

  onMounted(() => {
    mobileQuery = window.matchMedia("(max-width: 640px)");
    tabletQuery = window.matchMedia("(max-width: 1020px)");

    updateIsMobile();
    updateIsTablet();

    mobileQuery.addEventListener("change", updateIsMobile);
    tabletQuery.addEventListener("change", updateIsTablet);
  });

  onBeforeUnmount(() => {
    mobileQuery?.removeEventListener("change", updateIsMobile);
    tabletQuery?.removeEventListener("change", updateIsTablet);
  });

  const isDesktop = computed(() => !isMobile.value && !isTablet.value);

  return { isMobile, isTablet, isDesktop };
}
