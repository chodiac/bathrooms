/* Zaglavlje (kategorije, pretraga, korpa), fioka za mobilni, podnožje. */
import { esc, $, $$, norm } from '../lib/util.js';
import { nav, brand, business, credits } from '../../config/site.js';
import { products, categories, imgUrl, catById, fromPrice } from '../../data/catalog.js';
import { cart } from '../store/cart.js';
import { href } from '../router.js';
import { fmt } from '../lib/util.js';

export function initChrome({ onExplore }) {
  const navHtml = nav.map((n) => `<a href="${href.category(n.id)}" data-nav="${n.id}">${esc(n.label)}</a>`).join('');
  $('#hdrNav').innerHTML = navHtml;
  $('#drawerNav').innerHTML = navHtml;

  /* broj u korpi */
  const cc = $('#cartCount');
  const paint = () => { const n = cart.count(); cc.textContent = n; cc.parentElement.classList.toggle('has', n > 0); cc.parentElement.setAttribute('aria-label', `Korpa, ${n} ${n === 1 ? 'artikal' : 'artikala'}`); };
  cart.subscribe(paint); paint();

  /* fioka */
  const drawer = $('#drawer'), menuBtn = $('#menuBtn');
  const setDrawer = (o) => {
    drawer.classList.toggle('is-open', o); drawer.setAttribute('aria-hidden', String(!o)); menuBtn.setAttribute('aria-expanded', String(o));
    document.documentElement.classList.toggle('no-scroll', o);
    if (o) $('input', drawer)?.focus({ preventScroll: true }); else menuBtn.focus({ preventScroll: true });
  };
  menuBtn.addEventListener('click', () => setDrawer(!drawer.classList.contains('is-open')));
  drawer.addEventListener('click', (e) => { if (e.target.closest('[data-close]') || e.target.closest('a')) setDrawer(false); });
  $('#drawerExplore').addEventListener('click', () => { setDrawer(false); onExplore(); });
  $('#drawerSearch').addEventListener('submit', (e) => { e.preventDefault(); const q = new FormData(e.target).get('q').trim(); setDrawer(false); if (q) location.hash = href.search(q); });

  /* pretraga */
  const sEl = $('#search'), sIn = $('#searchInput'), sRes = $('#searchRes');
  const setSearch = (o) => {
    sEl.classList.toggle('is-open', o); sEl.setAttribute('aria-hidden', String(!o));
    document.documentElement.classList.toggle('no-scroll', o);
    if (o) { sIn.value = ''; sRes.innerHTML = suggestions(''); setTimeout(() => sIn.focus(), 30); }
  };
  const suggestions = (q) => {
    const n = norm(q).trim();
    if (!n) return `<p class="lab">Kategorije</p><div class="search__cats">${categories.map((c) => `<a href="${href.category(c.id)}">${esc(c.name)}</a>`).join('')}</div>`;
    const cats = categories.filter((c) => norm(c.name).includes(n));
    const ps = products.filter((p) => norm([p.name, p.finish, p.material, catById[p.cat].name].join(' ')).includes(n)).slice(0, 6);
    if (!cats.length && !ps.length) return `<p class="search__none">Nema rezultata za „${esc(q)}".</p>`;
    return (cats.length ? `<p class="lab">Kategorije</p><div class="search__cats">${cats.map((c) => `<a href="${href.category(c.id)}">${esc(c.name)}</a>`).join('')}</div>` : '')
      + (ps.length ? `<p class="lab">Proizvodi</p><ul class="search__list">${ps.map((p) => `<li><a href="${href.product(p.id)}"><img src="${imgUrl(p.images[0])}" alt="" width="56" height="56" loading="lazy"><span>${esc(p.name)}<small>${esc(catById[p.cat].name)}</small></span><b>${fmt(fromPrice(p))}</b></a></li>`).join('')}</ul><a class="search__all" href="${href.search(q)}">Svi rezultati →</a>` : '');
  };
  $('#searchBtn').addEventListener('click', () => setSearch(true));
  sIn.addEventListener('input', () => { sRes.innerHTML = suggestions(sIn.value); });
  $('#searchForm').addEventListener('submit', (e) => { e.preventDefault(); const q = sIn.value.trim(); setSearch(false); if (q) location.hash = href.search(q); });
  sEl.addEventListener('click', (e) => { if (e.target.closest('[data-close]') || e.target.closest('a')) setSearch(false); });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (sEl.classList.contains('is-open')) setSearch(false); else if (drawer.classList.contains('is-open')) setDrawer(false); }
    if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement?.tagName || '') && !document.documentElement.classList.contains('is-exploring')) { e.preventDefault(); setSearch(true); }
  });
  $('#hdrExplore').addEventListener('click', onExplore);

  /* podnožje */
  const ph = (v, t) => (v ? esc(v) : `<span class="ph">[${t}]</span>`);
  $('#footer').innerHTML = `
    <div class="ftr__in">
      <div class="ftr__brand"><a class="logo logo--l" href="#/"><span class="logo__a">KAMEN <em>&amp;</em> VODA</span><span class="logo__b">Kupatila</span></a>
        <p>Kupatilski elementi i oprema, od slavina do kada. Pogledajte ih na svom mestu u 3D kupatilu.</p></div>
      <div><p class="lab">Kategorije</p><ul>${categories.map((c) => `<li><a href="${href.category(c.id)}">${esc(c.name)}</a></li>`).join('')}</ul></div>
      <div><p class="lab">Informacije</p><ul><li><a href="${href.info('dostava')}">Dostava i povraćaj</a></li><li><a href="${href.info('kontakt')}">Kontakt</a></li><li><a href="${href.all()}">Cela kolekcija</a></li><li><a href="${href.cart()}">Korpa</a></li></ul></div>
      <div><p class="lab">Kontakt</p><ul class="ftr__c"><li>${ph(business.address, 'adresa salona')}</li><li>${ph(business.phone, 'telefon')}</li><li>${ph(business.email, 'e-pošta')}</li><li>${ph(business.hours, 'radno vreme')}</li></ul></div>
    </div>
    <div class="ftr__bar"><p>${esc(brand.demoNote)}</p><p>3D model: <a href="${credits.modelUrl}" target="_blank" rel="noopener">${esc(credits.model)}</a></p></div>`;
  return { setDrawer, setSearch };
}

export function markNav(route) {
  const active = route.name === 'category' ? route.params.id : '';
  $$('[data-nav]').forEach((a) => { const on = a.dataset.nav === active; a.classList.toggle('is-on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
}
