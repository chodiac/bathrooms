# KAMEN & VODA — prodavnica kupatila sa interaktivnim 3D prikazom

Statički sajt (ES moduli, bez bundlera): **3D kupatilo** iz isporučenog modela (`modern_bathroom.glb`) kao ulaz u prodavnicu.
„KAMEN & VODA" je **radni (demo) naziv**; svi proizvodi, cene i specifikacije su **demo podaci** (vidi dole).

## Pokretanje
```bash
python tools/serve.py 5210      # zatim http://localhost:5210/
```
Ruter je hash-based (`#/kategorija/kade`, `#/proizvod/…`, `#/korpa`, `#/naplata`), pa radi na bilo kom statičkom hostingu.
(Dev server ima i `POST /__save` za snimanje renderovanih slika u `assets/` — samo za razvoj.)

## Šta je u modelu (pregled stvarnog GLB-a)
- 16 meshova, **99 087 trouglova**, 15 materijala, 15 PNG tekstura (4096² Structure, 2048²/1024² ostalo). Sketchfab „Modern Bathroom", autor *dylanheyes*, **CC BY 4.0** (kredit je u podnožju).
- Svetlo je **pečeno** u teksture (emissive = difuzna slika; PBR svetla ne postoje). Zato scena radi **bez svetala, senki i tone mapping-a** (unlit) — to je glavni razlog što je lagana.
- Materijali su `KHR_materials_pbrSpecularGlossiness` (three.js r170 ga više ne podržava), pa `tools/build_model.py` pretvara model u laganu unlit varijantu:
  JPEG teksture, samo POSITION+jedan UV skup, deduplikacija temena. Rezultat: `bathroom-hd.glb` 6,5 MB · `bathroom-sd.glb` 3,5 MB · `bathroom-xs.glb` 2,6 MB (isti 99 071 trougao, 13 tekstura).
- Model je „presek" prostora: kraj `z = +3,64` je otvoren, a tanka pregrada tuša je u izvoru crna ploča koja zaklanja pogled. Skripta izbacuje pregradu (16 trouglova), a `js/scene/model.js` dodaje zadnje zidove koji se vide samo iznutra — spoljašnji pogled kroz otvor (početak uvoda) ostaje netaknut.
- Jedinica ≈ 1 m: soba 4,16 × 2,6 × 7,38 m (x −2,08…2,08 · y −1,3…1,3 · z −3,74…3,64).
- Paleta sajta je izvedena iz modela: beton poda `#b7b9b8`, orah `#5b4130`, taupe kamen `#8b7d6a`, mesing `#a88a4f`, šuma `#34584a`, grafit zida `#72746f` (`css/site.css`, `:root`).

## Struktura
```
index.html             ljuska (zaglavlje, hero, fioka, pretraga, panel hotspota)
config/site.js         brend, poslovni podaci (null = [placeholder]), uslovi, tierovi modela, skrol uvod
data/catalog.js        DEMO katalog: kategorije, proizvodi, varijante, cene
data/hotspots.js       mapa: hotspot → 3D tačka/objekat → kategorija/proizvod
data/views.js          pogledi za „Istraži prostor"
data/looks.js          „Kupujte po izgledu": slike + pinovi (projektovani iz 3D)
js/scene/camera.js     koreografija skrol uvoda, granice kamere, sudari, rutiranje između pogleda
js/scene/engine.js     renderer, petlja po potrebi, nivoi kvaliteta, dispose
js/scene/model.js      učitavanje GLB-a, zadnji zidovi, ekspozicija
js/scene/hotspots.js   markeri: projekcija, zaklanjanje, raspored bez preklapanja, reveal
js/scene/explore.js    „Istraži prostor": prevlačenje, zoom, pogledi, tastatura
js/hero.js             poster → 3D, skrol↔kamera, istraživanje, fallback, parkiranje
js/store/cart.js       korpa (localStorage, sinhronizacija između tabova)
js/views/*.js          početna, kategorija, proizvod, korpa/naplata, pretraga/info
tools/                 build_model.py, shots.js (renderovanje slika iz modela), scene.html, serve.py
```

