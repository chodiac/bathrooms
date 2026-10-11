/* „Kupujte po izgledu": kompozicije iz 3D scene. `pins` su položaji (u % slike) projektovani iz stvarnih 3D tačaka
   (tools/shots.js → looks()); svaki pin vodi na proizvod iz kataloga. */
export const looks = [
  { id: 'kada', title: 'Kada uz prozor', text: 'Slobodnostojeća kada, mesingana baterija i mekani tekstil ispred velikog stakla.', image: 'assets/img/look-kada.jpg',
    pins: { 'kada-oval-170': [32, 51.2], 'baterija-kada-podna': [54, 46.4], 'set-peskira': [54.9, 61.4], 'prostirka-siva': [66, 85.7] } },
  { id: 'orah', title: 'Orah i kamen', text: 'Viseći element u kamenu ispred zida od oraha, sa ogledalom i crnom baterijom.', image: 'assets/img/look-orah.jpg',
    pins: { 'lavabo-nadgradni-kamen': [61.1, 62.5], 'baterija-lavabo-crna': [49.9, 57.8], 'ogledalo-visoko': [48.8, 38.8], 'zidna-svetiljka-cilindar': [31.5, 25.1], 'dozator-sapuna': [20.9, 62.2], 'visece-telo-orah': [39.6, 76.5] } },
  { id: 'tus', title: 'Tuš u tamnom kamenu', text: 'Walk-in prostor sa kišnom glavom, podžbuknutom baterijom i pločom u dekoru oraha.', image: 'assets/img/look-tus.jpg',
    pins: { 'walk-in-staklo': [32.2, 38.1], 'tus-glava-kisa': [53.9, 18.6], 'podzbukna-baterija': [58.1, 58], 'tus-polica': [58.9, 49.7], 'tus-ploca-orah': [45.3, 91.5] } },
];
