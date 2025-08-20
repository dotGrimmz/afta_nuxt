import { toast } from "#build/ui";
import { ref, onMounted } from "vue";
import type { EventForm } from "~/types";
import type { Tables } from "~/types/supabase";
const { $toast } = useNuxtApp();

export const useEventsAdmin = () => {
  const eventForm = ref<EventForm>({
    title: "",
    description: "",
    datetime: "",
  });

  const eventErrors = ref<{ title?: string; datetime?: string }>({});
  const submittingEvent = ref(false);

  //   function validateEventForm() {
  //   eventErrors.value = {}
  //   if (!eventForm.value.title?.trim()) eventErrors.value.title = 'Title is required'
  //   if (!eventForm.value.datetime) eventErrors.value.datetime = 'Date & time is required'
  //   return Object.keys(eventErrors.value).length === 0
  // }

  const validateEventForm = () => {
    eventErrors.value = {};
    if (!eventForm.value.title?.trim()) {
      eventErrors.value.title = "Title is required";
    }
    if (!eventForm.value.datetime) {
      eventErrors.value.datetime = "Date & time is required";
    }
    return Object.keys(eventErrors.value).length === 0;
  };

  const toIsoUtc = (localDT?: string) => {
    if (!localDT) {
      return "";
    }
    return new Date(localDT).toISOString();
  };

  const createEvent = async () => {
    if (!validateEventForm()) {
      return;
    }
    submittingEvent.value = true;

    try {
      const payload = {
        title: eventForm.value.title.trim(),
        description: eventForm.value.description?.trim() || null,
        date: toIsoUtc(eventForm.value.datetime),
      };
      await $fetch("/api/events/post", {
        method: "POST",
        body: payload,
      });
      // re-fetch list so UI reflects newly created event
      await fetchEvents();

      // reset form
      resetEventForm();
      $toast.success("Event Created!");
    } catch (e) {
      console.error(e);
      $toast.error("error to create event!");
    } finally {
      submittingEvent.value = false;
    }
  };

  const resetEventForm = () => {
    eventForm.value = { title: "", description: "", datetime: "" };
  };

  const {
    data,
    pending: loading,
    error,
    refresh,
  } = useAsyncData(
    "events",
    () => $fetch<Tables<"events">[]>("/api/events/get"),
    { server: true, default: () => [] }
  );
  const errorMsg = computed(() => error.value?.message ?? null);
  const fetchEvents = () => refresh();

  const handleDelete = async (id: string) => {
    try {
      await $fetch(`/api/events/${id}`, { method: "DELETE" });
      $toast.success("Event deleted");
      console.log("Event deleted");
      fetchEvents();
    } catch (e: any) {
      $toast.success("Error deleting event");

      console.error({ e });
    }
  };

  const fmtDate = (iso?: string | null) => {
    if (!iso) return "";
    try {
      return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(iso));
    } catch {
      return iso ?? "";
    }
  };
  onMounted(fetchEvents);

  return {
    fetchEvents,
    fmtDate,
    handleDelete,
    events: data,
    loading,
    errorMsg,
    eventForm,
    eventErrors,
    submittingEvent,
    createEvent,
    resetEventForm,
  };
};
