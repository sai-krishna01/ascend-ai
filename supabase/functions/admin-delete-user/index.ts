// Lovable Cloud backend function: admin-delete-user
// Deletes an auth user + associated public data. Only callable by admin/founder.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type JsonResponseInit = Omit<ResponseInit, "headers"> & { headers?: Record<string, string> };

function json(data: unknown, init: JsonResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

function getEnv(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const requestId = crypto.randomUUID();

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const SUPABASE_URL = getEnv("SUPABASE_URL");
    const SUPABASE_ANON_KEY = getEnv("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY");

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      console.error("admin-delete-user unauthorized", { requestId, claimsError });
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const requesterId = claimsData.claims.sub;

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data: requesterRoles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requesterId);

    if (rolesError) {
      console.error("admin-delete-user roles lookup failed", { requestId, rolesError });
      return json({ error: "Authorization lookup failed" }, { status: 500 });
    }

    const isAdmin = (requesterRoles ?? []).some((r) => r.role === "admin" || r.role === "founder");
    if (!isAdmin) return json({ error: "Forbidden" }, { status: 403 });

    const body = (await req.json().catch(() => null)) as { userId?: string } | null;
    const userId = body?.userId?.trim();

    if (!userId) return json({ error: "Missing userId" }, { status: 400 });
    if (userId === requesterId) {
      return json(
        { error: "Refusing to delete the currently signed-in admin user." },
        { status: 400 },
      );
    }

    console.log("admin-delete-user start", { requestId, requesterId, userId });

    // --- Delete data that references the user ---

    // 1) Delete groups created by the user (and their dependent data)
    const { data: ownedGroups, error: ownedGroupsError } = await supabaseAdmin
      .from("group_chats")
      .select("id")
      .eq("created_by", userId);

    if (ownedGroupsError) throw ownedGroupsError;

    const ownedGroupIds = (ownedGroups ?? []).map((g) => g.id).filter(Boolean);

    if (ownedGroupIds.length > 0) {
      const { error: delOwnedMsgsErr } = await supabaseAdmin
        .from("group_chat_messages")
        .delete()
        .in("group_id", ownedGroupIds);
      if (delOwnedMsgsErr) throw delOwnedMsgsErr;

      const { error: delOwnedMembersErr } = await supabaseAdmin
        .from("group_chat_members")
        .delete()
        .in("group_id", ownedGroupIds);
      if (delOwnedMembersErr) throw delOwnedMembersErr;

      const { error: delOwnedGroupsErr } = await supabaseAdmin
        .from("group_chats")
        .delete()
        .in("id", ownedGroupIds);
      if (delOwnedGroupsErr) throw delOwnedGroupsErr;
    }

    // 2) Delete the user's group memberships and messages elsewhere
    {
      const { error } = await supabaseAdmin.from("group_chat_members").delete().eq("user_id", userId);
      if (error) throw error;
    }

    {
      const { error } = await supabaseAdmin.from("group_chat_messages").delete().eq("user_id", userId);
      if (error) throw error;
    }

    // 3) Delete chat sessions and their messages
    const { data: sessionRows, error: sessionsError } = await supabaseAdmin
      .from("chat_sessions")
      .select("id")
      .eq("user_id", userId);

    if (sessionsError) throw sessionsError;

    const sessionIds = (sessionRows ?? []).map((s) => s.id).filter(Boolean);
    if (sessionIds.length > 0) {
      const { error: delChatMsgsErr } = await supabaseAdmin
        .from("chat_messages")
        .delete()
        .in("session_id", sessionIds);
      if (delChatMsgsErr) throw delChatMsgsErr;
    }

    {
      const { error } = await supabaseAdmin.from("chat_sessions").delete().eq("user_id", userId);
      if (error) throw error;
    }

    // 4) Delete other user-scoped tables
    const deletions: Array<Promise<{ error: unknown }>> = [
      supabaseAdmin.from("ai_interactions").delete().eq("user_id", userId),
      supabaseAdmin.from("learning_progress").delete().eq("user_id", userId),
      supabaseAdmin.from("study_resources").delete().eq("uploaded_by", userId),
      supabaseAdmin.from("shared_notes").delete().eq("created_by", userId),
      supabaseAdmin.from("user_subscriptions").delete().eq("user_id", userId),
      supabaseAdmin.from("contact_messages").delete().eq("user_id", userId),
      supabaseAdmin.from("user_roles").delete().eq("user_id", userId),
      supabaseAdmin.from("profiles").delete().eq("user_id", userId),
    ].map(async (p) => {
      const { error } = await p;
      return { error };
    });

    const delResults = await Promise.all(deletions);
    const delError = delResults.find((r) => r.error)?.error as any;
    if (delError) throw delError;

    // 5) Delete the auth user (permanent)
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authDeleteError) throw authDeleteError;

    // Verify: profile row should be gone, and auth user should be gone.
    const { data: remainingProfile, error: remainingProfileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (remainingProfileError) throw remainingProfileError;
    if (remainingProfile) {
      return json(
        { error: "Deletion incomplete (profile still exists)", requestId },
        { status: 500 },
      );
    }

    const { data: remainingAuthUser, error: remainingAuthUserError } = await supabaseAdmin.auth.admin.getUserById(userId);

    // If the SDK reports user not found, it may come as an error; treat either 'null user' or an error containing 'not found' as ok.
    if (remainingAuthUserError) {
      const msg = String((remainingAuthUserError as any)?.message ?? remainingAuthUserError);
      const okNotFound = msg.toLowerCase().includes("not") && msg.toLowerCase().includes("found");
      if (!okNotFound) throw remainingAuthUserError;
    } else if (remainingAuthUser?.user) {
      return json(
        { error: "Deletion incomplete (auth user still exists)", requestId },
        { status: 500 },
      );
    }

    console.log("admin-delete-user success", { requestId, userId });
    return json({ ok: true, deletedUserId: userId, requestId });
  } catch (error) {
    console.error("admin-delete-user failed", { requestId, error });
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message, requestId }, { status: 500 });
  }
});
