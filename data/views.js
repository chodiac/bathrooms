/* Pogledi za režim „Istraži prostor". yaw 0 = pogled ka −z (prozor), yaw > 0 = ka +x (lavabo/ogledalo). */
export const VIEWS = [
  { id: 'soba',    label: 'Cela soba',      pos: [-0.05, 0.14, 2.5], look: [0.65, -0.42, -1.6], fov: 64, dolly: [-0.3, 1.4] },
  { id: 'kada',    label: 'Kada',           pos: [0.0, 0.0, -0.3],   look: [0.0, -0.55, -3.3], fov: 58, dolly: [-0.8, 1.4] },
  { id: 'lavabo',  label: 'Lavabo',         pos: [0.35, 0.0, 0.35],  look: [2.0, -0.35, 0.65], fov: 60, dolly: [-0.3, 0.7] },
  { id: 'tus',     label: 'Tuš kabina',     pos: [0.3, 0.15, 1.2],   look: [-1.5, 0.0, 3.0],   fov: 66, dolly: [-0.3, 0.6] },
  { id: 'wc',      label: 'WC i galanterija', pos: [0.0, 0.1, 0.6],  look: [-2.0, -0.55, -0.15], fov: 62, dolly: [-0.3, 0.7] },
];
