import { supabaseServer } from "./supabase";
import type { Board } from "./types";

export async function getBoards(): Promise<Board[]> {
  const { data } = await supabaseServer().from("boards").select("*").order("sort");
  return (data as Board[]) ?? [];
}
