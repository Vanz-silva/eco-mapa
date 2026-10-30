const store = new Map();

export async function cached(key, ttlMs, loader) {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = await loader();
  if (store.size >= 500) store.delete(store.keys().next().value); // teto de memória
  store.set(key, { value, expires: Date.now() + ttlMs });
  return value;
}

export const clearCache = () => store.clear();
