/* Pokretanje: hash ruter, prikazi (početna ostaje montirana da se sačuva stanje showroom-a i skrol), zaglavlje, korpa, hero. */
import { $, esc } from './lib/util.js';
import { parseHash } from './router.js';
import { brand } from '../config/site.js';
import { initChrome, markNav } from './ui/chrome.js';
import { createPanel } from './ui/panel.js';
import { homeBody, mountHome } from './views/home.js';
import { categoryView } from './views/category.js';
import { productView } from './views/product.js';
import { cartView, checkoutView } from './views/cartview.js';
import { searchView, infoView } from './views/misc.js';
import { initHero } from './hero.js';

const root = document.documentElement;
const viewHome = $('#viewHome'), viewPage = $('#viewPage');
const panel = createPanel($('#hsPanel'));
const hero = initHero({ panel });
initChrome({ onExplore: () => { if (parseHash().name !== 'home') { location.hash = '#/?pokazi=_'; } else hero.enterExplore(0); } });

$('#homeBody').innerHTML = homeBody();
mountHome($('#homeBody'));

let unmount = null, homeScroll = 0, prevName = null, byLink = false;
const VIEWS = { category: categoryView, product: productView, cart: cartView, checkout: checkoutView, search: searchView, info: infoView };

addEventListener('click', (e) => {
  const a = e.target.closest('a');
  if (!a) return;
  const to = a.dataset.to;
  if (to) {
    e.preventDefault();
    const go = () => $('#' + to)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    if (parseHash().name !== 'home') { location.hash = '#/'; setTimeout(go, 60); } else go();
    return;
  }
  if (a.getAttribute('href')?.startsWith('#/')) {
    byLink = true;
    if (a.getAttribute('href') === location.hash || (a.getAttribute('href') === '#/' && parseHash().name === 'home' && !location.hash.includes('?'))) { if (parseHash().name === 'home') scrollTo({ top: 0, behavior: 'smooth' }); }
  }
}, true);

function render() {
  const route = parseHash();
  markNav(route);
  root.classList.remove('no-scroll');
  unmount?.(); unmount = null;
  if (prevName === 'home') homeScroll = scrollY;
  if (route.name === 'home') {
    viewPage.hidden = true; viewPage.innerHTML = ''; viewHome.hidden = false;
    document.title = `${brand.name} — Kupatila`;
    hero.setVisible(true);
    if (prevName && prevName !== 'home' && !byLink) scrollTo({ top: homeScroll, behavior: 'instant' });
    else if (prevName && prevName !== 'home') scrollTo({ top: 0, behavior: 'instant' });
    const id = route.q.pokazi;
    if (id) { history.replaceState(null, '', '#/'); setTimeout(() => (id === '_' ? hero.enterExplore(0) : hero.showHotspot(id)), 120); }
  } else {
    const v = (VIEWS[route.name] || (() => ({ title: 'Nije pronađeno', html: '<section class="page"><h1>Strana nije pronađena</h1><p><a class="ul" href="#/">Početna</a></p></section>' })))(route);
    viewHome.hidden = true; viewPage.hidden = false; viewPage.innerHTML = v.html;
    document.title = `${v.title} — ${brand.name}`;
    hero.setVisible(false);
    unmount = v.mount?.(viewPage) || null;
    scrollTo({ top: 0, behavior: 'instant' });
    const h1 = $('h1', viewPage); if (h1) { h1.tabIndex = -1; h1.focus({ preventScroll: true }); }
  }
  prevName = route.name; byLink = false;
}
addEventListener('hashchange', render);
render();
