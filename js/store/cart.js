/* Korpa: čuva se u localStorage (preživljava osvežavanje i prelaske između strana), sinhronizuje se između tabova.
   Cene se uvek računaju iz kataloga (data/catalog.js) — u korpi se čuva samo proizvod, izbor varijanti i količina. */
import { byId, priceFor, defaultSel, selLabel, imgUrl } from '../../data/catalog.js';
import { safe } from '../lib/util.js';

const KEY = 'kv.cart.v1';
const subs = new Set();
let items = (safe.get(KEY, []) || []).filter((l) => byId[l.pid]);

const keyOf = (pid, sel) => pid + '|' + Object.keys(sel || {}).sort().map((k) => `${k}=${sel[k]}`).join(',');
const emit = () => { safe.set(KEY, items.map(({ pid, sel, qty }) => ({ pid, sel, qty }))); subs.forEach((f) => f()); };

addEventListener('storage', (e) => {
  if (e.key !== KEY) return;
  items = (safe.get(KEY, []) || []).filter((l) => byId[l.pid]);
  subs.forEach((f) => f());
});

export const cart = {
  subscribe(f) { subs.add(f); return () => subs.delete(f); },
  lines() {
    return items.map((l) => {
      const p = byId[l.pid], unit = priceFor(p, l.sel);
      return { key: keyOf(l.pid, l.sel), p, sel: l.sel, qty: l.qty, unit, total: unit * l.qty, label: selLabel(p, l.sel), image: imgUrl(p.images[0]) };
    });
  },
  count() { return items.reduce((a, l) => a + l.qty, 0); },
  subtotal() { return this.lines().reduce((a, l) => a + l.total, 0); },
  add(pid, sel = defaultSel(byId[pid]), qty = 1) {
    const k = keyOf(pid, sel), ex = items.find((l) => keyOf(l.pid, l.sel) === k);
    if (ex) ex.qty = Math.min(99, ex.qty + qty); else items.push({ pid, sel, qty: Math.min(99, qty) });
    emit();
  },
  setQty(key, qty) {
    const l = items.find((x) => keyOf(x.pid, x.sel) === key); if (!l) return;
    qty = Math.floor(+qty); if (!(qty >= 1)) qty = 1; l.qty = Math.min(99, qty); emit();
  },
  remove(key) { items = items.filter((l) => keyOf(l.pid, l.sel) !== key); emit(); },
  clear() { items = []; emit(); },
};
