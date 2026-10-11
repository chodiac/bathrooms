/* Početna ispod 3D uvoda: kategorije, izbor proizvoda, „Kupujte po izgledu", inspiracija, usluge. */
import { esc, fmt, $, $$ } from '../lib/util.js';
import { categories, byId, productsOf, imgUrl, catById, fromPrice } from '../../data/catalog.js';
import { looks } from '../../data/looks.js';
import { policies, business } from '../../config/site.js';
import { productCard } from '../ui/card.js';
import { href } from '../router.js';

const FEATURED = ['kada-oval-170', 'baterija-lavabo-crna', 'lavabo-nadgradni-kamen', 'ogledalo-visoko', 'wc-konzolna'];
const ph = (v, t) => (v ? esc(v) : `<span class="ph">[${t}]</span>`);

function catGrid() {
  const order = ['kade', 'slavine', 'lavaboi', 'tus-kabine', 'namestaj', 'ogledala', 'galanterija', 'wc'];
  return `<div class="cgrid">${order.map((id, i) => { const c = catById[id]; return `
    <a class="ct ct--${i + 1}" href="${href.category(id)}">
      <span class="ct__img"><img src="${c.image}" alt="" loading="lazy" decoding="async" width="900" height="900" style="object-position:${c.focus}"></span>
      <span class="ct__t"><b>${esc(c.name)}</b><small>${productsOf(id).length} proizvoda</small></span>
    </a>`; }).join('')}</div>`;
}

function curated() {
  const [first, ...rest] = FEATURED.map((id) => byId[id]);
  return `<div class="cur">
    <a class="cur__lead" href="${href.product(first.id)}">
      <span class="cur__img"><img src="${imgUrl(first.images[0])}" alt="" loading="lazy" decoding="async" width="1400" height="1050"></span>
      <span class="cur__txt"><small>${esc(catById[first.cat].name)}</small><b>${esc(first.name)}</b><em>${esc(first.short)}</em><i>${fmt(first.price)}</i></span>
    </a>
    <div class="cur__list">${rest.map((p) => productCard(p)).join('')}</div>
  </div>`;
}

function looksHtml() {
  return `<div class="looks" id="looks">
    <div class="looks__tabs" role="tablist" aria-label="Izgledi">${looks.map((l, i) => `<button role="tab" type="button" id="lt-${l.id}" aria-selected="${i === 0}" aria-controls="lp-${l.id}" data-look="${i}">${esc(l.title)}</button>`).join('')}</div>
    ${looks.map((l, i) => `<div class="look" role="tabpanel" id="lp-${l.id}" aria-labelledby="lt-${l.id}" ${i ? 'hidden' : ''}>
      <div class="look__fig">
        <img src="${l.image}" alt="${esc(l.title)} — prikaz iz 3D kupatila" loading="lazy" decoding="async" width="1600" height="1100">
        ${Object.entries(l.pins).map(([pid, [x, y]], k) => `<a class="pin" href="${href.product(pid)}" style="left:${x}%;top:${y}%" data-pid="${pid}" aria-label="${k + 1} — ${esc(byId[pid].name)}"><span>${k + 1}</span></a>`).join('')}
      </div>
      <div class="look__side">
        <p class="look__t">${esc(l.text)}</p>
        <ol class="look__list">${Object.keys(l.pins).map((pid, k) => { const p = byId[pid]; return `<li data-pid="${pid}"><a href="${href.product(pid)}"><span class="n">${k + 1}</span><img src="${imgUrl(p.images[0])}" alt="" width="64" height="64" loading="lazy"><span class="t">${esc(p.name)}<small>${esc(catById[p.cat].name)}</small></span><b>${fmt(fromPrice(p))}</b></a></li>`; }).join('')}</ol>
      </div>
    </div>`).join('')}
  </div>`;
}

const INSP = [
  { img: 'ogledalo-2', cap: 'Ogledalo između dva zida od oraha', to: 'ogledala', cls: 'a' },
  { img: 'kada-3', cap: 'Kada pred velikim staklom', to: 'kade', cls: 'b' },
  { img: 'tus-4', cap: 'Pogled od tuša ka prozoru', to: 'tus-kabine', cls: 'c' },
];

