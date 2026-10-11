/* DEMO KATALOG. Nema povezanog backend-a ni pravog kataloga: nazivi, cene i specifikacije su ilustrativni
   (dimenzije većih elemenata izvedene su iz modela scene). Fotografije su prikazi iz isporučenog 3D modela kupatila.
   Stvarni katalog zamenjuje ovaj fajl (ili se učitava sa API-ja kroz js/store/catalog-api.js).
   Dostupnost (zalihe) NIJE dostavljena — polje `stock` je null i ne prikazuje se kao informacija o zalihama. */
const im = (n) => `assets/img/${n}.jpg`;

export const categories = [
  { id: 'slavine', focus: '42% 62%', name: 'Slavine', lede: 'Baterije za lavabo, kadu i tuš. Crne, mesingane i hromirane završnice.', image: im('slavine-lavabo'),
    gallery: ['slavine-lavabo', 'slavine-kada', 'slavine-tus', 'slavine-ventil'] },
  { id: 'tus-kabine', focus: '62% 48%', name: 'Tuš kabine', lede: 'Walk-in staklene stranice, tuš ploče i oprema za tuš.', image: im('tus-1'),
    gallery: ['tus-1', 'tus-2', 'tus-3', 'tus-4'] },
  { id: 'kade', focus: '50% 78%', name: 'Kade', lede: 'Slobodnostojeće kade čistih linija, u mat završnici.', image: im('kada-1'),
    gallery: ['kada-1', 'kada-2', 'kada-3', 'kada-4'] },
  { id: 'lavaboi', focus: '50% 62%', name: 'Lavaboi', lede: 'Nadgradni lavaboi od mineralnog kompozita.', image: im('lavabo-1'),
    gallery: ['lavabo-1', 'lavabo-2', 'lavabo-3', 'namestaj-1'] },
  { id: 'namestaj', focus: '50% 70%', name: 'Kupatilski nameštaj', lede: 'Viseći elementi i zidne obloge u orahu i kamenu.', image: im('namestaj-1'),
    gallery: ['namestaj-1', 'namestaj-2', 'namestaj-3', 'ogledalo-2'] },
  { id: 'ogledala', focus: '50% 45%', name: 'Ogledala', lede: 'Ogledala i zidne svetiljke za prostor oko lavaboa.', image: im('ogledalo-1'),
    gallery: ['ogledalo-1', 'ogledalo-2', 'ogledalo-3'] },
  { id: 'galanterija', focus: '45% 60%', name: 'Galanterija', lede: 'Dozatori, držači, tekstil i prostirke za uredno kupatilo.', image: im('galant-1'),
    gallery: ['galant-1', 'galant-2', 'galant-3', 'galant-4'] },
  { id: 'wc', focus: '50% 55%', name: 'WC šolje', lede: 'Konzolne WC šolje i dodaci.', image: im('wc-1'),
    gallery: ['wc-1', 'wc-2', 'wc-3', 'galant-2'] },
];

/* Svojstva za filtere i prikaz:
   finish: završna obrada · material: materijal · tags: slobodne oznake (npr. za „Kupujte po izgledu")
   variants.finish / variants.size: izbor na stranici proizvoda; `delta` je razlika u ceni u dinarima */
