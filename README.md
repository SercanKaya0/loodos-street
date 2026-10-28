# Loodos Street

Loodos'un müşteri projelerini izometrik bir sokakta gezdiren etkileşimli harita. Her dükkân bir müşteri; tıklayınca projenin hikâyesi, rakamları, teknolojileri ve kullanılan Loodos ürünleri açılır.

- Veri: playground.loodos.com katalog JSON'larından `tools/gen.py` ile üretilir (`js/data.js` Türkçe, `js/data.en.js` İngilizce).
- Dil: sağ üstteki TR/EN düğmesi ya da `?lang=en`. Arayüz metinleri `js/i18n.js`'te.
- Görünüm: Otomatik (saate göre gündüz/gece), Gündüz, Gece ve Gün döngüsü (24 saat 2 dakikada). Gece lambalar, vitrinler, pencereler ve farlar yanar.
- Araçlar: her kamyon/panelvan bir Loodos ürünü taşır ve yalnızca o ürünü kullanan dükkânlara teslimat yapar.
- Sunum modu: sağ alttaki ekran düğmesi ya da `#sunum`. Merkez → mahalleler → dükkânlar sırayla gezilir; ← → ileri/geri, boşluk duraklat, Esc bitir.
- Şehir: etrafında ray halkası ve istasyonda duran iki Loodos Express treni, Havacılık mahallesinin arkasındaki piste inip kalkan SunExpress uçakları (tıklanınca SunExpress açılır), tepesinde Loodos bayrağı olan elektrik direkleri, Brific Crimson/Bianco/Marine scooter'ları.
- Hava: tema menüsünden Mevsime göre / Açık / Yağmur / Kar. Mevsim modu her ay için yağmur ve kar olasılığını kullanır; hava 3 saatlik dilimlerle değişir. Kar yağdıkça çatılar ve ağaçlar beyazlar, sağanakta şimşek çakar.
- Bug ambulansı: ara sıra kısık sirenle bir dükkâna gider, hatayı yerinde çözer; panelde görev adımları ve oturumluk bug hesabı (1 sn = 1 dk). Siren sağdaki hoparlör düğmesiyle kapatılır.
- Sahne: Three.js r160 (`vendor/three`, CDN'siz). WebGL yoksa liste görünümüne düşer.
- Paylaşılabilir linkler: `#a101`, `#mahalle/fnb`, `#merkez`, `#sunum`.

Veriyi yenilemek için katalog JSON'larını (`solutions.json`, `company.json`, `products.json`) bir klasöre indirip:

```
python3 -I tools/gen.py <json-klasörü> .
```

Yerelde çalıştırmak için:

```
python3 -m http.server 8765
```
