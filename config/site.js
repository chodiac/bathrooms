/* Konfiguracija sajta. Poslovni podaci koji nisu dostavljeni ostaju `null` i na stranici se prikazuju kao [placeholder].
   Naziv firme "KAMEN & VODA" je radni (demo) naziv. */
export const brand = {
  name: 'KAMEN & VODA',
  tag: 'Kupatila',
  demoNote: 'Demo katalog: proizvodi, cene i fotografije su ilustrativni dok se ne poveže pravi katalog.',
};

export const business = {
  legalName: null,       // [pun naziv firme]
  address: null,         // [adresa salona]
  city: null,
  phone: null,           // [telefon]
  email: null,           // [e-pošta]
  hours: null,           // [radno vreme]
  pib: null,
};

/* Uslovi isporuke i povraćaja NISU dostavljeni — polja ispod su prazna i prikazuju se kao oznaka za popunjavanje. */
export const policies = {
  deliveryPrice: null,       // npr. { flat: 0, freeOver: 0 }
  deliveryTime: null,
  returnsDays: null,
  warrantyMonths: null,
  paymentMethods: [
    { id: 'pouzece', label: 'Plaćanje pouzećem', enabled: null },
    { id: 'racun', label: 'Uplata na račun', enabled: null },
    { id: 'kartica', label: 'Kartica', enabled: null },
  ],
};

export const currency = { code: 'RSD', locale: 'sr-Latn-RS' };

export const model = { hd: 'assets/models/bathroom-hd.glb', sd: 'assets/models/bathroom-sd.glb', xs: 'assets/models/bathroom-xs.glb' };

/* Skrol uvod: visina u ekranima i prigušenje kamere */
export const scroll = { heroScreens: { desktop: 4.0, mobile: 3.4 }, damping: 0.16 };

export const nav = [
  { id: 'slavine', label: 'Slavine' },
  { id: 'tus-kabine', label: 'Tuš kabine' },
  { id: 'kade', label: 'Kade' },
  { id: 'lavaboi', label: 'Lavaboi' },
  { id: 'namestaj', label: 'Nameštaj' },
  { id: 'ogledala', label: 'Ogledala' },
  { id: 'galanterija', label: 'Galanterija' },
  { id: 'wc', label: 'WC šolje' },
];

export const credits = {
  model: 'Modern Bathroom — dylanheyes (Sketchfab), CC BY 4.0',
  modelUrl: 'https://sketchfab.com/3d-models/modern-bathroom-9ba7e0a094694335bd8f4656611c0676',
};
