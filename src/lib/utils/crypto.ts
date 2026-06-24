const HEX = '0123456789abcdef';

export function bytesAHex(bytes: Uint8Array): string {
	let out = '';
	for (let i = 0; i < bytes.byteLength; i++) {
		const b = bytes[i] ?? 0;
		out += HEX[(b >> 4) & 0x0f];
		out += HEX[b & 0x0f];
	}
	return out;
}

export function generarToken(bytes = 32): string {
	const buf = new Uint8Array(bytes);
	crypto.getRandomValues(buf);
	return bytesAHex(buf);
}

const BASE64_ALPHA =
	'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function bytesABase64(bytes: Uint8Array): string {
	let out = '';
	for (let i = 0; i < bytes.byteLength; i += 3) {
		const b0 = bytes[i] ?? 0;
		const b1 = bytes[i + 1] ?? 0;
		const b2 = bytes[i + 2] ?? 0;
		const triplet = (b0 << 16) | (b1 << 8) | b2;
		out += BASE64_ALPHA[(triplet >> 18) & 0x3f];
		out += BASE64_ALPHA[(triplet >> 12) & 0x3f];
		out += i + 1 < bytes.byteLength ? BASE64_ALPHA[(triplet >> 6) & 0x3f] : '=';
		out += i + 2 < bytes.byteLength ? BASE64_ALPHA[triplet & 0x3f] : '=';
	}
	return out;
}

export function base64ABytes(b64: string): Uint8Array {
	const limpio = b64.replace(/=+$/, '');
	const buf = new Uint8Array(Math.floor((limpio.length * 3) / 4));
	let p = 0;
	for (let i = 0; i < limpio.length; i += 4) {
		const c0 = BASE64_ALPHA.indexOf(limpio[i] ?? '=');
		const c1 = BASE64_ALPHA.indexOf(limpio[i + 1] ?? '=');
		const c2 = BASE64_ALPHA.indexOf(limpio[i + 2] ?? '=');
		const c3 = BASE64_ALPHA.indexOf(limpio[i + 3] ?? '=');
		const triplet =
			((c0 & 0x3f) << 18) |
			((c1 & 0x3f) << 12) |
			((c2 & 0x3f) << 6) |
			(c3 & 0x3f);
		if (p < buf.length) buf[p++] = (triplet >> 16) & 0xff;
		if (p < buf.length) buf[p++] = (triplet >> 8) & 0xff;
		if (p < buf.length) buf[p++] = triplet & 0xff;
	}
	return buf;
}