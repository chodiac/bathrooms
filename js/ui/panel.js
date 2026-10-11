/* Pregled hotspota: galerija fotografija iz kategorije + put do kolekcije (ili proizvoda, ako postoji proveren odgovarajući proizvod).
   Radi bez hovera (dodir): desktop kao bočni panel, mobilni kao donji list. Nije modalan — 3D prikaz ostaje upotrebljiv. */
import { esc, fmt, $, $$ } from '../lib/util.js';
import { catById, productsOf, byId, imgUrl, fromPrice } from '../../data/catalog.js';
import { href } from '../router.js';

export function createPanel(root) {
  let current = null, trigger = null, closeT = 0;
  const pad = (n) => String(n).padStart(2, '0');

  function open(h, from) {
    clearTimeout(closeT);
    const cat = catById[h.category], list = productsOf(h.category), prod = h.product ? byId[h.product] : null;
    const dest = prod ? href.product(prod.id) : href.category(cat.id);
    const imgs = cat.gallery;
    current = h; trigger = from || document.activeElement;
    root.innerHTML = `
      <div class="sheet__in">
        <header class="sheet__h"><p class="lab"><span class="n">${pad(h.n)}</span> ${esc(cat.name)}</p><h2 id="hsTitle">${esc(h.name)}</h2>
          <button class="xbtn xbtn--d" type="button" data-close aria-label="Zatvori pregled"><span aria-hidden="true">✕</span></button></header>
        <div class="sheet__fig">
          <div class="sheet__main" id="shMain">${imgs.map((n, i) => `<img src="${imgUrl(n)}" alt="${esc(h.name)} — fotografija ${i + 1} od ${imgs.length}" ${i ? '' : ''} decoding="async" ${i === 0 ? 'class="on"' : ''} width="1400" height="1050">`).join('')}</div>
          <div class="sheet__th" role="group" aria-label="Fotografije">${imgs.map((n, i) => `<button type="button" data-i="${i}" aria-label="Fotografija ${i + 1}" ${i === 0 ? 'aria-current="true"' : ''}><img src="${imgUrl(n)}" alt="" width="120" height="90" decoding="async"></button>`).join('')}</div>
        </div>
        <p class="sheet__p">${esc(h.lede)}</p>
        <a class="btn btn--dark sheet__go" href="${dest}"><span>${prod ? 'Pogledaj proizvod' : `Pogledaj kolekciju (${list.length})`}</span></a>
        <ul class="sheet__l">${(prod ? [prod] : list.slice(0, 3)).map((p) => `<li><a href="${href.product(p.id)}"><img src="${imgUrl(p.images[0])}" alt="" width="72" height="72" loading="lazy"><span>${esc(p.name)}</span><b>${fmt(fromPrice(p))}</b></a></li>`).join('')}</ul>
        <p class="sheet__n">Fotografije su prikazi iz 3D modela kupatila.</p>
      </div>`;
    root.hidden = false;
    requestAnimationFrame(() => root.classList.add('is-open'));
    document.documentElement.classList.add('has-sheet');
    $('[data-close]', root).focus({ preventScroll: true });
  }
  function close({ restore = true } = {}) {
    if (!current) return;
    current = null;
    root.classList.remove('is-open');
    document.documentElement.classList.remove('has-sheet');
    closeT = setTimeout(() => { root.hidden = true; root.innerHTML = ''; }, 320);
    if (restore && trigger && document.contains(trigger)) trigger.focus({ preventScroll: true });
  }
  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) return close();
    const t = e.target.closest('.sheet__th button');
    if (t) {
      const i = +t.dataset.i;
      $$('#shMain img', root).forEach((im, k) => im.classList.toggle('on', k === i));
      $$('.sheet__th button', root).forEach((b) => (b === t ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
    }
    if (e.target.closest('a')) close({ restore: false });
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && current) { e.stopPropagation(); close(); } }, true);
  return { open, close, get current() { return current; } };
}
