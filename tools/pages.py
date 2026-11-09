"""Tema sayfalarını index.html'den üretir (ör. portugal/index.html).

Her tema kendi klasöründe index.html'in bir kopyasıdır: <base href="../"> ile varlıklar kökten yüklenir,
<meta name="street-theme"> js/main.js'e hangi süslemenin açılacağını söyler. index.html değiştikçe yeniden çalıştır:

    python3 -I tools/pages.py
"""
import os
import re
import sys

ROOT = sys.argv[1] if len(sys.argv) > 1 else "."
THEMES = [("portugal", "pt", "Loodos Street · Portugal")]

src = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
for folder, theme, title in THEMES:
    html = src.replace("<head>", '<head>\n  <base href="../">\n  <meta name="street-theme" content="%s">' % theme, 1)
    html = re.sub(r"<title>.*?</title>", "<title>%s</title>" % title, html, count=1)
    os.makedirs(os.path.join(ROOT, folder), exist_ok=True)
    with open(os.path.join(ROOT, folder, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)
    print("yazıldı:", os.path.join(folder, "index.html"))
