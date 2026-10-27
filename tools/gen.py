import json, sys, os, base64, re, unicodedata
src, root = sys.argv[1], sys.argv[2]
L = lambda name: json.load(open(os.path.join(src, name + ".json"), encoding="utf-8"))
sol, comp, prod = L("solutions"), L("company"), L("products")

def tr(v):
    if isinstance(v, dict): return v.get("tr") or v.get("en")
    if isinstance(v, list) and v and isinstance(v[0], str): return v[0]
    return v

LOGOS = {"A101": "a101.svg", "AlışGidiş": "alis_gidis.svg", "Brific": "brific.svg", "Frink": "frink.svg",
         "Yıldız Holding": "igoya.webp", "Kahve Dünyası": "kd.svg", "LC Waikiki": "lcw.png",
         "SunExpress": "sun_express.svg", "Vodafone": "vodafone.svg", "Zorlu Enerji": "zorlu.png"}
MIME = {".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp"}

def logo_uri(company):
    f = LOGOS.get(company)
    if not f: return None
    raw = open(os.path.join(root, "assets/logos", f), "rb").read()
    return "data:%s;base64,%s" % (MIME[os.path.splitext(f)[1]], base64.b64encode(raw).decode())

def case_key(ref):
    app = tr(ref.get("app")) or ""
    if ref["c"] == "SunExpress" and app == "Sesli asistan": return "SunExpress Voice"
    return (ref["c"] + " " + app).strip()

companies, order = {}, []
for sec in sol["sectors"]:
    for ref in sec["refs"]:
        key = case_key(ref)
        cs = sol["cases"].get(key, {})
        c = ref["c"]
        if c not in companies:
            companies[c] = {"id": re.sub(r"[^a-z0-9]+", "-", unicodedata.normalize("NFKD", c.replace("ı", "i").replace("İ", "I")).encode("ascii", "ignore").decode().lower()).strip("-"),
                            "name": c, "sector": sec["id"], "logo": logo_uri(c), "projects": []}
            order.append(c)
        img = sol["images"].get(key)
        companies[c]["projects"].append({
            "key": key, "app": tr(ref.get("app")) or "", "sub": tr(ref.get("sub")), "d": tr(ref.get("d")),
            "metrics": [[m[0], tr(m[3])] for m in ref.get("m", [])],
            "when": tr(cs.get("when")), "ctx": tr(cs.get("ctx")), "need": tr(cs.get("need")),
            "approach": tr(cs.get("approach")),
            "features": [[tr(f["h"]), tr(f["d"])] for f in cs.get("features", [])],
            "tech": [t.strip() for t in (tr(cs.get("tech")) or "").split("·") if t.strip()],
            "prods": [{"id": pid, "built": [tr(b) for b in p.get("built", [])], "mods": [tr(m) for m in p.get("mods", [])]}
                      for pid, p in (cs.get("prods") or {}).items()],
            "img": ("assets/cases/%s.webp" % img) if img else None,
            "pdf": (cs.get("pdf") or {}).get("tr"),
        })

out = {
    "sectors": [{"id": s["id"], "name": tr(s["name"]), "color": s["color"], "intro": tr(s["intro"])} for s in sol["sectors"]],
    "companies": [companies[c] for c in order],
    "products": sorted([{"id": p["id"], "name": p["name"], "stage": p["stage"], "mono": p["mono"], "cat": tr(p["cat"]),
                         "promise": tr(p["promise"]), "slogan": p.get("slogan") or ""} for p in prod["products"]],
                       key=lambda p: p["stage"]),
    "kpis": [[n[0], tr(n[3])] for n in comp["num"]],
    "timeline": [[y, tr(d)] for y, d in comp["tl"]],
}
with open(os.path.join(root, "js/data.js"), "w", encoding="utf-8") as f:
    f.write("/* Loodos Street verisi: playground.loodos.com katalog JSON'larından üretildi (tools/gen.py). */\n")
    f.write("window.STREET = " + json.dumps(out, ensure_ascii=False, indent=1) + ";\n")
print(len(out["companies"]), "şirket,", sum(len(c["projects"]) for c in out["companies"]), "proje")
for c in out["companies"]: print(" ", c["id"], c["sector"], len(c["projects"]), "logo" if c["logo"] else "-", [p["img"] is not None for p in c["projects"]])
