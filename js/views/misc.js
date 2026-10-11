/* Rezultati pretrage i informativne strane (dostava/povraćaj, kontakt). Podaci koji nisu dostavljeni prikazani su kao [placeholder]. */
import { esc, norm } from '../lib/util.js';
import { products, categories, catById } from '../../data/catalog.js';
import { business, policies, brand } from '../../config/site.js';
import { productCard } from '../ui/card.js';
import { href } from '../router.js';

export function searchView(route) {
  const q = (route.q.q || '').trim(), n = norm(q);
  const res = n ? products.filter((p) => norm([p.name, p.short, p.finish, p.material, catById[p.cat].name].join(' ')).includes(n)) : [];
  const cats = n ? categories.filter((c) => norm(c.name).includes(n)) : [];
  const html = `<section class="page cat"><nav class="crumbs" aria-label="Putanja"><a href="#/">Početna</a><span>/</span><span aria-current="page">Pretraga</span></nav>
    <header class="cat__h"><h1>${q ? `Rezultati za „${esc(q)}"` : 'Pretraga'}</h1><p>${res.length} ${res.length === 1 ? 'proizvod' : 'proizvoda'}</p></header>
    ${cats.length ? `<div class="search__cats search__cats--p">${cats.map((c) => `<a href="${href.category(c.id)}">${esc(c.name)}</a>`).join('')}</div>` : ''}
    ${res.length ? `<div class="pgrid">${res.map((p) => productCard(p)).join('')}</div>` : `<p class="cat__empty">${q ? 'Nema rezultata. Pokušajte kraći pojam ili pogledajte ' : 'Unesite pojam u pretragu ili pogledajte '}<a class="ul" href="${href.all()}">celu kolekciju</a>.</p>`}
  </section>`;
  return { title: q ? `Pretraga: ${q}` : 'Pretraga', html };
}

const ph = (v, t) => (v ? esc(v) : `<span class="ph">[${t}]</span>`);

export function infoView(route) {
  const id = route.params.id;
  let title, body;
  if (id === 'dostava') {
    title = 'Dostava i povraćaj';
    body = `<p>Uslovi isporuke i povraćaja još nisu dostavljeni, pa ovde ne navodimo rokove, cene ni garancije koje ne možemo da potvrdimo.</p>
      <dl class="specs specs--w">
        <div><dt>Cena isporuke</dt><dd>${policies.deliveryPrice ? esc(JSON.stringify(policies.deliveryPrice)) : '<span class="ph">[nije definisano]</span>'}</dd></div>
        <div><dt>Rok isporuke</dt><dd>${ph(policies.deliveryTime, 'nije definisano')}</dd></div>
        <div><dt>Rok za povraćaj</dt><dd>${policies.returnsDays ? `${policies.returnsDays} dana` : '<span class="ph">[nije definisano]</span>'}</dd></div>
        <div><dt>Garancija</dt><dd>${policies.warrantyMonths ? `${policies.warrantyMonths} meseci` : '<span class="ph">[nije definisano]</span>'}</dd></div>
      </dl>`;
  } else if (id === 'kontakt') {
    title = 'Kontakt';
    body = `<dl class="specs specs--w">
      <div><dt>Naziv firme</dt><dd>${ph(business.legalName, 'pun naziv firme')}</dd></div>
      <div><dt>Adresa salona</dt><dd>${ph(business.address, 'adresa')}</dd></div>
      <div><dt>Telefon</dt><dd>${ph(business.phone, 'telefon')}</dd></div>
      <div><dt>E-pošta</dt><dd>${ph(business.email, 'e-pošta')}</dd></div>
      <div><dt>Radno vreme</dt><dd>${ph(business.hours, 'radno vreme')}</dd></div>
    </dl>`;
  } else return { title: 'Nije pronađeno', html: `<section class="page"><h1>Strana nije pronađena</h1><p><a class="ul" href="#/">Početna</a></p></section>` };
  return { title, html: `<section class="page info"><nav class="crumbs" aria-label="Putanja"><a href="#/">Početna</a><span>/</span><span aria-current="page">${esc(title)}</span></nav><h1>${esc(title)}</h1>${body}<p class="demo">${esc(brand.demoNote)}</p></section>` };
}
