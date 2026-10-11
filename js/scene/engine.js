/* Renderer + petlja. Jedan canvas, jedna WebGL petlja. Renderuje samo kad se nešto menja (skrol, istraživanje, promena veličine),
   pauzira van ekrana i u pozadini, prati stvarno trajanje kadrova i samo SPUŠTA kvalitet (pa poster) ako uređaj ne stiže.
   Sve resurse oslobađa u dispose(). */
import * as THREE from 'three';
import { scroll as scrollCfg } from '../../config/site.js';
import { TIERS, isSoftwareGL } from './quality.js';
import { loadModel, disposeModel } from './model.js';
import { introPose, fovFor, dirFromYawPitch, viewShift } from './camera.js';

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

const smooth = (t) => t * t * (3 - 2 * t);

export async function createEngine({ canvas, tierName = 'low', onProgress = () => {}, onFail = () => {}, onTier = () => {} }) {
  const tier = { ...TIERS[tierName] };
  const q = new URLSearchParams(location.search);
  if (+q.get('budget')) tier.budget = +q.get('budget');          // dev: simulira slabiji uređaj (ms/kadar)
  const coarse = matchMedia('(pointer: coarse)').matches;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas, antialias: tier.aa, alpha: false, stencil: false, depth: true,
      powerPreference: coarse ? 'default' : 'high-performance',
      preserveDrawingBuffer: q.has('dev'),
      failIfMajorPerformanceCaveat: !q.has('sw'),            // softverski GL → izuzetak → poster
    });
  } catch (e) { throw new Error('WebGL nije dostupan ili je softverski'); }
  const sw = q.has('sw') ? '' : isSoftwareGL(renderer.getContext());
  if (sw) { renderer.dispose(); throw new Error('Softverski renderer: ' + sw); }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(0x101210, 1);

  const parent = () => canvas.parentElement;
  const cam = new THREE.PerspectiveCamera(45, 1, 0.05, 60);
  let W = 1, H = 1, qScale = 1, disposed = false, M = null;
  let target = 0, shown = 0, dirty = true, active = true, raf = 0, last = 0, lastRender = 0;
  let mixT = 0, mix = 0;
  let explorePose = null;
  const samples = []; let lastStep = 0, step = 0;
  const tickers = new Set(), frameCbs = new Set(), poseCbs = new Set();
  const scroll = introPose(0);
  const tmpL = new THREE.Vector3(), tmpD = new THREE.Vector3(), tmpP = new THREE.Vector3();

  const onLost = (e) => { e.preventDefault(); fail('gubitak WebGL konteksta'); };
  canvas.addEventListener('webglcontextlost', onLost);
  const ro = new ResizeObserver(() => { resize(); wake(); });

  function cleanup() {
    canvas.removeEventListener('webglcontextlost', onLost);
    try { ro.disconnect(); } catch (e) { /* nije bilo posmatrano */ }
    cancelAnimationFrame(raf); raf = 0;
    tickers.clear(); frameCbs.clear();
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    cleanup();
    if (M) disposeModel(M.root);
    renderer.dispose();
    try { renderer.forceContextLoss(); } catch (e) { /* kontekst je već izgubljen */ }
    canvas.width = canvas.height = 1;
  }
  function fail(why) { if (disposed) return; dispose(); onFail(why); }

  try {
    M = await loadModel({ url: new URL('../../' + tier.model, import.meta.url).href, aniso: Math.min(renderer.capabilities.getMaxAnisotropy(), tier.aniso), onProgress: (p) => onProgress(p * 0.9) });
  } catch (e) { dispose(); throw e; }
  if (disposed) return null;
  const scene = new THREE.Scene();
  scene.add(M.root);

  function applyPose() {
    // pozicija/pogled po skrolu
    introPose(shown, scroll, W / H < 0.9);
    let pos = scroll.pos, look = scroll.look, fov = scroll.fov;
    const s = smooth(mix);
    if (explorePose && s > 0) {
      dirFromYawPitch(explorePose.yaw, explorePose.pitch, tmpD);
      tmpL.copy(explorePose.pos).addScaledVector(tmpD, 6);
      tmpP.copy(pos).lerp(explorePose.pos, s);
      tmpL.lerpVectors(look, tmpL, s);
      pos = tmpP; look = tmpL; fov = fov + (explorePose.fov - fov) * s;
    }
    cam.position.copy(pos);
    cam.lookAt(look);
    cam.fov = fovFor(fov, W / H, shown);
    const sh = viewShift(shown, W / H), k = 1 - s;
    if (sh.x * k > 0.0005 || sh.y * k > 0.0005) cam.setViewOffset(W, H, -W * sh.x * k, -H * sh.y * k, W, H); else cam.clearViewOffset();
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld(true);
  }
  function resize() {
    if (disposed) return;
    const p = parent();
    W = Math.max(2, p.clientWidth); H = Math.max(2, p.clientHeight);
    let dpr = Math.min(window.devicePixelRatio || 1, tier.dpr) * qScale;
    dpr = Math.min(dpr, Math.sqrt(tier.px / (W * H)));
    renderer.setPixelRatio(Math.max(0.5, dpr));
    renderer.setSize(W, H, false);
    cam.aspect = W / H;
    dirty = true;
  }
  const project = (v3, out = { x: 0, y: 0, z: 0 }) => {
    tmpP.copy(v3).project(cam);
    out.x = (tmpP.x * 0.5 + 0.5) * W; out.y = (-tmpP.y * 0.5 + 0.5) * H; out.z = tmpP.z;
    return out;
  };

  function render() {
    applyPose();
    renderer.render(scene, cam);
    for (const f of frameCbs) f({ P: shown, mix, W, H });
    dirty = false;
  }

  /* spuštanje kvaliteta po izmerenom trajanju kadrova: rezolucija → rezolucija → poster */
  function degrade(why) {
    step++;
    const note = (action) => onTier({ step, action, why, qScale });
    if (step === 1) { qScale = 0.8; resize(); note('rezolucija ×0,8'); }
    else if (step === 2) { qScale = 0.62; resize(); note('rezolucija ×0,62'); }
    else fail('performanse: ' + why);
  }
  function monitor(delta) {
    samples.push(delta);
    if (samples.length < 40) return;
    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
    samples.length = 0;
    const now = performance.now();
    if (avg > tier.budget && now - lastStep > 2500) { lastStep = now; degrade(avg.toFixed(0) + ' ms/kadar'); }
  }

  function loop(now) {
    raf = 0;
    if (disposed || !active) return;
    if (tier.fps && now - lastRender < 1000 / tier.fps - 3 && (shown !== target || mix !== mixT || dirty)) { raf = requestAnimationFrame(loop); return; }
    const dt = Math.min(0.1, last ? (now - last) / 1000 : 0.016);
    last = now;
    let animating = false;
    if (shown !== target) {
      const tau = -0.0167 / Math.log(1 - scrollCfg.damping);
      shown += (target - shown) * (1 - Math.exp(-dt / tau));
      if (Math.abs(target - shown) < 0.00025) shown = target;
      animating = dirty = true;
    }
    if (mix !== mixT) {
      const stepm = dt / 0.95;
      mix = mix < mixT ? Math.min(mixT, mix + stepm) : Math.max(mixT, mix - stepm);
      animating = dirty = true;
    }
    for (const t of tickers) { if (t(dt, now)) { animating = dirty = true; } }
    if (dirty) {
      const gap = lastRender ? now - lastRender : 0;
      render();
      if (animating && gap > 0 && gap < 400) monitor(gap);
      lastRender = now;
    } else { last = 0; lastRender = 0; samples.length = 0; }
    if (animating || dirty) raf = requestAnimationFrame(loop);
  }
  function wake() { if (!raf && active && !disposed) { last = 0; raf = requestAnimationFrame(loop); } }

  ro.observe(parent());
  resize();

  /* sve teksture se otpremaju na GPU odmah (i one koje u prvom kadru nisu u vidnom polju), tek onda se dekodirane slike zatvaraju */
  function uploadAll() {
    M.root.traverse((o) => { if (o.isMesh) [].concat(o.material).forEach((m) => { if (m.map) renderer.initTexture(m.map); }); });
  }
  function freeBitmaps() {
    M.root.traverse((o) => {
      if (!o.isMesh) return;
      [].concat(o.material).forEach((m) => {
        for (const k in m) { const t = m[k]; if (t && t.isTexture && t.image && typeof t.image.close === 'function') { try { t.image.close(); } catch (e) { /* već zatvoreno */ } } }
      });
    });
  }

  /* zagrevanje (kompajl šejdera + otpremanje tekstura) pa probno merenje */
  onProgress(0.92);
  await new Promise((r) => setTimeout(r, 0));
  shown = 1; uploadAll(); render();
  try { if (renderer.compileAsync) await renderer.compileAsync(scene, cam); } catch (e) { /* nije kritično */ }
  if (disposed) return null;
  const gl = renderer.getContext(), ts = [];
  for (let i = 0; i < 6; i++) { const a = performance.now(); dirty = true; render(); gl.finish(); ts.push(performance.now() - a); }
  ts.splice(0, 2); ts.sort((a, b) => a - b);
  const bench = ts[Math.floor(ts.length / 2)];
  if (!q.has('keepbm')) freeBitmaps();
  if (bench > 140) { fail('probni kadar prespor (' + bench.toFixed(0) + ' ms)'); return null; }
  if (bench > tier.budget * 0.8) degrade('probni kadar ' + bench.toFixed(0) + ' ms');
  shown = target = 0; dirty = true; render();
  onProgress(1);

  const api = {
    renderer, scene, camera: cam, tierName, bench, model: M,
    get disposed() { return disposed; },
    get progress() { return shown; },
    get mix() { return mix; },
    get size() { return { W, H }; },
    setTarget(p) { target = Math.min(1, Math.max(0, p)); wake(); },
    jump(p) { target = shown = Math.min(1, Math.max(0, p)); dirty = true; if (active) wake(); else render(); },
    /** režim istraživanja: pose je živi objekat {pos,yaw,pitch,fov} koji menja kontroler; null = povratak na skrol putanju */
    setExplore(pose, on = !!pose, instant = false) { if (pose) explorePose = pose; mixT = on ? 1 : 0; if (instant) mix = mixT; dirty = true; wake(); },
    get exploring() { return mixT === 1; },
    invalidate() { dirty = true; wake(); },
    addTicker(fn) { tickers.add(fn); wake(); return () => tickers.delete(fn); },
    onFrame(fn) { frameCbs.add(fn); return () => frameCbs.delete(fn); },
    setActive(a) { if (disposed) return; active = a; if (a) { dirty = true; wake(); } else { cancelAnimationFrame(raf); raf = 0; } },
    get active() { return active; },
    renderNow() { if (!disposed) render(); },
    project, resize, dispose, applyPose,
    stats() {
      const i = renderer.info;
      return { calls: i.render.calls, tris: i.render.triangles, geoms: i.memory.geometries, textures: i.memory.textures, programs: i.programs?.length, pr: renderer.getPixelRatio(), canvas: [canvas.width, canvas.height], step, qScale, bench, raf: !!raf, tickers: tickers.size, frameCbs: frameCbs.size };
    },
    /** dev: kadar sa proizvoljnom kamerom (poster/galerija); `hide` = lista delova koji se ne crtaju; vraća JPEG blob */
    async shot({ pos, look, fov = 40, w = 1600, h = 1000, q: qual = 0.84, bg = null, hide = [], only = null, gain = 1, shift = null, type = 'image/jpeg' }) {
      const old = [renderer.getPixelRatio(), W, H], oldBg = scene.background;
      const vis = []; M.root.traverse((o) => { if (o.isMesh) vis.push([o, o.visible]); });
      if (only) vis.forEach(([o]) => { const k = o.name.replace(/^Modern_Bathroom_/, '').replace(/_0(_\d+)?$/, ''); o.visible = only.includes(k); });
      hide.forEach((k) => vis.forEach(([o]) => { if (o.name.includes(k)) o.visible = false; }));
      const gained = []; if (gain !== 1) M.root.traverse((o) => { if (o.isMesh && o.material?.color && !gained.includes(o.material)) { gained.push(o.material); o.material.color.multiplyScalar(gain); } });
      if (bg != null) { scene.background = new THREE.Color(bg); renderer.setClearColor(new THREE.Color(bg), 1); }
      renderer.setPixelRatio(1); renderer.setSize(w, h, false);
      cam.aspect = w / h; cam.fov = fov; cam.position.set(...pos); cam.lookAt(...look); if (shift && (shift.x || shift.y)) cam.setViewOffset(w, h, -w * shift.x, -h * shift.y, w, h); else cam.clearViewOffset(); cam.updateProjectionMatrix();
      renderer.render(scene, cam);
      const blob = await new Promise((r) => canvas.toBlob(r, type, qual));
      vis.forEach(([o, v]) => { o.visible = v; });
      gained.forEach((m) => m.color.multiplyScalar(1 / gain));
      scene.background = oldBg; renderer.setClearColor(0x101210, 1);
      renderer.setPixelRatio(old[0]); renderer.setSize(old[1], old[2], false); cam.aspect = old[1] / old[2];
      dirty = true; render();
      return blob;
    },
  };
  return api;
}
