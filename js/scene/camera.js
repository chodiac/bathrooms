/* Koreografija kamere i ograničenja kretanja. Koordinate su svetske koordinate modela (jedinica ≈ 1 m):
   soba x −2,08…2,08 · y −1,30…1,30 (pod…plafon) · z −3,74 (prozor/kada) … 3,64 (otvoren kraj, ulaz u scenu). */
import * as THREE from 'three';
import { VIEWS } from '../../data/views.js';

export const ROOM = { min: [-2.08, -1.3, -3.74], max: [2.08, 1.3, 3.64] };

/* Granice za centar kamere (kamera ne sme da priđe zidovima, podu ni plafonu) */
export const CAM_BOX = { min: [-1.75, -0.78, -3.0], max: [1.75, 1.0, 3.42] };

/* Prepreke (AABB) — ulaze u izračunavanje sudara i zaklanjanje markera. Granice su uvećane za bezbedan razmak kamere. */
export const BLOCKERS = [
  { id: 'kada',    min: [-1.5, -1.4, -3.8],  max: [1.5, -0.1, -2.0] },
  { id: 'lavabo',  min: [1.05, -1.4, -1.25], max: [2.1, 0.2, 2.1] },
  { id: 'wc',      min: [-2.1, -1.4, -0.75], max: [-1.1, -0.05, 0.6] },
  { id: 'tus',     min: [-2.1, -1.4, 1.85],  max: [-0.15, 1.35, 3.7] },
];

/* Putanja skrol uvoda: ključni kadrovi su ravnomerno raspoređeni po progresu P (Catmull-Rom, C1 neprekidna brzina).
   fov je vertikalni ugao za format 16:9; za uže ekrane se računa iz horizontalnog ugla. */
export const INTRO = [
  { pos: [0.55, -0.05, 11.2], look: [0.0, -0.3, -2.6], fov: 26 },
  { pos: [0.35, 0.0, 7.2],    look: [0.0, -0.35, -2.6], fov: 34 },
  { pos: [0.2, 0.05, 4.6],    look: [0.0, -0.4, -2.4], fov: 46 },
  { pos: [0.1, 0.1, 3.4],     look: [0.3, -0.42, -2.0], fov: 58 },
  { pos: [-0.05, 0.14, 2.5],  look: [0.65, -0.42, -1.6], fov: 64 },
];

export { VIEWS };

export const EXPLORE_LIMITS = { yaw: THREE.MathUtils.degToRad(58), pitchUp: THREE.MathUtils.degToRad(26), pitchDown: THREE.MathUtils.degToRad(34) };

const v = (a) => new THREE.Vector3(...a);

/* ---- interpolacija ---- */
function catmull(p0, p1, p2, p3, t, out) {
  const t2 = t * t, t3 = t2 * t;
  for (const k of ['x', 'y', 'z']) {
    out[k] = 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
  }
  return out;
}
const KP = INTRO.map((k) => v(k.pos)), KL = INTRO.map((k) => v(k.look));
export function introPose(P, out = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 40 }, portrait = false) {
  const n = INTRO.length - 1, s = Math.min(Math.max(P, 0), 1) * n;
  const i = Math.min(n - 1, Math.floor(s)), t = s - i;
  const at = (arr, j) => arr[Math.min(n, Math.max(0, j))];
  catmull(at(KP, i - 1), at(KP, i), at(KP, i + 1), at(KP, i + 2), t, out.pos);
  catmull(at(KL, i - 1), at(KL, i), at(KL, i + 1), at(KL, i + 2), t, out.look);
  out.fov = INTRO[i].fov + (INTRO[i + 1].fov - INTRO[i].fov) * (t * t * (3 - 2 * t));
  if (portrait) { const k = THREE.MathUtils.smoothstep(P, 0.55, 1); out.look.x += 0.15 * k; out.look.z += 0.15 * k; }   // uski kadar: okreni se ka lavabou da u kadar uđu i kada i lavabo
  return out;
}

/* vertikalni fov za dati aspekt: sačuvaj horizontalni ugao koji bi važio na 16:9, ali ograniči za uske ekrane;
   na portretu je početni kadar bliži (soba popuni širinu), pa se do sredine uvoda vraća na normalu */
