import { esc, fmt } from '../lib/util.js';
import { catById, fromPrice, imgUrl } from '../../data/catalog.js';
import { href } from '../router.js';

export function productCard(p, { cat = true, eager = false } = {}) {
  const from = fromPrice(p), varies = Object.values(p.variants || {}).some((g) => new Set(g.map((o) => o.delta || 0)).size > 1);
  const a = imgUrl(p.images[0]), b = p.images[1] ? imgUrl(p.images[1]) : '';
  return `<article class="pc">
    <a class="pc__img" href="${href.product(p.id)}" tabindex="-1" aria-hidden="true">
      <img src="${a}" alt="" width="700" height="875" ${eager ? '' : 'loading="lazy"'} decoding="async">
      ${b ? `<img class="pc__2" src="${b}" alt="" width="700" height="875" loading="lazy" decoding="async">` : ''}
    </a>
    <div class="pc__b">
      ${cat ? `<p class="pc__cat">${esc(catById[p.cat].name)}</p>` : ''}
      <h3 class="pc__n"><a href="${href.product(p.id)}">${esc(p.name)}</a></h3>
      <p class="pc__meta">${esc(p.finish)}${p.material ? ' · ' + esc(p.material) : ''}</p>
      <p class="pc__p">${varies ? '<span>od</span> ' : ''}${fmt(varies ? from : p.price)}</p>
    </div>
  </article>`;
}
