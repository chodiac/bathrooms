/* Hero: poster kadrovi (renderi iste scene) odmah, 3D se uključuje tek kad je stranica učitana i uređaj to podnosi.
   Skrol uvod je ograničen (pinovan hero ≈ 3–4 ekrana): progres P ∈ [0,1] vodi kameru napred i nazad, naslov se povlači,
   a hotspotovi se postepeno pojavljuju. „Istraži prostor" je odvojen režim (zaključan skrol, kamera pod kontrolom korisnika).
   Ako 3D ne može stabilno da radi, scena se ZAUSTAVLJA I OSLOBAĐA (dispose) i ostaje poster koji prati skrol + linkovi kategorija. */
import { detect } from './scene/quality.js';
import { hotspots } from '../data/hotspots.js';
import { VIEWS } from '../data/views.js';
import { scroll as scrollCfg } from '../config/site.js';
import { categories } from '../data/catalog.js';
import { href } from './router.js';
import { $, $$, sm, clamp01, esc } from './lib/util.js';

const VIEW_FOR = { slavine: 2, tus: 3, kada: 1, lavabo: 2, namestaj: 2, ogledalo: 2, galant: 2, wc: 4 };
const FRAMES = [0, 0.17, 0.33, 0.5, 0.67, 0.83, 1];
const root = document.documentElement;

