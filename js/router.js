/* Hash ruter: #/ · #/kategorija/:id · #/kolekcija · #/proizvod/:id · #/korpa · #/naplata · #/trazi?q= · #/info/:id */
export function parseHash(hash = location.hash) {
  const raw = (hash || '').replace(/^#/, '');
  if (!raw.startsWith('/')) return { name: 'home', params: {}, q: {}, key: 'home' };
  const [path, qs] = raw.split('?');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  const q = Object.fromEntries(new URLSearchParams(qs || ''));
  const [a, b] = parts;
  let name = 'home', params = {};
  if (a === 'kategorija' && b) { name = 'category'; params = { id: b }; }
  else if (a === 'kolekcija') { name = 'category'; params = { id: 'sve' }; }
  else if (a === 'proizvod' && b) { name = 'product'; params = { id: b }; }
  else if (a === 'korpa') name = 'cart';
  else if (a === 'naplata') name = 'checkout';
  else if (a === 'trazi') name = 'search';
  else if (a === 'info' && b) { name = 'info'; params = { id: b }; }
  return { name, params, q, key: path };
}
export const href = {
  home: () => '#/', category: (id) => `#/kategorija/${id}`, all: () => '#/kolekcija', product: (id) => `#/proizvod/${id}`,
  cart: () => '#/korpa', checkout: () => '#/naplata', search: (q) => `#/trazi?q=${encodeURIComponent(q)}`, info: (id) => `#/info/${id}`,
};
