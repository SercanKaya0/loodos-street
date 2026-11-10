# Loodos WorkCity (`/live/`)

Çalışanın Jira ve GitHub işlerinin canlı aktığı gerçekçi 3D şehir. Sokakta yalnızca çalışanın adı var:
cadde tabelaları, yola boyanmış cadde adı ve ofis binasının tepesi.

| Yer | Neyi gösterir |
| --- | --- |
| **Jira Kulesi** | Köşedeki mavi ışıklar açık işleri sayar; yeni atanan iş çatıdaki dronla meydana iner |
| **Kanban Meydanı** | Her iş bir kasa: Yapılacak / Sürüyor / İncelemede / Tamamlandı. Kasaya tıkla, şeridini değiştir |
| **Ofisin** | Son 7 günde biten her iş binaya bir kat ekler |
| **İnceleme kutusu** | Senden istenen her review bir zarf olarak üstünde döner |
| **GitHub + Actions fabrikası** | Açık PR'lar; bacadaki duman son PR'ın CI durumu (beyaz yeşil, sarı çalışıyor, kızıl kırık) |

Ayrıca gerçek saate göre güneş/akşam/gece, 25 dakikalık **Odak** modu (bildirimler bekletilir),
günlük hedef halkası ve seri (streak) sayacı var.

## Veri: Loodos Hub

WorkCity, Loodos Hub'ın **WorkCity** sekmesinde açılır. Hub sayfaya dar bir köprü (`window.loodosHub`) verir:
Jira, GitHub, Actions, release ve sertifika verisini Hub kendi hesaplarıyla okur, buraya yalnızca özet
(anahtar, başlık, durum, link) gönderir. Token sayfaya hiç gelmez; tarayıcıda saklanmaz.

- `loodosHub.onState(cb)`: `{ me, items, reviews, ci, runs, releases, latestRelease, certWarning }`
- `loodosHub.move(key, to)`: kasayı başka şeride taşımak Jira'da durum geçişi yapar
- `loodosHub.refresh()`

Hub dışında (GitHub Pages) şehir demo verisiyle canlı akar.