export function fovFor(fov169, aspect, P = 1) {
  if (aspect >= 16 / 9) return fov169;
  const h = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(fov169) / 2) * 16 / 9);
  let hh = Math.min(h, THREE.MathUtils.degToRad(aspect < 0.8 ? 88 : 96));
  if (aspect < 0.9) hh *= 1 - 0.34 * (1 - THREE.MathUtils.smoothstep(P, 0, 0.55));
  const vf = 2 * Math.atan(Math.tan(hh / 2) / aspect);
  return Math.min(THREE.MathUtils.radToDeg(vf), 84);
}

/* ---- yaw/pitch ---- */
export function dirFromYawPitch(yaw, pitch, out = new THREE.Vector3()) {
  const cp = Math.cos(pitch);
  return out.set(Math.sin(yaw) * cp, Math.sin(pitch), -Math.cos(yaw) * cp);
}
export function yawPitchFrom(pos, look) {
  const d = v(look).sub(v(pos)).normalize();
  return { yaw: Math.atan2(d.x, -d.z), pitch: Math.asin(d.y) };
}

/* ---- sudari ---- */
const inBox = (p, b, m = 0) => p.x > b.min[0] - m && p.x < b.max[0] + m && p.y > b.min[1] - m && p.y < b.max[1] + m && p.z > b.min[2] - m && p.z < b.max[2] + m;
export const insideBlocker = (p) => BLOCKERS.find((b) => inBox(p, b)) || null;

/** Ograničava poziciju kamere u sobu i izguruje je iz prepreka (po najkraćoj osi u horizontali). */
export function constrain(p) {
  p.x = Math.min(Math.max(p.x, CAM_BOX.min[0]), CAM_BOX.max[0]);
  p.y = Math.min(Math.max(p.y, CAM_BOX.min[1]), CAM_BOX.max[1]);
  p.z = Math.min(Math.max(p.z, CAM_BOX.min[2]), CAM_BOX.max[2]);
  for (let k = 0; k < 3; k++) {
    const b = insideBlocker(p);
    if (!b) break;
    const d = [p.x - b.min[0], b.max[0] - p.x, p.z - b.min[2], b.max[2] - p.z];
    const m = d.indexOf(Math.min(...d));
    if (m === 0) p.x = b.min[0] - 0.01; else if (m === 1) p.x = b.max[0] + 0.01; else if (m === 2) p.z = b.min[2] - 0.01; else p.z = b.max[2] + 0.01;
  }
  return p;
}

/** Da li je duž A→B slobodna od prepreka (uzorkovanje na 5 cm). */
export function segmentFree(a, b) {
  const n = Math.max(2, Math.ceil(a.distanceTo(b) / 0.05)), t = new THREE.Vector3();
  for (let i = 0; i <= n; i++) { t.lerpVectors(a, b, i / n); if (insideBlocker(t)) return false; }
  return true;
}

/** Putanja između dva pogleda: direktno ako je slobodno, inače preko osnovnog koridora (x = 0,35). */
export function routeBetween(a, b) {
  if (segmentFree(a, b)) return [a.clone(), b.clone()];
  const ya = (a.y + b.y) / 2, ax = new THREE.Vector3(0.35, a.y, a.z), bx = new THREE.Vector3(0.35, b.y, b.z);
  void ya;
  return [a.clone(), ax, bx, b.clone()];
}

export const viewPose = (i) => {
  const w = VIEWS[i], yp = yawPitchFrom(w.pos, w.look);
  return { pos: v(w.pos), yaw: yp.yaw, pitch: yp.pitch, fov: w.fov, dolly: w.dolly };
};

/** Pomeranje kadra na početku uvoda (deo širine/visine ekrana): široki ekran — soba udesno (mesto za naslov);
    portret — soba niže (naslov je gore). Do P ≈ 0,3 se vraća na sredinu. */
export function viewShift(P, aspect) {
  const k = 1 - THREE.MathUtils.smoothstep(P, 0, 0.3);
  if (aspect > 1.3) return { x: 0.14 * k, y: 0 };
  if (aspect < 0.9) return { x: 0, y: 0.2 * k };
  return { x: 0, y: 0 };
}
