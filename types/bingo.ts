import type { StringOrVNode } from "@nuxt/ui";
import type { Database } from "./supabase";

type BingoCardType = Database["public"]["Tables"]["bingo_cards"]["Row"] & {
  username?: string;
};

export type BingoCardGrid = {
  numbers: number[][];
  marked: boolean[][];
};

export type _BingoCardType = Omit<BingoCardType, "grid"> & {
  grid: BingoCardGrid;
};
