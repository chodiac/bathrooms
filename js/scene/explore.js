/* Režim „Istraži prostor": ograničeno razgledanje (prevlačenje), približavanje (točkić/pinch/tasteri) i prelazak između pogleda.
   Kamera ne može kroz zidove, pod, plafon ni predmete (CAM_BOX + BLOCKERS); uglovi su ograničeni. Odvojeno od skrol uvoda:
   dok je aktivno, overlay hvata pokazivač, a skrol stranice je zaključan od strane hero.js. */
import * as THREE from 'three';
import { VIEWS, EXPLORE_LIMITS, viewPose, constrain, routeBetween, dirFromYawPitch } from './camera.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ease = (t) => t * t * (3 - 2 * t);
const wrapPI = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };

export function createExplorer({ engine, overlay, onView = () => {}, onActive = () => {} }) {
  const pose = { pos: new THREE.Vector3(), yaw: 0, pitch: 0, fov: 60 };
  let base = viewPose(0), view = 0, active = false;
  // „cilj" (gde korisnik želi) i „trenutno" (glatko prati)
  const tgt = { dyaw: 0, dpitch: 0, dolly: 0 }, cur = { dyaw: 0, dpitch: 0, dolly: 0 };
  let tw = null, removeTicker = null;
  const fwd = new THREE.Vector3(), tmp = new THREE.Vector3();
  const ptrs = new Map();
  let pinch0 = 0, vel = { yaw: 0, pitch: 0 };

  function compose() {
    // osnovna pozicija pogleda (ili tačka na putanji tokom prelaza) + pomak napred/nazad po horizontalnom pravcu pogleda
    const yaw = (tw ? tw.yaw : base.yaw) + cur.dyaw;
    fwd.set(Math.sin(base.yaw), 0, -Math.cos(base.yaw));
    tmp.copy(tw ? tw.pos : base.pos).addScaledVector(fwd, cur.dolly);
    constrain(tmp);
    pose.pos.copy(tmp);
    pose.yaw = yaw;
    pose.pitch = (tw ? tw.pitch : base.pitch) + cur.dpitch;
    pose.fov = (tw ? tw.fov : base.fov) - cur.dolly * 2.5;          // blagi „zoom" uz kretanje
  }

  function tick(dt) {
    if (!active) return false;
    let moving = false;
    if (tw) {
      tw.t = Math.min(1, tw.t + dt / tw.dur);
      const e = ease(tw.t);
      // putanja po segmentima proporcionalno dužini
      const d = e * tw.total; let acc = 0;
      for (let i = 0; i < tw.segs.length; i++) {
        const L = tw.segs[i];
        if (d <= acc + L || i === tw.segs.length - 1) { tw.pos.lerpVectors(tw.path[i], tw.path[i + 1], L ? clamp((d - acc) / L, 0, 1) : 1); break; }
        acc += L;
      }
      tw.yaw = tw.y0 + wrapPI(tw.y1 - tw.y0) * e;
      tw.pitch = tw.p0 + (tw.p1 - tw.p0) * e;
      tw.fov = tw.f0 + (tw.f1 - tw.f0) * e;
      cur.dyaw = tw.o0.dyaw * (1 - e); cur.dpitch = tw.o0.dpitch * (1 - e); cur.dolly = tw.o0.dolly * (1 - e);
      tgt.dyaw = tgt.dpitch = tgt.dolly = 0;
      if (tw.t >= 1) { tw = null; }
      moving = true;
    } else {
      // inercija prevlačenja
      if (!ptrs.size && (Math.abs(vel.yaw) > 1e-4 || Math.abs(vel.pitch) > 1e-4)) {
        tgt.dyaw = clamp(tgt.dyaw + vel.yaw, -EXPLORE_LIMITS.yaw, EXPLORE_LIMITS.yaw);
        tgt.dpitch = clamp(tgt.dpitch + vel.pitch, -EXPLORE_LIMITS.pitchDown, EXPLORE_LIMITS.pitchUp);
        vel.yaw *= 0.9; vel.pitch *= 0.9;
      }
      const k = 1 - Math.exp(-dt / 0.09);
      for (const key of ['dyaw', 'dpitch', 'dolly']) {
        const d = tgt[key] - cur[key];
        if (Math.abs(d) > 1e-4) { cur[key] += d * k; moving = true; } else cur[key] = tgt[key];
      }
    }
    compose();
    return moving;
  }

  function goTo(i, { instant = false } = {}) {
    i = clamp(i, 0, VIEWS.length - 1);
    const next = viewPose(i);
    const from = pose.pos.clone();
    const path = routeBetween(from, next.pos);
    const segs = path.slice(1).map((p, k) => p.distanceTo(path[k]));
    const total = segs.reduce((a, b) => a + b, 0);
    const startFov = pose.fov, startYaw = pose.yaw, startPitch = pose.pitch;
    base = next; view = i; onView(i);
    cur.dolly = cur.dolly; // zadrži trenutno stanje pa ga uglađeno ugasi
    tw = {
      t: instant ? 1 : 0, dur: clamp(0.9 + total * 0.22, 1.0, 2.1), path, segs, total,
      pos: from.clone(), y0: startYaw, y1: next.yaw, p0: startPitch, p1: next.pitch, f0: startFov, f1: next.fov,
      yaw: startYaw, pitch: startPitch, fov: startFov,
      o0: { dyaw: 0, dpitch: 0, dolly: cur.dolly },
    };
    cur.dyaw = 0; cur.dpitch = 0; tgt.dyaw = tgt.dpitch = 0; tgt.dolly = 0; vel.yaw = vel.pitch = 0;
    engine.invalidate();
  }

  /* ---- pokazivač ---- */
  const radPerPx = () => THREE.MathUtils.degToRad(pose.fov) / Math.max(300, engine.size.H);
  function onDown(e) {
    if (!active) return;
    overlay.setPointerCapture?.(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    vel.yaw = vel.pitch = 0;
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); }
    overlay.classList.add('is-drag');
  }
  function onMove(e) {
    const p = ptrs.get(e.pointerId); if (!p || !active) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (ptrs.size === 1) {
      const k = radPerPx();
      const dyaw = -dx * k, dpitch = dy * k * 0.8;   // „hvatanje" scene
      tgt.dyaw = clamp(tgt.dyaw + dyaw, -EXPLORE_LIMITS.yaw, EXPLORE_LIMITS.yaw);
      tgt.dpitch = clamp(tgt.dpitch + dpitch, -EXPLORE_LIMITS.pitchDown, EXPLORE_LIMITS.pitchUp);
      vel.yaw = dyaw * 0.6; vel.pitch = dpitch * 0.6;
      if (tw) tw = null;
    } else if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch0) dolly((d - pinch0) * 0.006);
      pinch0 = d;
    }
    engine.invalidate();
  }
  function onUp(e) {
    ptrs.delete(e.pointerId);
    overlay.releasePointerCapture?.(e.pointerId);
    if (!ptrs.size) overlay.classList.remove('is-drag');
    pinch0 = 0;
    engine.invalidate();
  }
  function dolly(dm) {
    const [lo, hi] = base.dolly;
    tgt.dolly = clamp(tgt.dolly + dm, lo, hi);
    if (tw) { tw = null; }
    engine.invalidate();
  }
  function onWheel(e) { if (!active) return; e.preventDefault(); dolly(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0012)); }
  function onKey(e) {
    if (!active) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    const step = THREE.MathUtils.degToRad(7);
    const nudge = (dy, dp) => { tgt.dyaw = clamp(tgt.dyaw + dy, -EXPLORE_LIMITS.yaw, EXPLORE_LIMITS.yaw); tgt.dpitch = clamp(tgt.dpitch + dp, -EXPLORE_LIMITS.pitchDown, EXPLORE_LIMITS.pitchUp); engine.invalidate(); };
    if (e.key === 'ArrowLeft') { nudge(-step, 0); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { nudge(step, 0); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { nudge(0, step); e.preventDefault(); }
    else if (e.key === 'ArrowDown') { nudge(0, -step); e.preventDefault(); }
    else if (e.key === '+' || e.key === '=') dolly(0.2);
    else if (e.key === '-' || e.key === '_') dolly(-0.2);
    else if (/^[1-9]$/.test(e.key) && +e.key <= VIEWS.length) goTo(+e.key - 1);
  }

  overlay.addEventListener('pointerdown', onDown);
  overlay.addEventListener('pointermove', onMove);
  overlay.addEventListener('pointerup', onUp);
  overlay.addEventListener('pointercancel', onUp);
  overlay.addEventListener('wheel', onWheel, { passive: false });
  document.addEventListener('keydown', onKey);

  return {
    get active() { return active; },
    get view() { return view; },
    pose,
    enter(i = 0) {
      if (active) return;
      active = true;
      base = viewPose(i); view = i; tw = null;
      cur.dyaw = cur.dpitch = cur.dolly = 0; tgt.dyaw = tgt.dpitch = tgt.dolly = 0;
      compose();
      engine.setExplore(pose, true);
      removeTicker = engine.addTicker(tick);
      onView(i); onActive(true);
    },
    exit() {
      if (!active) return;
      active = false;
      ptrs.clear(); overlay.classList.remove('is-drag');
      engine.setExplore(null, false);
      // ticker se uklanja kad povratak (mix → 0) završi, a ovde odmah prestaje da menja pozu
      removeTicker?.(); removeTicker = null;
      onActive(false);
    },
    goTo, reset() { goTo(view); }, dolly,
    dispose() {
      overlay.removeEventListener('pointerdown', onDown); overlay.removeEventListener('pointermove', onMove);
      overlay.removeEventListener('pointerup', onUp); overlay.removeEventListener('pointercancel', onUp);
      overlay.removeEventListener('wheel', onWheel); document.removeEventListener('keydown', onKey);
      removeTicker?.();
    },
  };
}
