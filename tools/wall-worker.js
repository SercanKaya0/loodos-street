/* Azerbaycan sayfasının ortak tebrik duvarı: Cloudflare Worker + KV.
   Yayın: wrangler kv namespace create WALL  →  wrangler.toml'a binding ekle  →  wrangler deploy
   Sonra js/main.js'teki WALL.url'e worker adresini yaz. GET son 100 mesajı, POST { name, text } bir mesaj ekler. */
const ORIGINS = ["https://sercankaya0.github.io", "http://127.0.0.1:8765"];
export default {
  async fetch(req, env) {
    const origin = req.headers.get("origin") || "";
    const cors = { "access-control-allow-origin": ORIGINS.includes(origin) ? origin : ORIGINS[0], "access-control-allow-methods": "GET, POST", "access-control-allow-headers": "content-type" };
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });
    const list = JSON.parse((await env.WALL.get("msgs")) || "[]");
    if (req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      const name = String(b.name || "").trim().slice(0, 24), text = String(b.text || "").trim().slice(0, 90);
      if (!name || !text) return new Response("bad request", { status: 400, headers: cors });
      list.unshift({ name, text, at: Date.now() });
      await env.WALL.put("msgs", JSON.stringify(list.slice(0, 100)));
    }
    return Response.json(list, { headers: cors });
  },
};
