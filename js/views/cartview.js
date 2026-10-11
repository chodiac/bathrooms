/* Korpa i naplata. Nema backend-a ni platnog servisa: naplata je funkcionalna na frontendu (validacija, pregled, čuvanje nacrta
   porudžbine u pregledaču), ali se ništa ne šalje i ništa ne naplaćuje — to je jasno naznačeno korisniku. */
import { esc, fmt, $, $$, safe } from '../lib/util.js';
import { cart } from '../store/cart.js';
import { policies, business } from '../../config/site.js';
import { href } from '../router.js';

const deliveryLine = () => (policies.deliveryPrice != null && typeof policies.deliveryPrice === 'object'
  ? { known: true, amount: policies.deliveryPrice.flat || 0 } : { known: false, amount: 0 });

function summary(lines, { button } = {}) {
  const sub = lines.reduce((a, l) => a + l.total, 0), d = deliveryLine();
  return `<aside class="sum" aria-label="Pregled porudžbine">
    <h2>Pregled</h2>
    ${button === 'full' ? '' : `<ul class="sum__l">${lines.map((l) => `<li><span>${esc(l.p.name)}${l.label ? `<small>${esc(l.label)}</small>` : ''}<i>× ${l.qty}</i></span><b>${fmt(l.total)}</b></li>`).join('')}</ul>`}
    <dl class="sum__t">
      <div><dt>Međuzbir</dt><dd>${fmt(sub)}</dd></div>
      <div><dt>Isporuka</dt><dd>${d.known ? fmt(d.amount) : '<span class="ph">[cena isporuke nije definisana]</span>'}</dd></div>
      <div class="sum__g"><dt>Ukupno${d.known ? '' : ' (bez isporuke)'}</dt><dd id="grand">${fmt(sub + d.amount)}</dd></div>
    </dl>
    ${button === 'full' ? `<a class="btn btn--dark" href="${href.checkout()}"><span>Nastavi na naplatu</span></a><a class="ul sum__back" href="${href.all()}">Nastavi kupovinu</a>` : ''}
  </aside>`;
}

export function cartView() {
  const draw = (root) => {
    const lines = cart.lines();
    root.innerHTML = lines.length ? `
      <div class="cart__grid">
        <ul class="cl" aria-label="Artikli u korpi">${lines.map((l) => `<li class="cl__i" data-key="${esc(l.key)}">
          <a class="cl__img" href="${href.product(l.p.id)}"><img src="${l.image}" alt="" width="160" height="120" loading="lazy"></a>
          <div class="cl__t"><a href="${href.product(l.p.id)}">${esc(l.p.name)}</a>${l.label ? `<small>${esc(l.label)}</small>` : ''}<span class="cl__u">${fmt(l.unit)} / kom</span></div>
          <div class="qty qty--s" role="group" aria-label="Količina za ${esc(l.p.name)}"><button type="button" data-act="dec" aria-label="Smanji">−</button><input type="number" min="1" max="99" inputmode="numeric" value="${l.qty}" aria-label="Količina"><button type="button" data-act="inc" aria-label="Povećaj">+</button></div>
          <b class="cl__p">${fmt(l.total)}</b>
          <button class="cl__x" type="button" data-act="rm" aria-label="Ukloni ${esc(l.p.name)} iz korpe">Ukloni</button>
        </li>`).join('')}</ul>
        ${summary(lines, { button: 'full' })}
      </div>` : `<div class="cart__empty"><p>Korpa je prazna.</p><a class="btn btn--dark" href="${href.all()}"><span>Pogledaj kolekciju</span></a></div>`;
  };
  const html = `<section class="page cart"><nav class="crumbs" aria-label="Putanja"><a href="#/">Početna</a><span>/</span><span aria-current="page">Korpa</span></nav><h1>Korpa</h1><div id="cartBody"></div></section>`;
  const mount = (root) => {
    const body = $('#cartBody', root);
    const paint = () => { const a = document.activeElement; const had = a && body.contains(a) ? a.closest('[data-key]')?.dataset.key : null; draw(body); if (had) $(`[data-key="${CSS.escape(had)}"] input`, body)?.focus(); };
    body.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const li = b.closest('[data-key]'), key = li.dataset.key, input = $('input', li);
      if (b.dataset.act === 'rm') cart.remove(key);
      else cart.setQty(key, (+input.value || 1) + (b.dataset.act === 'inc' ? 1 : -1));
    });
    body.addEventListener('change', (e) => { const li = e.target.closest('[data-key]'); if (li && e.target.matches('input')) cart.setQty(li.dataset.key, e.target.value); });
    const off = cart.subscribe(paint);
    draw(body);
    return off;
  };
  return { title: 'Korpa', html, mount };
}

/* ---------------- naplata ---------------- */
const FIELDS = [
  ['ime', 'Ime i prezime', 'text', 'name', true],
  ['email', 'E-pošta', 'email', 'email', true],
  ['telefon', 'Telefon', 'tel', 'tel', true],
  ['adresa', 'Ulica i broj', 'text', 'street-address', true],
  ['grad', 'Grad', 'text', 'address-level2', true],
  ['posta', 'Poštanski broj', 'text', 'postal-code', true],
];
const RULES = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'Unesite ispravnu e-adresu.',
  telefon: (v) => /^[+\d][\d\s/().-]{5,}$/.test(v) || 'Unesite ispravan broj telefona.',
  posta: (v) => /^\d{5}$/.test(v) || 'Poštanski broj ima 5 cifara.',
};

