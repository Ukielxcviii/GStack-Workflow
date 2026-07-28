import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

/**
 * The real authorization check (Proxy at src/proxy.ts is optimistic-only).
 * Every admin data-access function and page must call this first — per the
 * design doc's DAL pattern, a missed call degrades safely (redirect) instead
 * of a breach, with RLS's is_admin() as the backstop either way.
 *
 * A non-admin authenticated user (none exist in v1, but the schema allows it
 * in principle) gets zero rows back from profiles here — that table's own
 * RLS policy is is_admin()-gated — so it's treated identically to "not
 * logged in."
 */
export const requireAdmin = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/admin/login");
  }

  return { user, supabase };
});
