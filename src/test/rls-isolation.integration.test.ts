// @vitest-environment node
/**
 * Cross-user isolation test against the REAL Lovable Cloud database.
 * Creates two throwaway confirmed test users (admin API, sandbox-only env),
 * signs in as each with the public browser key, and checks that neither can
 * read, modify or delete the other's rows, and that nobody can read
 * provider_credentials. Cleans up afterwards. Skips when env is absent.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env["SUPABASE_URL"];
const PUB = process.env["SUPABASE_PUBLISHABLE_KEY"];
const SERVICE = process.env["SUPABASE_SERVICE_ROLE_KEY"];
const enabled = Boolean(URL && PUB && SERVICE && process.env["RUN_DB_TESTS"] === "1");

function shimFetch(key: string): typeof fetch {
  return (input, init) => {
    const h = new Headers(init?.headers);
    if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
    h.set("apikey", key);
    return fetch(input, { ...init, headers: h });
  };
}
const opts = (key: string) => ({
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: shimFetch(key) },
});

const TABLES = ["conversations", "tasks", "memory_entries", "provider_configs", "creations", "assets", "render_jobs", "usage_events"] as const;

describe.skipIf(!enabled)("cross-user isolation (real database)", () => {
  let admin: SupabaseClient;
  let a: SupabaseClient;
  let b: SupabaseClient;
  const users: { id: string; email: string }[] = [];
  const rowsA: Record<string, string> = {};
  const row = (t: string): string => rowsA[t] ?? "";
  const uidA = (): string => users[0]?.id ?? "";
  let credIdA = "";

  beforeAll(async () => {
    admin = createClient(URL!, SERVICE!, opts(SERVICE!));
    const stamp = Date.now();
    for (const tag of ["a", "b"]) {
      const email = `rls-test-${tag}-${stamp}@example.test`;
      const password = `T3st-${crypto.randomUUID()}`;
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error) throw error;
      users.push({ id: data.user.id, email });
      const c = createClient(URL!, PUB!, opts(PUB!));
      const { error: se } = await c.auth.signInWithPassword({ email, password });
      if (se) throw se;
      if (tag === "a") a = c;
      else b = c;
    }
    const uid = uidA();
    const conv = await a.from("conversations").insert({ title: "A private" }).select().single();
    if (conv.error) throw conv.error;
    rowsA["conversations"] = conv.data.id;
    const msg = await a.from("messages").insert({ conversation_id: conv.data.id, role: "user", content: "secret A" }).select().single();
    if (msg.error) throw msg.error;
    rowsA["messages"] = msg.data.id;
    const inserts: Record<string, Record<string, unknown>> = {
      tasks: { title: "A task" },
      memory_entries: { content: "A memory" },
      provider_configs: { provider: "openai", key_hint: "sk-…0000" },
      creations: { kind: "image", name: "A image" },
      render_jobs: { worker: "remotion" },
      usage_events: { kind: "chat", status: "ok" },
    };
    for (const [t, rowData] of Object.entries(inserts)) {
      const r = await a.from(t).insert(rowData).select().single();
      if (r.error) throw new Error(`${t}: ${r.error.message}`);
      rowsA[t] = r.data.id;
    }
    const asset = await a.from("assets").insert({ storage_path: `${uid}/x.png`, filename: "x.png", mime_type: "image/png" }).select().single();
    if (asset.error) throw asset.error;
    rowsA["assets"] = asset.data.id;
    // Credential row can only be written server-side.
    const cred = await admin
      .from("provider_credentials")
      .insert({ user_id: uid, provider_config_id: row("provider_configs"), ciphertext: "ZmFrZQ==", iv: "ZmFrZQ==" })
      .select()
      .single();
    if (cred.error) throw cred.error;
    credIdA = cred.data.id;
    const up = await a.storage.from("assets").upload(`${uid}/private.txt`, new Blob(["A only"]), { contentType: "text/plain" });
    if (up.error) throw up.error;
  }, 60_000);

  afterAll(async () => {
    if (!admin) return;
    if (users[0]) await admin.storage.from("assets").remove([`${uidA()}/private.txt`]);
    for (const t of [...TABLES, "messages", "provider_credentials"]) {
      await admin.from(t).delete().in("user_id", users.map((u) => u.id));
    }
    await admin.from("profiles").delete().in("id", users.map((u) => u.id));
    for (const u of users) await admin.auth.admin.deleteUser(u.id);
  }, 60_000);

  it("owner can read own rows", async () => {
    for (const t of [...TABLES, "messages"]) {
      const r = await a.from(t).select("id").eq("id", row(t));
      expect(r.error, t).toBeNull();
      expect(r.data, t).toHaveLength(1);
    }
  });

  for (const t of [...TABLES, "messages"] as const) {
    it(`B cannot read, update or delete A's ${t}`, async () => {
      const read = await b.from(t).select("*").eq("id", row(t));
      expect(read.data ?? []).toHaveLength(0);
      const all = await b.from(t).select("id");
      expect((all.data ?? []).map((r: { id: string }) => r.id)).not.toContain(row(t));
      const upd = await b.from(t).update({ created_at: new Date(0).toISOString() }).eq("id", row(t)).select();
      expect(upd.data ?? []).toHaveLength(0);
      const del = await b.from(t).delete().eq("id", row(t)).select();
      expect(del.data ?? []).toHaveLength(0);
      const still = await a.from(t).select("id").eq("id", row(t));
      expect(still.data).toHaveLength(1);
    });
  }

  it("B cannot insert rows owned by A", async () => {
    const r = await b.from("tasks").insert({ title: "spoof", user_id: uidA() });
    expect(r.error).not.toBeNull();
  });

  it("B cannot add a message to A's conversation", async () => {
    const r = await b.from("messages").insert({ conversation_id: row("conversations"), role: "user", content: "x" });
    expect(r.error).not.toBeNull();
  });

  it("B cannot read A's profile", async () => {
    const r = await b.from("profiles").select("*").eq("id", uidA());
    expect(r.data ?? []).toHaveLength(0);
  });

  it("no browser session can read provider_credentials, not even the owner", async () => {
    for (const c of [a, b]) {
      const r = await c.from("provider_credentials").select("*");
      expect(r.error).not.toBeNull();
      expect(r.data).toBeNull();
    }
    const anon = createClient(URL!, PUB!, opts(PUB!));
    const r = await anon.from("provider_credentials").select("*");
    expect(r.data).toBeNull();
    expect(credIdA).not.toBe("");
  });

  it("anonymous visitors see no user data", async () => {
    const anon = createClient(URL!, PUB!, opts(PUB!));
    for (const t of [...TABLES, "messages", "profiles"]) {
      const r = await anon.from(t).select("id");
      expect(r.data ?? [], t).toHaveLength(0);
    }
  });

  it("storage: B cannot download or sign A's file; A can", async () => {
    const path = `${uidA()}/private.txt`;
    const bd = await b.storage.from("assets").download(path);
    expect(bd.data).toBeNull();
    const bs = await b.storage.from("assets").createSignedUrl(path, 60);
    expect(bs.data).toBeNull();
    const bu = await b.storage.from("assets").upload(path, new Blob(["overwrite"]), { upsert: true });
    expect(bu.error).not.toBeNull();
    const ad = await a.storage.from("assets").download(path);
    expect(await ad.data?.text()).toBe("A only");
  });
});
