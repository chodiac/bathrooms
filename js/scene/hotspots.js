/* Numerisani hotspotovi: DOM markeri vezani za 3D pozicije na modelu.
   Svaki kadar (dok se kamera menja) se projektuju, proveravaju (u kadru? zaklonjen zidom ili predmetom?), raspoređuju bez preklapanja
   i reveal-uju postepeno. Markeri su pravi <button> elementi (fokus, Enter/Space, pristupačno ime). */
import * as THREE from 'three';

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const pad2 = (n) => String(n).padStart(2, '0');

export function createHotspots({ engine, host, list, onOpen }) {
  const { camera, model } = engine;
  const ray = new THREE.Raycaster();
  const dir = new THREE.Vector3(), cp = new THREE.Vector3(), anchor = new THREE.Vector3();
  const pt = { x: 0, y: 0, z: 0 };

  // zaklanjanje: stvarna geometrija konstrukcije (zidovi, plafon — malo trouglova) + kutije glavnih predmeta
  const occBoxes = ['Bath', 'Toilet', 'Sink', 'Shower'].map((k) => {
    const b = model.bounds[k][0].clone(); b.expandByScalar(-0.015);
    return { key: k, box: b };
  });
  const structure = model.structure;
  const hit = new THREE.Vector3();

  const items = list.map((h) => {
    const a = document.createElement('button');
    a.type = 'button'; a.className = 'hs'; a.dataset.id = h.id;
    a.setAttribute('aria-label', `${pad2(h.n)} — ${h.name}. Otvori galeriju`);
    a.innerHTML = `<span class="hs__pill"><span class="hs__n" aria-hidden="true">${pad2(h.n)}</span><span class="hs__l" aria-hidden="true">— ${h.name}</span></span>`;
    a.hidden = true;
    a.addEventListener('click', () => onOpen?.(h, a));
    host.appendChild(a);
    return { h, el: a, v3: new THREE.Vector3(...h.anchor), vis: 0, shown: false, flip: false, x: -1e4, y: -1e4, open: false };
  });
  items.forEach((it) => {
    it.el.addEventListener('pointerenter', () => { it.el.classList.add('is-hover'); });
    it.el.addEventListener('pointerleave', () => { it.el.classList.remove('is-hover'); });
  });

  let reveal = 0, enabled = true, dead = false;
  const state = { visibleCount: 0 };

  function occluded(it) {
    anchor.copy(it.v3);
    cp.copy(camera.position);
    dir.subVectors(anchor, cp);
    const dist = dir.length(); dir.divideScalar(dist);
    ray.set(cp, dir); ray.far = dist - 0.04;
    for (const o of occBoxes) {
      if (it.h.owner.includes(o.key)) continue;
      if (o.box.containsPoint(cp)) continue;
      if (ray.ray.intersectBox(o.box, hit) && hit.distanceTo(cp) < dist - 0.04) return true;
    }
    if (!it.h.owner.includes('Structure')) {
      ray.near = 0;
      if (ray.intersectObject(structure, false).length) return true;
    } else {
      // marker na samoj konstrukciji (ogledalo): zid ispred njega ne sme da postoji, ali sam zid ne sme da ga sakrije → pomeri polaznu tačku
      ray.far = dist - 0.08;
      if (ray.intersectObject(structure, false).length) return true;
    }
    return false;
  }

  function update({ W, H }) {
    if (dead) return;
    let vc = 0;
    const edge = 22;
    for (const it of items) {
      let ok = enabled && reveal > 0;
      if (ok) {
        engine.project(it.v3, pt);
        ok = pt.z > -1 && pt.z < 1 && pt.x > edge && pt.x < W - edge && pt.y > edge + 60 && pt.y < H - edge;
        if (ok) ok = !occluded(it);
      }
      it.x = pt.x; it.y = pt.y; it.want = ok;
    }
    // bez preklapanja: markeri bliži od 34 px — zadržava se onaj sa manjim brojem
    for (let i = 0; i < items.length; i++) {
      if (!items[i].want) continue;
      for (let j = 0; j < i; j++) {
        if (!items[j].want) continue;
        if (Math.hypot(items[i].x - items[j].x, items[i].y - items[j].y) < 36) { items[i].want = false; break; }
      }
    }
    items.forEach((it, i) => {
      const stag = clamp01((reveal - i * 0.07) / 0.3);
      const target = it.want ? stag : 0;
      // glatko pojavljivanje (CSS tranzicija opacity-ja), logika skriva element kad je potpuno providan
      const show = target > 0.01;
      if (show !== it.shown) {
        it.shown = show;
        if (show) { it.el.hidden = false; }
        it.el.classList.toggle('is-on', show);
        it.el.tabIndex = show ? 0 : -1;
        it.el.setAttribute('aria-hidden', show ? 'false' : 'true');
        if (!show) setTimeout(() => { if (!it.shown && !dead) it.el.hidden = true; }, 380);
      }
      if (show) {
        it.el.style.transform = `translate3d(${it.x.toFixed(1)}px,${it.y.toFixed(1)}px,0)`;
        it.el.style.setProperty('--k', target.toFixed(3));
        const flip = it.x > W - 210;
        if (flip !== it.flip) { it.flip = flip; it.el.classList.toggle('hs--l', flip); }
        vc++;
      }
    });
    state.visibleCount = vc;
  }

  const off = engine.onFrame(update);

  return {
    items, state,
    setReveal(r) { const n = clamp01(r); if (n !== reveal) { reveal = n; engine.invalidate(); } },
    setEnabled(e) { if (enabled !== e) { enabled = e; engine.invalidate(); } },
    get(id) { return items.find((i) => i.h.id === id); },
    dispose() { dead = true; off(); items.forEach((i) => i.el.remove()); },
  };
}