export const products = [
  // ---------------- Slavine ----------------
  { id: 'baterija-lavabo-crna', cat: 'slavine', name: 'Baterija za lavabo, visoka', price: 24900, material: 'Mesing', finish: 'Crna mat',
    short: 'Visoka stojeća baterija pravih linija za nadgradne lavabo.',
    desc: 'Stojeća jednoručna baterija sa visokim izlivom, namenjena nadgradnim lavaboima. Crna mat završnica se uklapa uz kamen i orah.',
    images: ['slavine-lavabo', 'lavabo-1', 'galant-1'],
    specs: [['Visina izliva', '195 mm'], ['Materijal', 'Mesing'], ['Priključak', '1/2"'], ['Montaža', 'Na ploču / lavabo']],
    variants: { finish: [{ id: 'crna', label: 'Crna mat', delta: 0 }, { id: 'mesing', label: 'Mesing', delta: 4500 }, { id: 'hrom', label: 'Hrom', delta: -2000 }] }, tags: ['kamen-orah'] },
  { id: 'baterija-kada-podna', cat: 'slavine', name: 'Podna baterija za slobodnostojeću kadu', price: 128000, material: 'Mesing', finish: 'Mesing',
    short: 'Slobodnostojeća baterija sa ručnim tušem, za kade uz prozor.',
    desc: 'Podna baterija u mesingu sa dugim izlivom. Postavlja se iza kade, uz zid ili na pod.',
    images: ['slavine-kada', 'kada-1', 'kada-2'],
    specs: [['Visina', '≈ 1000 mm'], ['Materijal', 'Mesing'], ['Priključak', '1/2"'], ['Montaža', 'Podna']],
    variants: { finish: [{ id: 'mesing', label: 'Mesing', delta: 0 }, { id: 'hrom', label: 'Hrom', delta: -9000 }, { id: 'crna', label: 'Crna mat', delta: 6000 }] }, tags: ['kada-prozor'] },
  { id: 'tus-glava-kisa', cat: 'slavine', name: 'Kišna tuš glava, kvadratna', price: 34500, material: 'Nerđajući čelik', finish: 'Hrom',
    short: 'Kvadratna kišna glava sa plafonskim ili zidnim držačem.',
    desc: 'Pljosnata kvadratna tuš glava, jednostavna za čišćenje. Zidni držač je u kompletu.',
    images: ['slavine-tus', 'tus-1', 'tus-3'],
    specs: [['Dimenzije', '300 × 300 mm'], ['Materijal', 'Nerđajući čelik'], ['Priključak', '1/2"']],
    variants: { finish: [{ id: 'hrom', label: 'Hrom', delta: 0 }, { id: 'crna', label: 'Crna mat', delta: 3500 }] }, tags: ['tus-tamni'] },
  { id: 'podzbukna-baterija', cat: 'slavine', name: 'Podžbukna baterija za tuš', price: 41200, material: 'Mesing', finish: 'Hrom',
    short: 'Okrugli upravljački taster za jedan potrošač.',
    desc: 'Podžbukna baterija sa okruglim tasterima i diskretnom rozetnom. Telo za ugradnju se naručuje posebno.',
    images: ['slavine-ventil', 'tus-4', 'tus-3'],
    specs: [['Prečnik rozete', '≈ 60 mm'], ['Materijal', 'Mesing'], ['Ugradnja', 'Podžbukna']],
    variants: { finish: [{ id: 'hrom', label: 'Hrom', delta: 0 }, { id: 'celik', label: 'Čelik (nikl)', delta: 2800 }] }, tags: ['tus-tamni'] },

  // ---------------- Tuš kabine ----------------
  { id: 'walk-in-staklo', cat: 'tus-kabine', name: 'Walk-in staklena stranica', price: 78000, material: 'Kaljeno staklo 8 mm', finish: 'Providno',
    short: 'Slobodna staklena stranica bez vrata i okvira.',
    desc: 'Kaljeno staklo debljine 8 mm sa nosačem uz zid. Za prostore sa tuš pločom u nivou poda.',
    images: ['tus-1', 'tus-2', 'tus-4'],
    specs: [['Debljina stakla', '8 mm'], ['Visina', '200 cm'], ['Materijal', 'Kaljeno staklo']],
    variants: { size: [{ id: '90', label: '90 cm', delta: 0 }, { id: '100', label: '100 cm', delta: 4500 }, { id: '120', label: '120 cm', delta: 11000 }] }, tags: ['tus-tamni'] },
  { id: 'tus-ploca-orah', cat: 'tus-kabine', name: 'Tuš ploča u drvenom dekoru', price: 96000, material: 'Mineralni kompozit', finish: 'Orah',
    short: 'Ravna ploča u nivou poda sa linijskim sifonom.',
    desc: 'Tuš ploča sa neklizajućom površinom u dekoru oraha. Odvod je u sredini ploče.',
    images: ['tus-3', 'tus-1', 'tus-2'],
    specs: [['Dimenzije', '120 × 90 cm'], ['Materijal', 'Mineralni kompozit'], ['Odvod', 'Centralni Ø 90 mm']],
    variants: { size: [{ id: '120x90', label: '120 × 90 cm', delta: 0 }, { id: '140x90', label: '140 × 90 cm', delta: 11000 }] }, tags: ['tus-tamni'] },
  { id: 'tus-polica', cat: 'tus-kabine', name: 'Polica za tuš, ugaona traka', price: 12400, material: 'Nerđajući čelik', finish: 'Hrom',
    short: 'Uska polica za šampone i sapune.',
    desc: 'Polica od nerđajućeg čelika sa zaobljenim krajem. Montira se lepljenjem ili zavrtnjima.',
    images: ['slavine-ventil', 'tus-4'],
    specs: [['Dužina', '400 mm'], ['Materijal', 'Nerđajući čelik'], ['Montaža', 'Zidna']],
    variants: { finish: [{ id: 'hrom', label: 'Hrom', delta: 0 }, { id: 'crna', label: 'Crna mat', delta: 1200 }] }, tags: ['tus-tamni'] },

  // ---------------- Kade ----------------
  { id: 'kada-oval-170', cat: 'kade', name: 'Slobodnostojeća kada Oval', price: 289000, material: 'Akrilni kompozit', finish: 'Bela mat',
    short: 'Čista oblina, mat završnica, ivica pogodna za oslanjanje.',
    desc: 'Slobodnostojeća kada u beloj mat završnici. Sa odvodom u klik-klak izvedbi i prelivom u ivici.',
    images: ['kada-1', 'kada-4', 'kada-2'],
    specs: [['Dimenzije', '228 × 90 × 77 cm'], ['Zapremina', '≈ 330 l'], ['Materijal', 'Akrilni kompozit']],
    variants: { size: [{ id: '170', label: '170 × 80 cm', delta: -45000 }, { id: '190', label: '190 × 85 cm', delta: -20000 }, { id: '228', label: '228 × 90 cm', delta: 0 }] }, tags: ['kada-prozor'] },
  { id: 'kada-oval-kompakt', cat: 'kade', name: 'Slobodnostojeća kada Oval, kompakt', price: 214000, material: 'Akrilni kompozit', finish: 'Bela sjaj',
    short: 'Manja varijanta iste forme za uže prostore.',
    desc: 'Smanjena verzija kade za kupatila do 4 m². Sjajna bela završnica.',
    images: ['kada-3', 'kada-2', 'kada-4'],
    specs: [['Dimenzije', '160 × 75 × 60 cm'], ['Materijal', 'Akrilni kompozit']],
    variants: { finish: [{ id: 'sjaj', label: 'Bela sjaj', delta: 0 }, { id: 'mat', label: 'Bela mat', delta: 9000 }] }, tags: [] },

  // ---------------- Lavaboi ----------------
  { id: 'lavabo-nadgradni-kamen', cat: 'lavaboi', name: 'Nadgradni lavabo u kamenu', price: 118000, material: 'Mineralni kompozit', finish: 'Taupe',
    short: 'Korito pravih ivica u boji kamena.',
    desc: 'Pravougaoni nadgradni lavabo sa tankom ivicom. Odvod bez prelivnika.',
    images: ['lavabo-1', 'lavabo-2', 'slavine-lavabo'],
    specs: [['Dimenzije', '90 × 45 × 12 cm'], ['Materijal', 'Mineralni kompozit']],
    variants: { size: [{ id: '70', label: '70 cm', delta: -22000 }, { id: '90', label: '90 cm', delta: 0 }, { id: '120', label: '120 cm', delta: 31000 }] }, tags: ['kamen-orah'] },
  { id: 'lavabo-dupli-kamen', cat: 'lavaboi', name: 'Dupli nadgradni lavabo, ploča 270', price: 246000, material: 'Mineralni kompozit', finish: 'Taupe',
    short: 'Ploča sa dva izliva za zajedničko jutro.',
    desc: 'Duga ploča sa jednim ili dva odvoda. Za visinski viseće elemente.',
    images: ['lavabo-3', 'namestaj-1', 'lavabo-2'],
    specs: [['Dužina', '270 cm'], ['Dubina', '48 cm'], ['Materijal', 'Mineralni kompozit']],
    variants: { size: [{ id: '160', label: '160 cm', delta: -70000 }, { id: '200', label: '200 cm', delta: -34000 }, { id: '270', label: '270 cm', delta: 0 }] }, tags: ['kamen-orah'] },

  // ---------------- Nameštaj ----------------
  { id: 'visece-telo-orah', cat: 'namestaj', name: 'Viseći element za lavabo', price: 172000, material: 'Furnir oraha / kamen', finish: 'Orah',
    short: 'Niski viseći element, bez ručki.',
    desc: 'Viseći element sa pločom u kamenu. Okačen na zid, ostavlja slobodan pod.',
    images: ['namestaj-1', 'namestaj-2', 'namestaj-3'],
    specs: [['Dužina', '270 cm (po meri)'], ['Dubina', '48 cm'], ['Visina', '≈ 40 cm'], ['Materijal', 'Furnir oraha, kamen']],
    variants: { size: [{ id: '160', label: '160 cm', delta: -64000 }, { id: '200', label: '200 cm', delta: -30000 }, { id: '270', label: '270 cm', delta: 0 }] }, tags: ['kamen-orah'] },
  { id: 'zidni-panel-orah', cat: 'namestaj', name: 'Zidni panel u orahu', price: 18900, material: 'Furnir oraha', finish: 'Orah',
    short: 'Obloga za zid iza lavaboa, cena po m².',
    desc: 'Furnirani panel, zaštićen za vlažne prostore. Cena važi po kvadratnom metru.',
    images: ['ogledalo-2', 'namestaj-3', 'ogledalo-1'],
    specs: [['Debljina', '12 mm'], ['Materijal', 'Furnir oraha'], ['Jedinica', 'm²']],
    variants: {}, tags: ['kamen-orah'] },

  // ---------------- Ogledala ----------------
  { id: 'ogledalo-visoko', cat: 'ogledala', name: 'Zidno ogledalo, visoko', price: 52000, material: 'Staklo', finish: 'Bez okvira',
    short: 'Visoko ogledalo bez okvira, ravnih ivica.',
    desc: 'Ogledalo sa brušenim ivicama, postavlja se između dve zidne svetiljke.',
    images: ['ogledalo-1', 'ogledalo-2', 'ogledalo-3'],
    specs: [['Dimenzije', '90 × 140 cm'], ['Materijal', 'Staklo 5 mm'], ['Montaža', 'Zidna']],
    variants: { size: [{ id: '70', label: '70 × 120 cm', delta: -14000 }, { id: '90', label: '90 × 140 cm', delta: 0 }, { id: '120', label: '120 × 140 cm', delta: 21000 }] }, tags: ['kamen-orah'] },
  { id: 'zidna-svetiljka-cilindar', cat: 'ogledala', name: 'Zidna svetiljka, polucilindar', price: 16800, material: 'Aluminijum', finish: 'Grafit',
    short: 'Svetiljka sa usmerenim svetlom uz ogledalo.',
    desc: 'Zidna svetiljka od aluminijuma u boji grafita. Dve komada uokviruju ogledalo.',
    images: ['ogledalo-3', 'ogledalo-1'],
    specs: [['Visina', '≈ 50 cm'], ['Materijal', 'Aluminijum']],
    variants: { finish: [{ id: 'grafit', label: 'Grafit', delta: 0 }, { id: 'crna', label: 'Crna mat', delta: 1500 }] }, tags: ['kamen-orah'] },

  // ---------------- Galanterija ----------------
  { id: 'dozator-sapuna', cat: 'galanterija', name: 'Dozator tečnog sapuna', price: 3900, material: 'Keramika', finish: 'Zelena mat',
    short: 'Keramički dozator, dve veličine.',
    desc: 'Keramički dozator sa crnom pumpicom. Veći za lavabo, manji za losion.',
    images: ['galant-1', 'lavabo-1'],
    specs: [['Zapremina', '300 / 150 ml'], ['Materijal', 'Keramika']],
    variants: { size: [{ id: '300', label: '300 ml', delta: 0 }, { id: '150', label: '150 ml', delta: -900 }] }, tags: ['kamen-orah'] },
  { id: 'drzac-papira-crni', cat: 'galanterija', name: 'Držač toalet papira', price: 5400, material: 'Čelik', finish: 'Crna mat',
    short: 'Otvoreni držač sa kraćim krakom.',
    desc: 'Držač za rolnu toalet papira, zidna montaža.',
    images: ['galant-2', 'wc-3'],
    specs: [['Dužina', '≈ 17 cm'], ['Materijal', 'Čelik']],
    variants: { finish: [{ id: 'crna', label: 'Crna mat', delta: 0 }, { id: 'hrom', label: 'Hrom', delta: -600 }] }, tags: [] },
  { id: 'set-peskira', cat: 'galanterija', name: 'Set peškira, pamuk', price: 6200, material: 'Pamuk', finish: 'Bela',
    short: 'Dva peškira velika, frotir.',
    desc: 'Frotir peškiri od pamuka, 500 g/m².',
    images: ['galant-3', 'kada-1'],
    specs: [['Dimenzije', '70 × 140 cm (2 kom)'], ['Materijal', 'Pamuk 500 g/m²']],
    variants: {}, tags: ['kada-prozor'] },
  { id: 'prostirka-siva', cat: 'galanterija', name: 'Prostirka za kupatilo', price: 8900, material: 'Mikrofiber', finish: 'Siva',
    short: 'Niska, gusta prostirka sa neklizajućom osnovom.',
    desc: 'Prostirka od mikrofibera sa gumiranom osnovom.',
    images: ['galant-4', 'wc-2'],
    specs: [['Dimenzije', '70 × 120 cm'], ['Materijal', 'Mikrofiber']],
    variants: { size: [{ id: 's', label: '60 × 90 cm', delta: -2000 }, { id: 'm', label: '70 × 120 cm', delta: 0 }, { id: 'l', label: '140 × 200 cm', delta: 14000 }] }, tags: ['kada-prozor'] },

  // ---------------- WC ----------------
  { id: 'wc-konzolna', cat: 'wc', name: 'Konzolna WC šolja', price: 46500, material: 'Sanitarna keramika', finish: 'Bela sjaj',
    short: 'Visi na zidu, lako se čisti ispod.',
    desc: 'Konzolna šolja sa integrisanim vodokotlićem. Bela sjajna glazura.',
    images: ['wc-1', 'wc-2', 'wc-3'],
    specs: [['Dimenzije', '36 × 58 × 78 cm'], ['Materijal', 'Sanitarna keramika'], ['Montaža', 'Konzolna']],
    variants: {}, tags: [] },
  { id: 'wc-daska-soft', cat: 'wc', name: 'WC daska sa sporim spuštanjem', price: 9800, material: 'Duroplast', finish: 'Bela',
    short: 'Skidanje bez alata za čišćenje.',
    desc: 'Daska od duroplasta sa mehanizmom sporog spuštanja.',
    images: ['wc-2', 'wc-1'],
    specs: [['Materijal', 'Duroplast'], ['Mehanizam', 'Sporo spuštanje']],
    variants: {}, tags: [] },
];

