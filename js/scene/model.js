/* Učitavanje stvarnog GLB modela (pečeno osvetljenje → unlit materijali, bez svetala i senki). */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/GLTFLoader.js';

/* pečene teksture su prigušene; blago pojačanje ponaša se kao ekspozicija (scena je unlit, bez tone mapping-a) */
const EXPOSURE = 1.15;
const short = (n) => n.replace(/^Modern_Bathroom_/, '').replace(/_0(_\d+)?$/, '');

export async function loadModel({ url, aniso = 4, onProgress = () => {} }) {
  const loader = new GLTFLoader();
  const gltf = await new Promise((res, rej) => loader.load(url, res, (e) => e.total && onProgress(e.loaded / e.total), rej));
  const root = gltf.scene;
  root.updateMatrixWorld(true);

  const parts = {};
  const mats = new Set();
  root.traverse((o) => {
    if (!o.isMesh) return;
    const key = short(o.name);
    (parts[key] ||= []).push(o);
    o.frustumCulled = true;
    const m = o.material;
    if (m && !mats.has(m)) {
      mats.add(m);
      if (m.map) { m.map.anisotropy = aniso; m.color.multiplyScalar(EXPOSURE); }
    }
  });

  // Prozor je providan i nema svrhu; staklo tuš kabine je samo naznačeno
  parts.Window?.forEach((o) => { o.visible = false; });
  parts.ShowerScreen?.forEach((o) => {
    const m = o.material; m.transparent = true; m.opacity = 0.1; m.color.set(0xcfe0dc); m.depthWrite = false; m.alphaTest = 0;
    o.renderOrder = 5;
  });

  // Model je „presek" prostora: kraj z = +3,64 je otvoren. Zatvaramo ga zidom koji se vidi samo iznutra,
  // pa spoljašnji pogled kroz otvor ostaje netaknut.
  const endMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#7b8179'), side: THREE.FrontSide });
  const end = new THREE.Mesh(new THREE.PlaneGeometry(2.55, 2.6), endMat);
  end.rotation.y = Math.PI; end.position.set(0.8, 0, 3.6); end.name = 'endWall';
  root.add(end);
  // zadnji zid tuš kabine (u modelu crn) — tamni kamen kao susedni zid
  const endS = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.6), new THREE.MeshBasicMaterial({ color: new THREE.Color('#464642'), side: THREE.FrontSide }));
  endS.rotation.y = Math.PI; endS.position.set(-1.27, 0, 3.6); endS.name = 'endWallShower';
  root.add(endS);

  const box = (key) => new THREE.Box3().setFromObject(parts[key][0]);
  const bounds = Object.fromEntries(Object.keys(parts).map((k) => [k, parts[k].map((o) => new THREE.Box3().setFromObject(o))]));

  return { root, parts, bounds, box, structure: parts.Structure[0] };
}

/** oslobađa sve GPU resurse modela */
export function disposeModel(root) {
  const seen = new Set();
  root.traverse((o) => {
    o.geometry?.dispose();
    [].concat(o.material || []).forEach((m) => {
      if (!m || seen.has(m)) return; seen.add(m);
      for (const k in m) { const t = m[k]; if (t && t.isTexture) t.dispose(); }
      m.dispose();
    });
  });
}