export function homeBody() {
  return `
  <section class="sec" id="kategorije">
    <header class="sec__h"><div><p class="lab">Kategorije</p><h2>Sve za kupatilo,<br><em>od slavine do kade.</em></h2></div><a class="ul" href="${href.all()}">Cela kolekcija →</a></header>
    ${catGrid()}
  </section>

  <section class="sec sec--tint" id="izbor">
    <header class="sec__h"><div><p class="lab">Izbor</p><h2>Odabrano iz<br><em>kupatila.</em></h2></div></header>
    ${curated()}
  </section>

  <section class="sec" id="izgled">
    <header class="sec__h"><div><p class="lab">Kupujte po izgledu</p><h2>Kompozicija<br><em>pa proizvodi.</em></h2></div><p class="sec__p">Izaberite izgled, pa kroz brojeve pređite direktno na proizvode koji ga čine.</p></header>
    ${looksHtml()}
  </section>

  <section class="sec insp" id="inspiracija" aria-label="Inspiracija">
    <header class="sec__h"><div><p class="lab">Inspiracija</p><h2>Prostor, svetlo,<br><em>materijal.</em></h2></div></header>
    <div class="insp__g">${INSP.map((x) => `<a class="insp__i insp__i--${x.cls}" href="${href.category(x.to)}"><img src="assets/img/${x.img}.jpg" alt="" loading="lazy" decoding="async" width="1400" height="1050"><span>${esc(x.cap)}</span></a>`).join('')}</div>
  </section>

  <section class="sec svc" id="usluge">
    <header class="sec__h"><div><p class="lab">Usluge</p><h2>Pomoć pri izboru<br><em>i naručivanju.</em></h2></div></header>
    <div class="svc__g">
      <div><h3>Isporuka</h3><p>${policies.deliveryTime ? esc(policies.deliveryTime) : '<span class="ph">[uslovi i rokovi isporuke — nisu dostavljeni]</span>'}</p></div>
      <div><h3>Povraćaj</h3><p>${policies.returnsDays ? `Rok za povraćaj: ${policies.returnsDays} dana.` : '<span class="ph">[uslovi povraćaja — nisu dostavljeni]</span>'}</p></div>
      <div><h3>Savet</h3><p>Niste sigurni šta vam treba? Pošaljite dimenzije prostora i fotografiju. ${ph(business.email, 'e-pošta')}</p></div>
      <div><h3>Salon</h3><p>${ph(business.address, 'adresa salona')}<br>${ph(business.hours, 'radno vreme')}</p></div>
    </div>
  </section>`;
}

export function mountHome(root) {
  /* izgledi: tabovi + povezivanje pin ↔ stavka liste */
  const tabs = $$('[data-look]', root), panels = $$('.look', root);
  tabs.forEach((t) => t.addEventListener('click', () => {
    tabs.forEach((x) => x.setAttribute('aria-selected', String(x === t)));
    panels.forEach((p, i) => { p.hidden = i !== +t.dataset.look; });
  }));
  $$('.look', root).forEach((look) => {
    const set = (pid, on) => look.querySelectorAll(`[data-pid="${pid}"]`).forEach((el) => el.classList.toggle('is-hi', on));
    look.addEventListener('pointerover', (e) => { const el = e.target.closest('[data-pid]'); if (el) set(el.dataset.pid, true); });
    look.addEventListener('pointerout', (e) => { const el = e.target.closest('[data-pid]'); if (el) set(el.dataset.pid, false); });
    look.addEventListener('focusin', (e) => { const el = e.target.closest('[data-pid]'); if (el) set(el.dataset.pid, true); });
    look.addEventListener('focusout', (e) => { const el = e.target.closest('[data-pid]'); if (el) set(el.dataset.pid, false); });
  });
  /* mirni ulazak sekcija */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' }) : null;
  $$('.sec, .ct, .cur__lead, .insp__i, .svc__g > div', root).forEach((el) => { el.classList.add('rv'); io ? io.observe(el) : el.classList.add('in'); });
  return () => io?.disconnect();
}
