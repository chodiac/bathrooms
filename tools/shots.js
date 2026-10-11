/* Dev alat: renderuje fotografije za galerije/proizvode iz stvarnog 3D modela (isto kao poster kadrovi).
   Pokretanje (tools/scene.html?dev=1): const m = await import('/tools/shots.js'); await m.run(['kada-1'])  — bez argumenta renderuje sve. */
const STUDIO = '#e3e4e0';
export const SHOTS = {
  // ---- slavine
  'slavine-lavabo': { pos: [0.9, 0.0, 0.62], look: [1.8, -0.22, 0.58], fov: 42 },
  'slavine-kada': { pos: [0.55, -0.05, -2.1], look: [0.0, -0.5, -3.15], fov: 38 },
  'slavine-tus': { pos: [-0.55, 0.25, 1.9], look: [-1.7, 1.0, 2.8], fov: 46 },
  'slavine-ventil': { pos: [-0.8, 0.0, 1.9], look: [-1.95, -0.1, 2.85], fov: 42 },
  // ---- tuš
  'tus-1': { pos: [0.3, 0.15, 1.2], look: [-1.5, 0.0, 3.0], fov: 66 },
  'tus-2': { pos: [1.2, 0.25, 0.4], look: [-1.0, -0.1, 3.0], fov: 55 },
  'tus-3': { pos: [-0.75, 0.1, 3.3], look: [-2.0, 0.35, 2.6], fov: 72 },
  'tus-4': { pos: [-1.2, 0.25, 3.1], look: [-0.3, -0.2, -0.5], fov: 62 },
  // ---- kade
  'kada-1': { pos: [0.0, 0.0, -0.3], look: [0.0, -0.55, -3.3], fov: 58 },
  'kada-2': { pos: [1.6, -0.05, -0.7], look: [-0.2, -0.7, -3.0], fov: 52 },
  'kada-3': { pos: [0.1, 0.95, -1.4], look: [0.0, -0.8, -3.0], fov: 52 },
  'kada-4': { pos: [-1.8, 0.35, -0.8], look: [0.0, -0.8, -2.8], fov: 42, only: ['Bath'], bg: STUDIO, gain: 1.45 },
  // ---- lavaboi
  'lavabo-1': { pos: [0.4, -0.05, 1.0], look: [1.9, -0.42, 1.1], fov: 50 },
  'lavabo-2': { pos: [1.0, 0.75, 0.6], look: [1.8, -0.5, 1.2], fov: 46 },
  'lavabo-3': { pos: [0.9, -0.05, -1.5], look: [1.8, -0.4, 0.8], fov: 46 },
  // ---- nameštaj
  'namestaj-1': { pos: [0.2, -0.3, -1.2], look: [1.7, -0.6, 0.5], fov: 50 },
  'namestaj-2': { pos: [-0.6, 0.0, -2.0], look: [1.8, -0.55, 0.5], fov: 40, only: ['Sink'], bg: STUDIO, gain: 1.35 },
  'namestaj-3': { pos: [0.5, -0.9, 0.9], look: [1.8, -0.6, 0.0], fov: 55 },
  // ---- ogledala
  'ogledalo-1': { pos: [-0.4, 0.25, 0.5], look: [2.0, 0.35, 0.55], fov: 52 },
  'ogledalo-2': { pos: [-0.9, 0.1, -1.7], look: [2.0, 0.3, 0.7], fov: 62 },
  'ogledalo-3': { pos: [0.9, 0.7, -0.3], look: [2.0, 0.85, -0.3], fov: 40 },
  // ---- galanterija
  'galant-1': { pos: [1.2, -0.22, -0.4], look: [1.95, -0.38, -0.75], fov: 36 },
  'galant-2': { pos: [-0.95, -0.5, -0.35], look: [-2.0, -0.72, -0.42], fov: 40 },
  'galant-3': { pos: [0.0, -0.1, -1.6], look: [0.0, -0.7, -2.6], fov: 46 },
  'galant-4': { pos: [-0.3, 0.15, 0.3], look: [-1.6, -1.2, 0.0], fov: 52 },
  // ---- WC
  'wc-1': { pos: [-0.7, -0.15, -0.9], look: [-1.8, -0.65, 0.0], fov: 46 },
  'wc-2': { pos: [-0.2, -0.1, 1.2], look: [-1.8, -0.65, 0.0], fov: 38, only: ['Toilet'], bg: STUDIO, gain: 1.5 },
  'wc-3': { pos: [-1.4, 0.7, 0.9], look: [-1.85, -0.7, 0.0], fov: 46 },
};

