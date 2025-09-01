import type { Database, TablesInsert } from "~/types/supabase";

type GameRow = Database["public"]["Tables"]["games"]["Row"];
type GameStatus = Database["public"]["Enums"]["game_status"];

export const useTrivia = () => {
  const supabase = useSupabaseClient<Database>();
  const user = useSupabaseUser();
  const { profile } = useProfile();

  // 🔑 state persisted across navigations
  const games = useState<GameRow[]>("games", () => []);
  const loading = useState<boolean>("games-loading", () => true);
  const creating = useState<boolean>("game-creating", () => false);
  const message = useState<string>("game-message", () => "");

  // ✅ one-time fetch into state
  const { refresh } = useAsyncData(
    "games-fetch",
    async () => {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching games:", error.message);
        return [];
      }
      console.log();
      return data as GameRow[];
    },
    {
      immediate: true, // fetch right away
      transform: (data) => {
        games.value = data;
        loading.value = false;
        return data;
      },
    }
  );

  // ✅ central computed (role-based view)
  const visibleGames = computed(() => {
    if (!profile.value) return [];
    if (profile.value.role === "admin") return games.value ?? [];
    return (games.value ?? []).filter(
      (g) => g.status?.toLowerCase().trim() === "live"
    );
  });

  // --- actions ---
  const createGame = async (title: string): Promise<void> => {
    if (!title.trim() || !user.value) return;
    creating.value = true;

    const payload: TablesInsert<"games"> = {
      title: title.trim(),
      host_user_id: user.value.id,
      created_by: user.value.id,
      status: "lobby" as GameStatus,
    };

    const { data, error } = await supabase
      .from("games")
      .insert(payload)
      .select()
      .single();

    creating.value = false;

    if (error) {
      console.error("Error creating game:", error.message);
      message.value = "Error creating game";
    } else if (data) {
      games.value = [data, ...games.value]; // update state directly
      message.value = "Game created!";
    }
  };

  const startGame = async (id: GameRow["id"]): Promise<void> => {
    try {
      await $fetch(`/api/games/${id}/start`, { method: "POST" });
      games.value = games.value.map((g) =>
        g.id === id ? { ...g, status: "live" as GameStatus } : g
      );
    } catch (err) {
      console.error("Failed to start game:", err);
      message.value = "Error starting game";
    }
  };

  //   const endGame = async (id: GameRow["id"]): Promise<void> => {
  //     try {
  //       await $fetch(`/api/games/${id}/end`, { method: "POST" });
  //       games.value = games.value.map((g) =>
  //         g.id === id ? { ...g, status: "ended" as GameStatus } : g
  //       );
  //     } catch (err) {
  //       console.error("Failed to end game:", err);
  //       message.value = "Error ending game";
  //     }
  //   };

  const joinGame = async (id: GameRow["id"]): Promise<void> => {
    try {
      await $fetch(`/api/games/${id}/join`, { method: "POST" });
      navigateTo(`/play/${id}`);
    } catch (err) {
      console.error("Failed to join game:", err);
      message.value = "Error joining game";
    }
  };

  return {
    games,
    visibleGames,
    loading,
    creating,
    message,
    refreshGames: refresh, // expose manual refresh if needed
    createGame,
    startGame,
    // endGame,
    joinGame,
  };
};
