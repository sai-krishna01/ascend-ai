// Lovable Cloud backend function: group-chat-ops
// Handles privileged group operations that require bypassing RLS (e.g. deleting a group with all dependent rows).

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

type Body =
  | { action: "delete_group"; groupId: string }
  | { action: "add_member"; groupId: string; userId: string; role?: "admin" | "moderator" | "member" }
  | { action: "remove_member"; groupId: string; userId: string };

async function isSiteAdmin(supabaseAdmin: any, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw error;

  return ((data ?? []) as Array<{ role: string }>).some(
    (r) => r.role === "admin" || r.role === "founder",
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const requestId = crypto.randomUUID();

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, { status: 401 });

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
      console.error("group-chat-ops unauthorized", { requestId, claimsError });
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const requesterId = claimsData.claims.sub;
    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body || !(body as any).action) return json({ error: "Missing action" }, { status: 400 });

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const siteAdmin = await isSiteAdmin(supabaseAdmin, requesterId);

    const groupId = (body as any).groupId?.trim();
    if (!groupId) return json({ error: "Missing groupId" }, { status: 400 });

    const { data: group, error: groupError } = await supabaseAdmin
      .from("group_chats")
      .select("id, created_by")
      .eq("id", groupId)
      .maybeSingle();

    if (groupError) throw groupError;
    if (!group) return json({ error: "Group not found" }, { status: 404 });

    const isCreator = group.created_by === requesterId;

    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("group_chat_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", requesterId)
      .maybeSingle();

    if (membershipError) throw membershipError;

    const isGroupAdmin = membership?.role === "admin";
    const canManage = siteAdmin || isCreator || isGroupAdmin;

    if (!canManage) return json({ error: "Forbidden" }, { status: 403 });

    console.log("group-chat-ops", { requestId, requesterId, action: (body as any).action, groupId });

    if (body.action === "delete_group") {
      // Delete dependents first, then the group.
      const { error: delMsgsErr } = await supabaseAdmin
        .from("group_chat_messages")
        .delete()
        .eq("group_id", groupId);
      if (delMsgsErr) throw delMsgsErr;

      const { error: delMembersErr } = await supabaseAdmin
        .from("group_chat_members")
        .delete()
        .eq("group_id", groupId);
      if (delMembersErr) throw delMembersErr;

      const { error: delGroupErr } = await supabaseAdmin.from("group_chats").delete().eq("id", groupId);
      if (delGroupErr) throw delGroupErr;

      // Verify it is gone
      const { data: stillThere, error: stillThereError } = await supabaseAdmin
        .from("group_chats")
        .select("id")
        .eq("id", groupId)
        .maybeSingle();

      if (stillThereError) throw stillThereError;
      if (stillThere) return json({ error: "Deletion incomplete (group still exists)", requestId }, { status: 500 });

      return json({ ok: true, action: "delete_group", groupId, requestId });
    }

    if (body.action === "add_member") {
      const userId = body.userId?.trim();
      if (!userId) return json({ error: "Missing userId" }, { status: 400 });

      const role = body.role ?? "member";

      // Insert membership (idempotent)
      const { error } = await supabaseAdmin.from("group_chat_members").insert({
        group_id: groupId,
        user_id: userId,
        role,
      });

      // Unique violation -> already exists
      if (error && (error as any).code !== "23505") throw error;

      return json({ ok: true, action: "add_member", groupId, userId, role, requestId });
    }

    if (body.action === "remove_member") {
      const userId = body.userId?.trim();
      if (!userId) return json({ error: "Missing userId" }, { status: 400 });

      const { error } = await supabaseAdmin
        .from("group_chat_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", userId);
      if (error) throw error;

      return json({ ok: true, action: "remove_member", groupId, userId, requestId });
    }

    return json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("group-chat-ops failed", { requestId, error });
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message, requestId }, { status: 500 });
  }
});
