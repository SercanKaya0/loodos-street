# Loodos Street

Loodos'un müşteri projelerini izometrik bir sokakta gezdiren etkileşimli harita. Her dükkân bir müşteri; tıklayınca projenin hikâyesi, rakamları, teknolojileri ve kullanılan Loodos ürünleri açılır.

- Veri: playground.loodos.com katalog JSON'larından `tools/gen.py` ile üretilir (`js/data.js`).
- Sahne: Three.js r160 (`vendor/three`, CDN'siz). WebGL yoksa liste görünümüne düşer.
- Paylaşılabilir linkler: `#a101`, `#mahalle/fnb`, `#merkez`.

Yerelde çalıştırmak için:

```
python3 -m http.server 8765
```
