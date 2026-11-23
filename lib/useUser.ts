"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabaseBrowser } from "./supabase";

export type Me = { user: User; nickname: string; isAdmin: boolean } | null;

export function useUser() {
  const [me, setMe] = useState<Me>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = supabaseBrowser();
    async function load(user: User | null) {
      if (!user) {
        setMe(null);
        setLoading(false);
        return;
      }
      const { data } = await sb.from("profiles").select("nickname,is_admin").eq("id", user.id).single();
      setMe({ user, nickname: data?.nickname ?? "회원", isAdmin: !!data?.is_admin });
      setLoading(false);
    }
    sb.auth.getSession().then(({ data }) => load(data.session?.user ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      load(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { me, loading };
}
