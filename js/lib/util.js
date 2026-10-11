import { currency } from '../../config/site.js';
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fmt = (n) => `${Math.round(n).toLocaleString(currency.locale)} ${currency.code}`;
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const sm = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'dj').replace(/č|ć/g, 'c').replace(/š/g, 's').replace(/ž/g, 'z');
export const safe = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* privatni režim */ } },
  sget(k, d = null) { try { const v = sessionStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  sset(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch { /* privatni režim */ } },
};
export function toast(msg, href, label) {
  const t = document.getElementById('toast'); if (!t) return;
  t.innerHTML = `<span>${esc(msg)}</span>${href ? `<a href="${href}">${esc(label || 'Pogledaj')}</a>` : ''}`;
  t.hidden = false; t.classList.remove('is-on'); void t.offsetWidth; t.classList.add('is-on');
  clearTimeout(toast._t); toast._t = setTimeout(() => { t.classList.remove('is-on'); setTimeout(() => { t.hidden = true; }, 300); }, 3800);
}