export async function run(names = Object.keys(SHOTS), w = 1400, h = 1050) {
  const out = {};
  for (const n of names) {
    const s = SHOTS[n];
    const blob = await window.E.shot({ ...s, w, h, q: 0.8 });
    out[n] = await window.save('assets/img/' + n + '.jpg', blob);
  }
  return out;
}

/* ---- postera za skrol uvod (isti kadrovi kao 3D putanja), landscape + portret ---- */
export async function posters(frames = [0, 0.17, 0.33, 0.5, 0.67, 0.83, 1]) {
  const cam = await import('/js/scene/camera.js');
  const out = {};
  for (const [set, w, h] of [['l', 1600, 900], ['p', 720, 1280]]) {
    for (let i = 0; i < frames.length; i++) {
      const pose = cam.introPose(frames[i], undefined, w / h < 0.9);
      const blob = await window.E.shot({ pos: pose.pos.toArray(), look: pose.look.toArray(), fov: cam.fovFor(pose.fov, w / h, frames[i]), shift: cam.viewShift(frames[i], w / h), w, h, q: i === 0 ? 0.7 : 0.78 });
      out[`${set}-${i}`] = await window.save(`assets/posters/${set}-${i}.jpg`, blob);
    }
  }
  return out;
}

/* ---- „Kupujte po izgledu": slike + položaji pinova (u %) projektovani iz 3D tačaka ---- */
export const LOOKS = {
  'look-kada': { pos: [0.9, 0.12, 0.1], look: [-0.1, -0.5, -2.8], fov: 56, pins: { 'kada-oval-170': [-0.95, -0.55, -2.55], 'baterija-kada-podna': [0, -0.43, -3.16], 'set-peskira': [0.28, -0.7, -2.3], 'prostirka-siva': [0.75, -1.28, -2.2] } },
  'look-orah': { pos: [-0.7, 0.15, -0.3], look: [2.0, 0.05, 0.6], fov: 64, pins: { 'lavabo-nadgradni-kamen': [1.82, -0.4, 1.15], 'baterija-lavabo-crna': [1.8, -0.2, 0.53], 'ogledalo-visoko': [2.05, 0.45, 0.55], 'zidna-svetiljka-cilindar': [2.0, 0.85, -0.3], 'dozator-sapuna': [1.96, -0.3, -0.75], 'visece-telo-orah': [1.56, -0.68, 0.0] } },
  'look-tus': { pos: [0.3, 0.15, 1.2], look: [-1.5, 0.0, 3.0], fov: 66, pins: { 'walk-in-staklo': [-0.45, 0.3, 2.7], 'tus-glava-kisa': [-1.55, 0.98, 2.8], 'podzbukna-baterija': [-1.95, -0.3, 2.85], 'tus-polica': [-1.95, 0.0, 2.8], 'tus-ploca-orah': [-1.2, -1.29, 3.0] } },
};
export async function looks(w = 1600, h = 1100) {
  const T = window.THREE, out = {};
  for (const [n, s] of Object.entries(LOOKS)) {
    const blob = await window.E.shot({ pos: s.pos, look: s.look, fov: s.fov, w, h, q: 0.8 });
    await window.save(`assets/img/${n}.jpg`, blob);
    const cam = new T.PerspectiveCamera(s.fov, w / h, 0.05, 60); cam.position.set(...s.pos); cam.lookAt(...s.look); cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
    out[n] = Object.fromEntries(Object.entries(s.pins).map(([id, p]) => { const v = new T.Vector3(...p).project(cam); return [id, [+((v.x * 0.5 + 0.5) * 100).toFixed(1), +((-v.y * 0.5 + 0.5) * 100).toFixed(1)]]; }));
  }
  return out;
}