export const byId = Object.fromEntries(products.map((p) => [p.id, p]));
export const catById = Object.fromEntries(categories.map((c) => [c.id, c]));
export const imgUrl = im;
export const productsOf = (cat) => products.filter((p) => p.cat === cat);
export const fromPrice = (p) => {
  const ds = [];
  for (const k of Object.keys(p.variants || {})) ds.push(Math.min(...p.variants[k].map((v) => v.delta || 0)));
  return p.price + ds.reduce((a, b) => a + b, 0);
};

/* ---- izbor varijanti i cena ---- */
export const defaultSel = (p) => {
  const sel = {};
  for (const g of Object.keys(p.variants || {})) {
    const opts = p.variants[g];
    sel[g] = (opts.find((o) => !o.delta) || opts[0]).id;
  }
  return sel;
};
export const priceFor = (p, sel = defaultSel(p)) => {
  let t = p.price;
  for (const g of Object.keys(p.variants || {})) { const o = p.variants[g].find((x) => x.id === sel[g]); if (o) t += o.delta || 0; }
  return t;
};
export const selLabel = (p, sel) => Object.keys(p.variants || {}).map((g) => (p.variants[g].find((x) => x.id === sel[g]) || {}).label).filter(Boolean).join(' · ');
export const GROUP_LABEL = { finish: 'Završna obrada', size: 'Dimenzija' };
