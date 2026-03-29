/**
 * Lightweight Supabase REST client — no SDK needed.
 *
 * FIX #3 — DEFENSIVE INITIALIZATION
 * - Validates url/key before any fetch
 * - Throws descriptive errors instead of opaque "Failed to fetch"
 * - from() chain is always safe to construct (crashes only on execute)
 */
export class SupabaseClient {
  constructor(url, key) {
    if (!url || !key) {
      throw new Error(
        "SupabaseClient: url and key are required. " +
        "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
    }
    // Validate URL format
    try {
      new URL(url);
    } catch {
      throw new Error(`SupabaseClient: invalid URL "${url}".`);
    }
    this.url = url.replace(/\/$/, "");
    this.key = key;
    this.headers = {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };
  }

  async query(table, { method = "GET", filters = "", body = null, select = "*", order = "" } = {}) {
    let endpoint = `${this.url}/rest/v1/${table}?select=${encodeURIComponent(select)}`;
    if (filters) endpoint += `&${filters}`;
    if (order) endpoint += `&order=${order}`;
    const opts = { method, headers: { ...this.headers } };
    if (body) opts.body = JSON.stringify(body);
    if (method === "DELETE") opts.headers.Prefer = "";

    let res;
    try {
      res = await fetch(endpoint, opts);
    } catch (networkErr) {
      throw new Error(
        `Supabase ${method} ${table}: Network error – ${networkErr.message}. ` +
        `Check that the URL "${this.url}" is reachable.`
      );
    }

    if (!res.ok) {
      const err = await res.text().catch(() => "Unknown error");
      throw new Error(`Supabase ${method} ${table}: ${res.status} – ${err}`);
    }
    if (method === "DELETE") return [];
    return res.json();
  }

  from(table) {
    const self = this;
    let _filters = [];
    let _select = "*";
    let _order = "";
    return {
      select(s) { _select = s; return this; },
      eq(col, val) { _filters.push(`${col}=eq.${val}`); return this; },
      order(col, { ascending = true } = {}) { _order = `${col}.${ascending ? "asc" : "desc"}`; return this; },
      async execute() {
        return self.query(table, { filters: _filters.join("&"), select: _select, order: _order });
      },
      async insert(data) {
        return self.query(table, { method: "POST", body: Array.isArray(data) ? data : [data] });
      },
      async update(data) {
        return self.query(table, { method: "PATCH", filters: _filters.join("&"), body: data });
      },
      async delete() {
        return self.query(table, { method: "DELETE", filters: _filters.join("&") });
      },
    };
  }
}
