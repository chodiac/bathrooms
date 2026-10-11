/* Mapa hotspotova: ID → objekat u sceni / 3D pozicija → naziv → kategorija (ili proizvod) → odredište.
   `anchor` je svetska 3D pozicija na stvarnom objektu u modelu (proverena probom zraka); `owner` su delovi modela
   koji ne smeju da zaklone sopstveni marker. Objekti kojih nema u modelu (npr. ormarići za odlaganje) nemaju marker.
   Kad postoji proveren proizvod iz kataloga koji odgovara objektu, dodaje se `product` — tada marker vodi na stranicu proizvoda,
   inače na kolekciju (`category`). */
export const hotspots = [
  { id: 'slavine',  n: 1, name: 'Slavine',            category: 'slavine',     anchor: [1.80, -0.17, 0.53],  owner: ['Sink'],         object: 'Sink_0 (crna baterija)',     lede: 'Baterije za lavabo, kadu i tuš — crne, mesingane i hromirane.' },
  { id: 'tus',      n: 2, name: 'Tuš kabine',         category: 'tus-kabine',  anchor: [-0.45, 0.30, 2.75],  owner: ['Shower', 'ShowerScreen'], object: 'ShowerScreen_0 + Shower_0', lede: 'Staklene stranice za walk-in tuševe i kompletne kabine.' },
  { id: 'kada',     n: 3, name: 'Kade',               category: 'kade',        anchor: [0.0, -0.46, -2.62],  owner: ['Bath'],         object: 'Bath_0',                     lede: 'Slobodnostojeće i ugradne kade u mat i sjajnoj završnici.' },
  { id: 'lavabo',   n: 4, name: 'Lavaboi',            category: 'lavaboi',     anchor: [1.82, -0.40, 1.15],  owner: ['Sink'],         object: 'Sink_0 (sudoper)',           lede: 'Nadgradni i podgradni lavaboi od mineralnog kompozita i keramike.' },
  { id: 'namestaj', n: 5, name: 'Kupatilski nameštaj', category: 'namestaj',   anchor: [1.56, -0.68, 0.25],  owner: ['Sink'],         object: 'Sink_0 (viseći element)',    lede: 'Viseći elementi, komode i police za kupatilo.' },
  { id: 'ogledalo', n: 6, name: 'Ogledala',           category: 'ogledala',    anchor: [2.05, 0.46, 0.55],   owner: ['Structure'],    object: 'Structure_0 (ogledalo)',     lede: 'Ogledala sa rasvetom i bez, po meri i u standardnim dimenzijama.' },
  { id: 'galant',   n: 7, name: 'Galanterija',        category: 'galanterija', anchor: [1.96, -0.26, -0.75], owner: ['SoapsSink', 'Sink'], object: 'SoapsSink_0',          lede: 'Dozatori, držači i dodaci za uredno kupatilo.' },
  { id: 'wc',       n: 8, name: 'WC šolje',           category: 'wc',          anchor: [-1.78, -0.28, 0.0],  owner: ['Toilet'],       object: 'Toilet_0',                   lede: 'Konzolne WC šolje sa daskom i sporim spuštanjem.' },
];
