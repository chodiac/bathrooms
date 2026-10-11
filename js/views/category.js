/* Kategorija / cela kolekcija: filteri (kategorija, završna obrada, materijal, cena), sortiranje; stanje se pamti po kategoriji. */
import { esc, $, $$, safe } from '../lib/util.js';
import { categories, products, catById, fromPrice } from '../../data/catalog.js';
import { productCard } from '../ui/card.js';
import { href } from '../router.js';

const BUCKETS = [
  { id: 'b1', label: 'Do 20.000 RSD', test: (x) => x < 20000 },
  { id: 'b2', label: '20.000 – 100.000 RSD', test: (x) => x >= 20000 && x < 100000 },
  { id: 'b3', label: 'Preko 100.000 RSD', test: (x) => x >= 100000 },
];
const SORTS = [
  { id: 'preporuceno', label: 'Preporučeno', fn: () => 0 },
  { id: 'cena-rast', label: 'Cena: niža prvo', fn: (a, b) => fromPrice(a) - fromPrice(b) },
  { id: 'cena-opad', label: 'Cena: viša prvo', fn: (a, b) => fromPrice(b) - fromPrice(a) },
  { id: 'naziv', label: 'Naziv A–Ž', fn: (a, b) => a.name.localeCompare(b.name, 'sr-Latn') },
];
const uniq = (arr) => [...new Set(arr)].sort((a, b) => a.localeCompare(b, 'sr-Latn'));

