/* Stranica proizvoda: galerija (scroll-snap + sličice), izbor varijanti, količina, „Dodaj u korpu", specifikacije, srodni proizvodi. */
import { esc, fmt, $, $$, toast } from '../lib/util.js';
import { byId, catById, products, imgUrl, defaultSel, priceFor, selLabel, GROUP_LABEL } from '../../data/catalog.js';
import { hotspots } from '../../data/hotspots.js';
import { policies, business, brand } from '../../config/site.js';
import { cart } from '../store/cart.js';
import { productCard } from '../ui/card.js';
import { href } from '../router.js';

export function productView(route) {
  const p = byId[route.params.id];
  if (!p) return { title: 'Nije pronađeno', html: `<section class="page"><h1>Proizvod nije pronađen</h1><p><a class="ul" href="${href.all()}">Nazad na kolekciju</a></p></section>` };
  const cat = catById[p.cat];
  const sel = defaultSel(p);
  for (const g of Object.keys(p.variants || {})) { const v = route.q[g]; if (v && p.variants[g].some((o) => o.id === v)) sel[g] = v; }
  const hs = hotspots.find((h) => h.category === p.cat);
  const related = products.filter((x) => x.cat === p.cat && x.id !== p.id).concat(products.filter((x) => x.cat !== p.cat)).slice(0, 4);
  const specs = [...p.specs, ['Materijal', p.material], ['Završna obrada', p.finish]].filter(([, v], i, a) => v && a.findIndex(([k]) => k === a[i][0]) === i);

  const html = `<section class="page prod">
    <nav class="crumbs" aria-label="Putanja"><a href="#/">Početna</a><span>/</span><a href="${href.all()}">Kolekcija</a><span>/</span><a href="${href.category(cat.id)}">${esc(cat.name)}</a><span>/</span><span aria-current="page">${esc(p.name)}</span></nav>
    <div class="prod__grid">
      <div class="pg" id="pg" role="group" aria-roledescription="galerija" aria-label="Fotografije proizvoda">
        <div class="pg__track" id="pgTrack" tabindex="0">${p.images.map((n, i) => `<figure class="pg__s" data-i="${i}"><img src="${imgUrl(n)}" alt="${esc(p.name)} — fotografija ${i + 1} od ${p.images.length}" width="1400" height="1050" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} decoding="async"></figure>`).join('')}</div>
        ${p.images.length > 1 ? `<button class="pg__a pg__a--p" type="button" id="pgPrev" aria-label="Prethodna fotografija">‹</button><button class="pg__a pg__a--n" type="button" id="pgNext" aria-label="Sledeća fotografija">›</button>
        <div class="pg__th" id="pgTh">${p.images.map((n, i) => `<button type="button" data-i="${i}" aria-label="Fotografija ${i + 1}" ${i === 0 ? 'aria-current="true"' : ''}><img src="${imgUrl(n)}" alt="" width="120" height="90" loading="lazy"></button>`).join('')}</div>` : ''}
        <p class="pg__note">Ilustrativne fotografije iz 3D modela kupatila.</p>
      </div>
      <div class="prod__info">
        <p class="lab">${esc(cat.name)}</p>
        <h1>${esc(p.name)}</h1>
        <p class="prod__price" id="price">${fmt(priceFor(p, sel))}</p>
        <p class="prod__short">${esc(p.short)}</p>
        <form class="buy" id="buy" novalidate>
          ${Object.keys(p.variants || {}).map((g) => `<fieldset class="opt"><legend>${GROUP_LABEL[g] || g}: <b data-lab="${g}"></b></legend><div class="opt__r">${p.variants[g].map((o) => `<label class="opt__c"><input type="radio" name="${g}" value="${o.id}" ${sel[g] === o.id ? 'checked' : ''}><span>${esc(o.label)}${o.delta ? `<small>${o.delta > 0 ? '+' : '−'}${fmt(Math.abs(o.delta))}</small>` : ''}</span></label>`).join('')}</div></fieldset>`).join('')}
          <div class="buy__row">
            <div class="qty" role="group" aria-label="Količina"><button type="button" data-q="-1" aria-label="Smanji količinu">−</button><input id="qty" type="number" inputmode="numeric" min="1" max="99" value="1" aria-label="Količina"><button type="button" data-q="1" aria-label="Povećaj količinu">+</button></div>
            <button class="btn btn--dark buy__add" type="submit" id="add"><span>Dodaj u korpu</span></button>
          </div>
        </form>
        <p class="prod__avail">Dostupnost: <span class="ph">[nije povezano sa magacinom — demo]</span></p>
        <div class="prod__desc"><p>${esc(p.desc)}</p></div>
        <dl class="specs">${specs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
        <ul class="prod__svc">
          <li><b>Isporuka</b><span>${policies.deliveryTime ? esc(policies.deliveryTime) : '<span class="ph">[uslovi isporuke nisu dostavljeni]</span>'}</span></li>
          <li><b>Povraćaj</b><span>${policies.returnsDays ? `${policies.returnsDays} dana` : '<span class="ph">[uslovi povraćaja nisu dostavljeni]</span>'}</span></li>
          <li><b>Savet</b><span>${business.email ? esc(business.email) : '<span class="ph">[e-pošta]</span>'}</span></li>
        </ul>
        ${hs ? `<a class="ul prod__see" href="#/?pokazi=${hs.id}"><span class="n">${String(hs.n).padStart(2, '0')}</span> Pogledaj u 3D kupatilu →</a>` : ''}
      </div>
    </div>
    <section class="rel"><h2>Uz ovo<span>.</span></h2><div class="pgrid pgrid--4">${related.map((r) => productCard(r)).join('')}</div></section>
    <p class="demo">${esc(brand.demoNote)}</p>
  </section>`;

  const mount = (root) => {
    const track = $('#pgTrack', root), th = $('#pgTh', root);
    let idx = 0;
    const go = (i, smooth = true) => {
      i = Math.max(0, Math.min(p.images.length - 1, i));
      track.scrollTo({ left: i * track.clientWidth, behavior: smooth ? 'smooth' : 'instant' });
    };
    const mark = () => {
      const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
      if (i === idx) return; idx = i;
      $$('button', th || document.createElement('div')).forEach((b) => (+b.dataset.i === i ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
    };
    track.addEventListener('scroll', () => requestAnimationFrame(mark), { passive: true });
    th?.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) go(+b.dataset.i); });
    $('#pgPrev', root)?.addEventListener('click', () => go(idx - 1));
    $('#pgNext', root)?.addEventListener('click', () => go(idx + 1));
    track.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') { go(idx - 1); e.preventDefault(); } else if (e.key === 'ArrowRight') { go(idx + 1); e.preventDefault(); } });

    const form = $('#buy', root), qty = $('#qty', root);
    const cur = () => { const s = {}; for (const g of Object.keys(p.variants || {})) s[g] = form.elements[g].value; return s; };
    const paint = () => {
      const s = cur();
      $('#price', root).textContent = fmt(priceFor(p, s));
      for (const g of Object.keys(p.variants || {})) $(`[data-lab="${g}"]`, root).textContent = (p.variants[g].find((o) => o.id === s[g]) || {}).label || '';
      const q = Object.entries(s).map(([k, v]) => `${k}=${v}`).join('&');
      history.replaceState(null, '', `#/proizvod/${p.id}${q ? '?' + q : ''}`);
    };
    form.addEventListener('change', paint); paint();
    form.addEventListener('click', (e) => {
      const b = e.target.closest('[data-q]'); if (!b) return;
      qty.value = Math.max(1, Math.min(99, (+qty.value || 1) + +b.dataset.q));
    });
    qty.addEventListener('change', () => { qty.value = Math.max(1, Math.min(99, Math.floor(+qty.value) || 1)); });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const s = cur(), n = Math.max(1, Math.min(99, Math.floor(+qty.value) || 1));
      cart.add(p.id, s, n);
      const btn = $('#add', root); btn.classList.add('is-done'); btn.querySelector('span').textContent = 'Dodato ✓';
      setTimeout(() => { btn.classList.remove('is-done'); btn.querySelector('span').textContent = 'Dodaj u korpu'; }, 1600);
      toast(`${p.name}${selLabel(p, s) ? ' — ' + selLabel(p, s) : ''} · ${n} kom dodato u korpu.`, href.cart(), 'Pogledaj korpu');
    });
  };
  return { title: p.name, html, mount };
}
