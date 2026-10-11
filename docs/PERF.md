# Performanse 3D scene — nalazi, mere, nivoi, provera

## Šta je u modelu i šta bi bilo skupo
| Stavka | Izvorni GLB | Posle `tools/build_model.py` |
|---|---|---|
| Trouglovi | 99 087 (Plant 47 k, Bath 22 k, Shower 13 k, Toilet 6 k, ostalo malo) | 99 071 |
| Mesh-eva / draw call-ova | 16 / 16 | 16 + 2 zida = 18 |
| Materijali | 15 PBR spec-gloss (emissive = diffuse + difuzno osvetljenje) | 13 unlit (`MeshBasicMaterial`) |
| Teksture | 4096² (Structure) + 2048²×8 + 1024²×6 PNG ≈ 53 MB fajl | JPEG: hd 6,5 MB · sd 3,5 MB · xs 2,6 MB |
| GPU memorija tekstura (procena sa mipmapama) | ≈ 270 MB | hd ≈ 270 MB · sd ≈ 85 MB · xs ≈ 40 MB |
| Svetla / senke / post-processing | 0 / 0 / 0 (pečeno) | 0 / 0 / 0 |
| Dodatni atributi | NORMAL, TANGENT, 3 UV skupa | samo POSITION + 1 UV |

Najveći troškovi bili bi: veličina tekstura na telefonu (rešeno nivoima), broj piksela (granica po nivou) i 47 k trouglova biljke (zanemarljivo uz 1 draw call). Pošto je scena pečena, nema troška svetla ni senki.

## Nivoi (`js/scene/quality.js`)
| Nivo | Početak | Model | DPR / maks. px | AA | FPS limit |
|---|---|---|---|---|---|
| high | ≥ 8 GB i ≥ 8 jezgara | hd (4096/2048) | 2 / 4,2 MP | da | — |
| mid | standardni računar | sd (2048/1024) | 1,5 / 2,0 MP | da | — |
| low | svaki telefon, slab računar | xs (2048/512) | 1 / 0,9 MP | ne | 30 tokom animacije |
| poster | ušteda podataka, 2G/3G, telefon ≤ 2 GB ili ≤ 2 jezgra, softverski GL, `?motion=reduce`, prespor probni kadar, gubitak konteksta | — | — | — | bez three.js i GLB-a |
Spuštanje po merenju (40 kadrova u animaciji): rezolucija ×0,8 → ×0,62 → poster. Probni kadar > 140 ms → odmah poster.

## Šta radi 3D sloj
- Jedan canvas, jedan WebGL kontekst, jedna petlja koja radi samo kad se nešto menja (skrol, istraživanje, promena veličine); u mirovanju `raf = false`.
- Pauza kad hero nije na ekranu (`IntersectionObserver`), kad je tab skriven i na `pagehide`; provera konteksta na `pageshow`.
- Sve teksture se odmah otpremaju na GPU (`renderer.initTexture`), pa se dekodirani `ImageBitmap`-ovi zatvaraju (CPU memorija).
- Napuštanje početne: render staje. Posle 120 s van početne scena se **potpuno oslobađa** (`dispose`: geometrije, materijali, teksture, forceContextLoss, canvas zamenjen novim) i ponovo se podiže pri povratku. Dok je korisnik na drugoj strani, 3D se uopšte ne učitava (dubok link na proizvod ne vuče GLB).
- Poster-first: 7 kadrova (landscape + portret, ukupno ≈ 1 MB, prvi 27–47 KB) prate skrol dok 3D ne bude spreman ili ako nikad ne bude.
- Slike kataloga su `loading="lazy"`; fontovi sa `display=swap`; zaglavlje nema `backdrop-filter`; `contain: layout paint` na hero kadru.

## Šta je STVARNO testirano (ugrađeni browser panel, Intel UHD 750, hardverski ANGLE/D3D11)
- Model i sve teksture se učitavaju (hd, sd, xs); bez GL grešaka posle ispravke redosleda otpremanja tekstura (ranije su teksture predmeta van prvog kadra ostajale neotpremljene).
- Skrol uvod napred/nazad (P = 0, 0,45, 1) u 1000×600, 800×480, 1280×720 i mobilnom 375×812; kadrovi se poklapaju sa posterima.
- Hotspotovi: pozicije na objektima, hover širi u „03 — Kade", klik otvara panel (desktop sa strane, mobilni donji list), 7–8 vidljivih/skrivenih po kadru, zaklanjanje i izlazak iz kadra.
- „Istraži prostor": ulazak/izlaz, 5 pogleda, prevlačenje menja yaw, `Esc` izlazi, skrol se zaključava i otključava; dubok link „Pogledaj u 3D kupatilu" (čeka da se 3D učita pa otvara pogled i panel).
- Resursi: 8 skrol ciklusa + 6 ulaza/izlaza iz istraživanja + 4 odlaska/povratka na početnu → geometrije 17, teksture 13, programi 5, tickeri 0, `raf = false` pre i posle; 2 ciklusa parkiranja/oporavka → 1 canvas, 8 markera, 13 tekstura.
- Poster nivo (`?tier=poster`): ukupno 757 KB, bez three.js i GLB-a, linkovi kategorija na završnom kadru; gubitak konteksta (`WEBGL_lose_context`) → poster; `?budget=0.1` → rezolucija ×0,8.
- Prodavnica: sve rute (kategorije, kolekcija, proizvodi, korpa, naplata, pretraga, info, 404), filteri/sortiranje/čuvanje stanja, varijante i cena, korpa (količina, ukloni, ukupno, trajnost), validacija naplate, mobilna fioka i filteri.

## Šta NIJE testirano / treba na pravom uređaju
- **Pravi slab telefon** (Android 3–4 GB, iPhone SE): stvarni FPS tokom skrola, zagrevanje, vreme učitavanja 2,6 MB modela na mobilnoj mreži, ponašanje `loseContext` pri prebacivanju aplikacije. Merenja u panelu (bench 0,4–3 ms) su sa desktop GPU-a i važe samo za poređenje.
- Dodir: panel i markeri su proveravani klikom u emuliranom mobilnom prikazu, ne pravim prstom; štipanje (pinch) i inercija prevlačenja nisu probani na ekranu osetljivom na dodir. Sistem scroll-a na iOS-u (zaključavanje `overflow: hidden` + adresna traka) treba proveriti.
- Safari (WebGL2, `ImageBitmap`), Firefox i stariji Chrome; `prefers-reduced-motion` iz OS-a (probano samo kroz `?motion=reduce`).
- Čitači ekrana (NVDA/VoiceOver): markeri su `<button>` sa pristupačnim imenom i fokusom, ali stvarno čitanje nije slušano.
- Kontrast i lom redova za sve prelome širine između 375 i 1920 px nisu pregledani u svim kombinacijama.
- Dev parametri: `?tier=high|mid|low|poster`, `?now=1`, `?budget=N`, `?motion=reduce|full`, `?park=ms`, `?sw=1` (dozvoli softverski GL), `?dev=1` (preserveDrawingBuffer za snimanje slika).
