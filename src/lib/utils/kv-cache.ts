type KVLike = {
	get(key: string): Promise<string | null>;
	put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
	delete(key: string): Promise<void>;
};

const cache = new Map<string, { value: string; expiresAt: number | null }>();
const ahoraSeg = () => Math.floor(Date.now() / 1000);

function leerCache(key: string): string | null {
	const entry = cache.get(key);
	if (!entry) return null;
	if (entry.expiresAt !== null && entry.expiresAt <= ahoraSeg()) {
		cache.delete(key);
		return null;
	}
	return entry.value;
}

/**
 * En `astro dev` con Cloudflare adapter, `runtime.env.SESSION` (KV) se recrea
 * por request, así que una escritura en el handler POST no es visible en el
 * siguiente GET. Este wrapper cachea lecturas/escrituras en memoria para
 * mantener consistencia dentro del proceso de dev. En producción, la KV real
 * ya es consistente, así que este cache es inocuo.
 */
export function kvConCache(real: KVLike): KVLike {
	return {
		async get(key) {
			const cached = leerCache(key);
			if (cached !== null) return cached;
			const realValue = await real.get(key);
			if (realValue !== null) {
				cache.set(key, { value: realValue, expiresAt: null });
			}
			return realValue;
		},
		async put(key, value, options) {
			const ttl = options?.expirationTtl;
			cache.set(key, {
				value,
				expiresAt: ttl ? ahoraSeg() + ttl : null,
			});
			return real.put(key, value, options);
		},
		async delete(key) {
			cache.delete(key);
			return real.delete(key);
		},
	};
}

export function resetKVCache() {
	cache.clear();
}