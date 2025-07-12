import { ref, onMounted, onBeforeUnmount } from "vue";
import { useSupabaseClient } from "#imports";
import type { Poll, PollOptionWithVotes } from "@/types/poll";

export function useActivePoll(pollId?: string) {
  const supabase = useSupabaseClient();

  const poll = ref<Poll | null>(null);
  const options = ref<PollOptionWithVotes[]>([]);
  const loading = ref(true);

  let channel: ReturnType<typeof supabase.channel> | null = null;

  async function fetchPoll() {
    loading.value = true;

    try {
      const res = await $fetch<{ poll: Poll[] }>("/api/polls/active");

      if (!res?.poll?.length) {
        poll.value = null;
        options.value = [];
        return;
      }

      const foundPoll =
        res.poll.find((p) => p.id.toString() === pollId) ?? res.poll[0];

      if (foundPoll) {
        poll.value = foundPoll;

        // ✅ Normalize votes to flat numbers
        options.value = foundPoll.poll_options.map((opt) => ({
          ...opt,
          votes: opt.votes?.count ?? 0,
        }));

        setupRealtime();
      } else {
        poll.value = null;
        options.value = [];
      }
    } catch (err) {
      console.error("Failed to fetch poll:", err);
      poll.value = null;
      options.value = [];
    } finally {
      loading.value = false;
    }
  }

  function setupRealtime() {
    if (!poll.value) return;

    if (channel) {
      supabase.removeChannel(channel);
    }

    channel = supabase
      .channel(`poll_votes_${poll.value.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "poll_votes",
          filter: `poll_id=eq.${poll.value.id}`,
        },
        (payload) => {
          const id = payload.new.option_id as string;
          const opt = options.value.find((o) => o.id === id);

          if (opt) {
            opt.votes += 1; // ✅ simplified because votes is now a number
          }
        }
      )
      .subscribe();
  }

  onMounted(fetchPoll);

  onBeforeUnmount(() => {
    if (channel) {
      supabase.removeChannel(channel);
    }
  });

  return {
    poll,
    options,
    loading,
    fetchPoll,
  };
}