export function categoryView(route) {
  const id = route.params.id, all = id === 'sve';
  const cat = all ? null : catById[id];
  if (!all && !cat) return { title: 'Nije pronađeno', html: `<section class="page"><h1>Kategorija nije pronađena</h1><p><a class="ul" href="${href.all()}">Cela kolekcija</a></p></section>` };
  const pool = all ? products : products.filter((p) => p.cat === id);
  const key = 'kv.f.' + id;
  const st = Object.assign({ sort: 'preporuceno', finish: [], material: [], price: [], cat: [] }, safe.sget(key, {}));
  if (route.q.sort && SORTS.some((s) => s.id === route.q.sort)) st.sort = route.q.sort;
  const finishes = uniq(pool.map((p) => p.finish)), materials = uniq(pool.map((p) => p.material));
  const group = (name, label, opts) => (opts.length < 2 ? '' : `<fieldset class="fg"><legend>${label}</legend>${opts.map((o) => `<label class="chk"><input type="checkbox" data-g="${name}" value="${esc(o.v)}"><span>${esc(o.l)}</span>${o.n != null ? `<i>${o.n}</i>` : ''}</label>`).join('')}</fieldset>`);
  const count = (fn) => pool.filter(fn).length;

  const html = `<section class="page cat">
    <nav class="crumbs" aria-label="Putanja"><a href="#/">Početna</a><span>/</span>${all ? '<span aria-current="page">Kolekcija</span>' : `<a href="${href.all()}">Kolekcija</a><span>/</span><span aria-current="page">${esc(cat.name)}</span>`}</nav>
    <header class="cat__h"><h1>${all ? 'Cela kolekcija' : esc(cat.name)}</h1><p>${all ? 'Svi proizvodi iz kupatila na jednom mestu.' : esc(cat.lede)}</p></header>
    <div class="cat__bar">
      <button class="btn btn--line cat__fbtn" type="button" id="fOpen" aria-controls="filters" aria-expanded="false"><span>Filteri <b id="fCount"></b></span></button>
      <p class="cat__n" id="resN" role="status" aria-live="polite"></p>
      <label class="sort"><span>Sortiranje</span><select id="sortSel">${SORTS.map((s) => `<option value="${s.id}">${s.label}</option>`).join('')}</select></label>
    </div>
    <div class="cat__body">
      <aside class="filters" id="filters" aria-label="Filteri">
        <div class="filters__h"><b>Filteri</b><button class="xbtn xbtn--d" type="button" id="fClose" aria-label="Zatvori filtere">✕</button></div>
        ${all ? group('cat', 'Kategorija', categories.map((c) => ({ v: c.id, l: c.name, n: count((p) => p.cat === c.id) }))) : ''}
        ${group('finish', 'Završna obrada', finishes.map((v) => ({ v, l: v, n: count((p) => p.finish === v) })))}
        ${group('material', 'Materijal', materials.map((v) => ({ v, l: v, n: count((p) => p.material === v) })))}
        ${group('price', 'Cena', BUCKETS.map((b) => ({ v: b.id, l: b.label, n: count((p) => b.test(fromPrice(p))) })))}
        <button class="ul filters__reset" type="button" id="fReset">Poništi filtere</button>
        <button class="btn btn--dark filters__apply" type="button" id="fApply"><span>Prikaži rezultate</span></button>
      </aside>
      <div class="cat__main"><div class="chips" id="chips"></div><div class="pgrid" id="pgrid"></div><p class="cat__empty" id="empty" hidden>Nema proizvoda za izabrane filtere. <button class="ul" type="button" id="fReset2">Poništi filtere</button></p></div>
    </div>
  </section>`;

  const mount = (root) => {
    const grid = $('#pgrid', root), chips = $('#chips', root), n = $('#resN', root), emp = $('#empty', root), sortSel = $('#sortSel', root), fEl = $('#filters', root);
    sortSel.value = st.sort;
    $$('input[data-g]', root).forEach((i) => { i.checked = st[i.dataset.g].includes(i.value); });
    const active = () => st.cat.length + st.finish.length + st.material.length + st.price.length;
    const labelOf = (g, v) => (g === 'cat' ? catById[v]?.name : g === 'price' ? BUCKETS.find((b) => b.id === v)?.label : v);
    function paint() {
      const list = pool.filter((p) =>
        (!st.cat.length || st.cat.includes(p.cat)) && (!st.finish.length || st.finish.includes(p.finish))
        && (!st.material.length || st.material.includes(p.material))
        && (!st.price.length || st.price.some((b) => BUCKETS.find((x) => x.id === b).test(fromPrice(p))))
      ).sort(SORTS.find((s) => s.id === st.sort).fn);
      grid.innerHTML = list.map((p, i) => productCard(p, { cat: all, eager: i < 3 })).join('');
      emp.hidden = list.length > 0;
      n.textContent = `${list.length} ${list.length === 1 ? 'proizvod' : 'proizvoda'}`;
      $('#fCount', root).textContent = active() ? `(${active()})` : '';
      chips.innerHTML = ['cat', 'finish', 'material', 'price'].flatMap((g) => st[g].map((v) => `<button type="button" class="chip" data-g="${g}" data-v="${esc(v)}">${esc(labelOf(g, v))} <i aria-hidden="true">✕</i><span class="sr">Ukloni filter</span></button>`)).join('');
      $('#fReset', root).hidden = !active();
      safe.sset(key, st);
    }
    root.addEventListener('change', (e) => {
      const i = e.target.closest('input[data-g]');
      if (i) { const a = st[i.dataset.g]; if (i.checked) a.push(i.value); else a.splice(a.indexOf(i.value), 1); paint(); }
      if (e.target === sortSel) { st.sort = sortSel.value; paint(); }
    });
    chips.addEventListener('click', (e) => {
      const c = e.target.closest('.chip'); if (!c) return;
      const a = st[c.dataset.g]; a.splice(a.indexOf(c.dataset.v), 1);
      $$(`input[data-g="${c.dataset.g}"]`, root).forEach((i) => { if (i.value === c.dataset.v) i.checked = false; });
      paint();
    });
    const reset = () => { st.cat = []; st.finish = []; st.material = []; st.price = []; $$('input[data-g]', root).forEach((i) => { i.checked = false; }); paint(); };
    $('#fReset', root).addEventListener('click', reset); $('#fReset2', root).addEventListener('click', reset);
    const setF = (o) => { fEl.classList.toggle('is-open', o); $('#fOpen', root).setAttribute('aria-expanded', String(o)); document.documentElement.classList.toggle('no-scroll', o && matchMedia('(max-width: 900px)').matches); };
    $('#fOpen', root).addEventListener('click', () => setF(true));
    $('#fClose', root).addEventListener('click', () => setF(false));
    $('#fApply', root).addEventListener('click', () => setF(false));
    paint();
    return () => document.documentElement.classList.remove('no-scroll');
  };
  return { title: all ? 'Kolekcija' : cat.name, html, mount };
}