export function checkoutView() {
  const lines = cart.lines();
  if (!lines.length) return { title: 'Naplata', html: `<section class="page cart"><h1>Naplata</h1><div class="cart__empty"><p>U korpi nema artikala.</p><a class="btn btn--dark" href="${href.all()}"><span>Pogledaj kolekciju</span></a></div></section>` };
  const saved = safe.get('kv.contact', {}) || {};
  const html = `<section class="page checkout"><nav class="crumbs" aria-label="Putanja"><a href="#/">Početna</a><span>/</span><a href="${href.cart()}">Korpa</a><span>/</span><span aria-current="page">Naplata</span></nav>
    <h1>Naplata</h1>
    <p class="chk__demo" role="note"><b>Demo režim.</b> Prodavnica još nije povezana sa sistemom za porudžbine i plaćanje. Ništa se ne šalje i ništa se ne naplaćuje.</p>
    <div class="cart__grid">
      <form class="form" id="chkForm" novalidate>
        <fieldset><legend>Kontakt i adresa isporuke</legend>
          <div class="form__g">${FIELDS.map(([n, l, t, ac, req]) => `<div class="fld fld--${n}"><label for="f-${n}">${l}${req ? ' <i>*</i>' : ''}</label><input id="f-${n}" name="${n}" type="${t}" autocomplete="${ac}" value="${esc(saved[n] || '')}" ${req ? 'required' : ''} aria-describedby="e-${n}"><p class="err" id="e-${n}" role="alert"></p></div>`).join('')}</div>
        </fieldset>
        <fieldset><legend>Isporuka</legend>
          <label class="radio"><input type="radio" name="isporuka" value="standard" checked><span>Standardna isporuka<small>${policies.deliveryTime ? esc(policies.deliveryTime) : '<span class="ph">[rok i cena isporuke nisu definisani]</span>'}</small></span></label>
        </fieldset>
        <fieldset><legend>Plaćanje</legend>
          ${policies.paymentMethods.map((m, i) => `<label class="radio"><input type="radio" name="placanje" value="${m.id}" ${i === 0 ? 'checked' : ''}><span>${esc(m.label)}${m.enabled ? '' : '<small><span class="ph">[nije povezano — demo]</span></small>'}</span></label>`).join('')}
        </fieldset>
        <div class="fld"><label for="f-nap">Napomena (neobavezno)</label><textarea id="f-nap" name="napomena" rows="3"></textarea></div>
        <label class="chkbox"><input type="checkbox" name="uslovi" required aria-describedby="e-uslovi"><span>Saglasan/saglasna sam sa uslovima kupovine. <span class="ph">[uslovi kupovine nisu dostavljeni]</span></span></label><p class="err" id="e-uslovi" role="alert"></p>
        <button class="btn btn--dark" type="submit"><span>Potvrdi porudžbinu (demo)</span></button>
      </form>
      ${summary(lines)}
    </div></section>`;
  const mount = (root) => {
    const form = $('#chkForm', root);
    const check = (el) => {
      const e = $(`#e-${el.name}`, root); if (!e) return true;
      let msg = '';
      if (el.type === 'checkbox') msg = el.checked ? '' : 'Potrebna je saglasnost za nastavak.';
      else if (el.required && !el.value.trim()) msg = 'Obavezno polje.';
      else if (RULES[el.name]) { const r = RULES[el.name](el.value.trim()); if (r !== true) msg = r; }
      e.textContent = msg; el.setAttribute('aria-invalid', String(!!msg));
      return !msg;
    };
    form.addEventListener('focusout', (e) => { if (e.target.matches('input[required]')) check(e.target); });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const els = $$('input[required]', form), bad = els.filter((el) => !check(el));
      if (bad.length) { bad[0].focus(); return; }
      const fd = Object.fromEntries(new FormData(form));
      safe.set('kv.contact', Object.fromEntries(FIELDS.map(([n]) => [n, fd[n] || ''])));
      const L = cart.lines(), sub = cart.subtotal();
      const order = { id: 'DEMO-' + Date.now().toString(36).toUpperCase(), at: new Date().toISOString(), contact: Object.fromEntries(FIELDS.map(([n]) => [n, fd[n]])), delivery: fd.isporuka, payment: fd.placanje, note: fd.napomena || '',
        lines: L.map((l) => ({ id: l.p.id, name: l.p.name, variant: l.label, qty: l.qty, unit: l.unit, total: l.total })), subtotal: sub, sent: false };
      const all = safe.get('kv.orders', []) || []; all.unshift(order); safe.set('kv.orders', all.slice(0, 10));
      root.innerHTML = `<section class="page checkout done"><h1>Porudžbina nije poslata</h1>
        <p class="chk__demo" role="status"><b>Demo režim.</b> Podaci su sačuvani samo u ovom pregledaču (nacrt <code>${esc(order.id)}</code>). Nije bilo slanja, rezervacije zaliha ni naplate.</p>
        <p>Da bi porudžbine stvarno radile, potrebno je povezati prodavnicu sa sistemom za porudžbine i platnim servisom — pogledajte README.</p>
        <div class="done__s">${summary(L, {}).replace('<aside', '<div').replace('</aside>', '</div>')}</div>
        <p><a class="btn btn--dark" href="${href.cart()}"><span>Nazad na korpu</span></a> <a class="btn btn--line" href="#/"><span>Početna</span></a></p></section>`;
      scrollTo({ top: 0 });
    });
  };
  return { title: 'Naplata', html, mount };
}
