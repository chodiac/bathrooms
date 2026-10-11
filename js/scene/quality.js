/* Nivoi kvaliteta 3D scene. Početni nivo je konzervativan (heuristika uređaja); stvarno stanje određuju merenja:
   probno renderovanje pri pokretanju i trajanje kadrova tokom animacije. Nivo se samo SPUŠTA, na kraju je statični poster.
   Scena je „pečena" (unlit): nema svetala ni senki, pa je glavni trošak broj piksela i veličina tekstura. */
import { model as modelCfg } from '../../config/site.js';

export const TIERS = {
  high: { model: modelCfg.hd, dpr: 2,   px: 4.2e6, aa: true,  fps: 0,  budget: 22, aniso: 8 },
  mid:  { model: modelCfg.sd, dpr: 1.5, px: 2.0e6, aa: true,  fps: 0,  budget: 28, aniso: 4 },
  low:  { model: modelCfg.xs, dpr: 1,   px: 0.9e6, aa: false, fps: 30, budget: 42, aniso: 2 },
};

export function detect() {
  const q = new URLSearchParams(location.search);
  const forced = q.get('tier');
  const nav = navigator, conn = nav.connection || {};
  const mobile = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
  const mem = nav.deviceMemory, cores = nav.hardwareConcurrency || 4;
  const info = { mobile, mem, cores, saveData: !!conn.saveData, net: conn.effectiveType || null };
  if (forced && (forced === 'poster' || TIERS[forced])) return { tier: forced, reason: 'forsirano (?tier=)', ...info };
  if (q.get('motion') === 'reduce') return { tier: 'poster', reason: '?motion=reduce', ...info };
  if (conn.saveData) return { tier: 'poster', reason: 'uključena ušteda podataka', ...info };
  if (/(^|-)2g$/.test(conn.effectiveType || '') || conn.effectiveType === '3g') return { tier: 'poster', reason: 'spora mreža', ...info };
  if (mobile) {
    if ((mem && mem <= 2) || cores <= 2) return { tier: 'poster', reason: 'slab telefon (memorija/jezgra)', ...info };
    return { tier: 'low', reason: 'mobilni — konzervativan početak', ...info };
  }
  if ((mem && mem <= 2) || cores <= 2) return { tier: 'low', reason: 'slab računar', ...info };
  if ((mem || 4) >= 8 && cores >= 8) return { tier: 'high', reason: 'jak računar', ...info };
  return { tier: 'mid', reason: 'računar — standardno', ...info };
}

/** softverski renderer (SwiftShader, llvmpipe…) nije upotrebljiv za 3D */
export function isSoftwareGL(gl) {
  try {
    const e = gl.getExtension('WEBGL_debug_renderer_info');
    const name = e ? String(gl.getParameter(e.UNMASKED_RENDERER_WEBGL)) : '';
    return /swiftshader|llvmpipe|software|microsoft basic/i.test(name) ? name : '';
  } catch { return ''; }
}