export function initHero({ panel }) {
  if (window.__heroInit) return window.__hero;
  window.__heroInit = true;
  let canvas = $('#canvas');
  const hero = $('#pocetak'), pin = $('#pin'), status = $('#status'), host = $('#hsLayer'), xo = $('#xo'), xui = $('#xui');
  const intro = $('#intro'), cue = $('#cue'), endbar = $('#endbar'), fallback = $('#fallback'), skip = $('#skipIntro');
  const det = detect();
  const reduced = root.classList.contains('reduce');
  const state = { mode: 'poster', tier: det.tier, reason: det.reason, exploring: false, reduced, engine: null, hotspots: null, explorer: null };
  window.__heroMode = state;

  /* ---- visina skrol uvoda ---- */
  const screens = () => (innerWidth < 760 || innerHeight > innerWidth ? scrollCfg.heroScreens.mobile : scrollCfg.heroScreens.desktop);
  const setHeight = () => hero.style.setProperty('--screens', reduced ? 1 : screens());
  setHeight();
  if (reduced) hero.classList.add('is-static');

  const progress = () => {
    if (reduced) return 1;
    const r = hero.getBoundingClientRect(), len = hero.offsetHeight - innerHeight;
    return len > 0 ? clamp01(-r.top / len) : 1;
  };
  const heroEndY = () => { const len = hero.offsetHeight - innerHeight; return hero.getBoundingClientRect().top + scrollY + len; };

  /* ---- tipografija i kontrole uvoda ---- */
  function paint(P) {
    if (state.exploring) return;
    const v = reduced ? 1 : 1 - sm(0.05, 0.24, P);
    intro.style.opacity = v.toFixed(3);
    intro.style.visibility = v > 0.01 ? 'visible' : 'hidden';
    intro.style.transform = `translate3d(0,${((1 - v) * -34).toFixed(1)}px,0)`;
    intro.style.pointerEvents = v > 0.5 ? 'auto' : 'none';
    const c = reduced ? 0 : 1 - sm(0.02, 0.1, P);
    cue.style.opacity = c.toFixed(3);
    const e = reduced ? 1 : sm(0.8, 0.94, P);
    endbar.style.opacity = e.toFixed(3);
    endbar.style.transform = `translate3d(0,${((1 - e) * 22).toFixed(1)}px,0)`;
    endbar.style.visibility = e > 0.01 ? 'visible' : 'hidden';
    endbar.style.pointerEvents = e > 0.5 ? 'auto' : 'none';
    fallback.style.opacity = state.mode === 'poster' ? e.toFixed(3) : 0;
    skip.style.opacity = (1 - sm(0.9, 1, P)).toFixed(3);
    state.hotspots?.setReveal(reduced ? 1 : sm(0.74, 0.98, P));
    const over = hero.getBoundingClientRect().bottom > 72;
    root.classList.toggle('over-hero', over && !root.classList.contains('page-view'));
  }

  /* ---- poster kadrovi (lagan fallback i prvi prikaz) ---- */
  let imgs = [], posterSet = '';
  const portraitMQ = matchMedia('(max-aspect-ratio: 1/1)');
  const posters = $('#posters');
  function ensurePosters() {
    const set = portraitMQ.matches ? 'p' : 'l';
    if (imgs.length === FRAMES.length && posterSet === set) return;
    posterSet = set;
    const first = posters.querySelector('img');
    imgs = FRAMES.map((_, i) => {
      if (i === 0) { first.src = `assets/posters/${set}-0.jpg`; return first; }
      let im = posters.querySelector(`img[data-i="${i}"]`);
      if (!im) { im = new Image(); im.alt = ''; im.className = 'poster'; im.dataset.i = i; im.decoding = 'async'; im.width = 1600; im.height = 900; posters.appendChild(im); }
      im.src = `assets/posters/${set}-${i}.jpg`;
      return im;
    });
  }
  function paintPoster(P) {
    if (!imgs.length) return;
    let i = 0;
    while (i < FRAMES.length - 2 && P >= FRAMES[i + 1]) i++;
    const t = sm(FRAMES[i], FRAMES[i + 1], P);
    imgs.forEach((im, k) => { im.style.opacity = k === i ? 1 : k === i + 1 ? t.toFixed(3) : 0; });
  }
  portraitMQ.addEventListener('change', () => { if (state.mode === 'poster') { ensurePosters(); paintPoster(progress()); } });

  /* ---- skrol → kamera ---- */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      if (state.exploring) return;
      const P = progress();
      const eng = state.engine;
      if (eng && !eng.disposed) eng.setTarget(P); else paintPoster(P);
      paint(P);
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { setHeight(); const eng = state.engine; if (eng && !eng.disposed && !state.exploring) eng.jump(progress()); onScroll(); });

  /* ---- fallback: kategorije kao linkovi na završnom kadru ---- */
  fallback.innerHTML = `<p class="lab">Kategorije</p><ul>${categories.map((c) => `<li><a href="${href.category(c.id)}">${esc(c.name)}</a></li>`).join('')}</ul>`;

  /* ---- istraživanje ---- */
  const viewsEl = $('#xViews');
  viewsEl.innerHTML = VIEWS.map((v, i) => `<button type="button" data-v="${i}" aria-pressed="false"><b>${i + 1}</b><span>${esc(v.label)}</span></button>`).join('');
  let lastTrigger = null, later = null;
  function enterExplore(viewIdx = 0, trigger, done) {
    if (state.mode !== '3d') {
      if (det.tier !== 'poster' && !state.why) { later = () => enterExplore(viewIdx, trigger, done); startScene(); return true; }   // 3D se još učitava (ili je parkiran): otvori čim bude spreman
      root.classList.add('no3d'); hero.scrollIntoView({ block: 'start' }); return false;
    }
    if (state.exploring) { state.explorer.goTo(viewIdx); done?.(); return true; }
    lastTrigger = trigger || document.activeElement;
    panel.close({ restore: false });
    if (scrollY < heroEndY() - hero.offsetHeight * 0.5 || scrollY > heroEndY() + 4) {
      // izvan uvoda: vrati se na kraj skrol sekvence (instant), kamera se glatko prebacuje
      scrollTo({ top: heroEndY(), behavior: 'instant' });
    }
    state.exploring = true;
    root.classList.add('is-exploring');
    xo.setAttribute('aria-hidden', 'false'); xui.hidden = false;
    state.hotspots.setReveal(1);
    intro.style.visibility = 'hidden'; cue.style.opacity = 0;
    state.explorer.enter(viewIdx);
    if (reduced) state.engine.setExplore(null, true, true);
    $('#xViews button', xui)?.focus({ preventScroll: true });
    done?.();
    return true;
  }
  function exitExplore() {
    if (!state.exploring) return;
    state.exploring = false;
    state.explorer.exit();
    root.classList.remove('is-exploring');
    xo.setAttribute('aria-hidden', 'true'); xui.hidden = true;
    panel.close({ restore: false });
    if (reduced) state.engine.setExplore(null, false, true);
    const P = progress(); state.engine.setTarget(P); paint(P);
    (lastTrigger && document.contains(lastTrigger) ? lastTrigger : $('#btnExplore2'))?.focus({ preventScroll: true });
  }
  $('#xExit').addEventListener('click', exitExplore);
  $('#xReset').addEventListener('click', () => state.explorer?.reset());
  viewsEl.addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) state.explorer.goTo(+b.dataset.v); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && state.exploring) { e.preventDefault(); exitExplore(); } });
  ['#btnExplore', '#btnExplore2'].forEach((s) => $(s).addEventListener('click', (e) => enterExplore(0, e.currentTarget)));

  /* ---- odluka: poster ili 3D ---- */
  ensurePosters();
  const P0 = progress();
  paintPoster(P0); paint(P0);
  if (reduced) { paintPoster(1); }
  const goPoster = (why) => posterMode(why);

  function posterMode(why) {
    if (state.exploring) exitExplore();
    const eng = state.engine;
    state.hotspots?.dispose(); state.hotspots = null;
    state.explorer?.dispose(); state.explorer = null;
    if (eng) { try { eng.dispose(); } catch (e) { /* već oslobođeno */ } state.engine = null; }
    if (canvas && canvas.isConnected) canvas.classList.remove('live');
    status.hidden = true;
    hero.classList.add('poster-mode'); hero.classList.remove('scene-live');
    root.classList.add('no3d');
    fallback.hidden = false;
    Object.assign(state, { mode: 'poster', why });
    ensurePosters(); const P = progress(); paintPoster(P); paint(P);
    console.info('3D isključen → poster:', why);
  }

  let starting = false;
  async function startScene() {
    if (starting || state.engine) return;
    if (det.tier === 'poster') return posterMode(det.reason);
    if (root.classList.contains('page-view')) { state.parked = true; return; }   // početna nije prikazana — 3D se učitava tek pri povratku
    starting = true;
    status.hidden = false; status.textContent = '3D scena se učitava…';
    if (canvas.dataset.used) {            // kontekst jednom izgubljenog/oslobođenog canvasa se ne može ponovo koristiti
      const c = document.createElement('canvas'); c.id = 'canvas'; c.className = 'hero__canvas'; c.setAttribute('aria-hidden', 'true');
      canvas.replaceWith(c); canvas = c;
    }
    canvas.dataset.used = '1';
    try {
      const eng = await import('./scene/engine.js');
      if (!eng.webglAvailable()) { starting = false; return posterMode('WebGL nije dostupan'); }
      const [{ createHotspots }, { createExplorer }] = await Promise.all([import('./scene/hotspots.js'), import('./scene/explore.js')]);
      const e = await eng.createEngine({
        canvas, tierName: det.tier,
        onProgress: (p) => { status.textContent = `3D scena se učitava… ${Math.round(p * 100)}%`; },
        onFail: (why) => { starting = false; posterMode(why); },
        onTier: (t) => { state.degraded = t; console.info('3D kvalitet spušten:', t); },
      });
      starting = false;
      if (!e) return;
      state.engine = e;
      window.__scene = e;
      state.hotspots = createHotspots({ engine: e, host, list: hotspots, onOpen: (h, el) => panel.open(h, el) });
      state.explorer = createExplorer({
        engine: e, overlay: xo,
        onView: (i) => { $$('[data-v]', viewsEl).forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.v === i))); },
      });
      e.jump(progress()); paint(progress());
      canvas.classList.add('live');
      hero.classList.add('scene-live'); hero.classList.remove('poster-mode');
      root.classList.remove('no3d'); fallback.hidden = true;
      status.hidden = true;
      Object.assign(state, { mode: '3d', bench: +e.bench.toFixed(1) });
      // pauza van ekrana / u pozadini
      io?.disconnect();
      io = new IntersectionObserver((es) => state.engine && !state.engine.disposed && state.engine.setActive(es[0].isIntersecting && !document.hidden), { rootMargin: '150px' });
      io.observe(hero);
      const fn = later; later = null; fn?.();
    } catch (err) { starting = false; console.warn(err); posterMode(String(err.message || err)); }
  }
  let io = null;
  document.addEventListener('visibilitychange', () => { const e = state.engine; if (e && !e.disposed) e.setActive(!document.hidden && heroVisible()); });
  addEventListener('pagehide', () => { const e = state.engine; if (e && !e.disposed) e.setActive(false); });
  addEventListener('pageshow', () => {
    const e = state.engine; if (!e || e.disposed) return;
    if (e.renderer.getContext().isContextLost()) return posterMode('kontekst izgubljen u pozadini');
    e.setActive(heroVisible()); e.jump(progress());
  });
  const heroVisible = () => { const r = hero.getBoundingClientRect(); return r.bottom > -150 && r.top < innerHeight + 150 && r.height > 0; };

  const kick = () => {
    if (new URLSearchParams(location.search).get('now') === '1') { startScene(); return; }
    const go = () => { if (document.visibilityState === 'hidden') { document.addEventListener('visibilitychange', go, { once: true }); return; } startScene(); };
    (window.requestIdleCallback || ((f) => setTimeout(f, 300)))(go, { timeout: 2500 });
  };
  if (document.readyState === 'complete') kick(); else addEventListener('load', kick, { once: true });

  /* ---- spoljašnje komande (ruter, zaglavlje) ---- */
  function showHotspot(id) {
    const h = hotspots.find((x) => x.id === id); if (!h) return;
    enterExplore(VIEW_FOR[id] ?? 0, null, () => setTimeout(() => { if (state.exploring) panel.open(h, null); }, 900));
  }
  let awayT = 0;
  const api = {
    state, enterExplore, exitExplore, showHotspot, progress,
    /** ruter: početna je prikazana / sakrivena */
    setVisible(v) {
      clearTimeout(awayT);
      root.classList.toggle('page-view', !v);
      if (!v) root.classList.remove('over-hero');
      if (v) {
        const e = state.engine;
        if (e && !e.disposed) { e.setActive(heroVisible()); e.invalidate(); }
        else if (!starting && state.parked) { state.parked = false; startScene(); }
        onScroll();
      } else {
        if (state.exploring) exitExplore();
        panel.close({ restore: false });
        state.engine?.setActive(false);
        // dugo odsustvo sa početne: oslobodi GPU memoriju; vraća se pri povratku
        awayT = setTimeout(() => {
          if (state.engine && !state.engine.disposed) { posterMode('parkirano (dugo van početne)'); state.parked = true; state.why = null; }
        }, +new URLSearchParams(location.search).get('park') || 120000);
      }
    },
  };
  window.__hero = api;
  return api;
}
