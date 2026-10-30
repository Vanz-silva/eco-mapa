const store = new Map();

export async function cached(key, ttlMs, loader) {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = await loader();
  store.set(key, { value, expires: Date.now() + ttlMs });
  return value;
}

export const clearCache = () => store.clear();
