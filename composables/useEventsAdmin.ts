import { P } from "storybook/internal/components";
import { ref, onMounted } from "vue";
import type { Tables } from "~/types/supabase";
export const useEventsAdmin = () => {
  type EventRow = Tables<"events">;

  const events = ref<EventRow[]>([]);
  const loading = ref(false);
  const errorMsg = ref<string | null>(null);
  const fetchEvents = async () => {
    loading.value = true;
    errorMsg.value = null;

    try {
      //   const { data, error } = await $fetch<EventRow>("/api/events/get", {
      //     method: "GET",
      //   });
    } catch (e: any) {
      console.error({ e });
    } finally {
      loading.value = false;
    }
  };
};