## Kako radi 3D uvod (Nameštaj 034 referenca → kupatilo)
Isti princip kao u projektu *namestaj-034* (pročitani `js/hero.js`, `engine.js`, `quality.js`): pinovan hero (`sticky`, 4 ekrana desktop / 3,4 mobilni), progres `P ∈ [0,1]` iz položaja skrola, prigušena kamera (`damping 0,16`), poster-first, 3D se učitava tek posle `load` + idle, nivoi kvaliteta, pad na poster. Razlike: scena nije sklapanje po progresu nego **putanja kamere** (Catmull-Rom kroz 5 ključnih kadrova) kroz isti prostor.
1. `P 0` — kadar spolja kroz otvoren kraj sobe (soba je pomerena udesno, naslov levo).
2. `P 0,05–0,24` — naslov se povlači nagore i nestaje.
3. `P 0,24–0,8` — kamera ulazi, prolazi uz tuš/WC i staje na unutrašnjem kadru (kada u dnu, lavabo sa ogledalom, WC).
4. `P 0,74–0,98` — hotspotovi se pojavljuju jedan po jedan; `P ≥ 0,8` — traka „Istraži prostor / Pogledaj kolekciju".
5. Posle toga se pin otpušta i nastavlja se početna. Radi u oba smera; „Preskoči uvod" i zaglavlje vode u katalog u svakom trenutku.

## „Istraži prostor"
Odvojen režim (dugme u uvodu, zaglavlju, fioci; ili „Pogledaj u 3D kupatilu" na stranici proizvoda). Skrol stranice je zaključan (`html.is-exploring`), overlay hvata pokazivač. Prevlačenje = razgledanje (ograničeno ±58° levo/desno, +26/−34° gore/dole), točkić/štipanje/`+ −` = približavanje (ograničeno po pogledu), `1–5` = pogledi (Cela soba, Kada, Lavabo, Tuš kabina, WC), `Esc` = izlaz, „Početni pogled" = reset. Kamera ne prolazi kroz zidove, pod, plafon ni predmete (`CAM_BOX` + `BLOCKERS` u `camera.js`); prelazi između pogleda se proveravaju i, ako je direktna linija blokirana, idu preko koridora.

## Hotspotovi
8 markera na stvarnim objektima (mapa u `data/hotspots.js`): 01 Slavine (crna baterija), 02 Tuš kabine (staklena stranica), 03 Kade, 04 Lavaboi, 05 Kupatilski nameštaj (viseći element), 06 Ogledala, 07 Galanterija (dozatori), 08 WC šolje. Nema markera za predmete kojih nema u modelu.
Zaklanjanje: zraka kamera→marker kroz stvarnu geometriju konstrukcije + kutije kade/WC-a/vanitija/tuša; van kadra se skrivaju; markeri bliži od 36 px se ne crtaju oba; oznaka se okreće ulevo blizu desne ivice. Hover/fokus širi marker u „03 — Kade", klik/dodir otvara panel (galerija + kolekcija + 3 proizvoda). Pošto nema **proverenog** proizvoda koji odgovara objektu, svi vode na kolekciju; polje `product` u mapi to omogućava.

## Šta je DEMO i šta treba povezati
| Stavka | Stanje |
|---|---|
| Katalog | `data/catalog.js` — 21 izmišljen proizvod; dimenzije većih elemenata su izvedene iz modela. Zameniti pravim katalogom/API-jem. |
| Fotografije | Renderi iz isporučenog 3D modela (`tools/shots.js`). Pravi proizvodni snimci zamenjuju `assets/img/*.jpg` ili `images` u katalogu. |
| Zalihe/dostupnost | **Nisu dostavljene** — prikazuje se `[nije povezano sa magacinom — demo]`. |
| Poslovni podaci, dostava, povraćaj, garancija, uslovi kupovine | **Nisu dostavljeni** — `config/site.js` (`business`, `policies`), prikazuju se kao `[placeholder]`. |
| Porudžbine i plaćanje | Nema backend-a ni platnog servisa. Naplata validira formu i čuva nacrt u `localStorage` (`kv.orders`), **ništa ne šalje i ne naplaćuje**, i to piše na ekranu. |
| Naziv firme/logo | Radni naziv „KAMEN & VODA"; zameniti u `config/site.js` i `index.html`. |

## Testirano / nije testirano
Vidi `docs/PERF.md` (nalazi, nivoi, merenja i spisak onoga što još treba proveriti na pravom telefonu).
