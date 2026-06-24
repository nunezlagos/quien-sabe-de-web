import { describe, it, expect } from 'vitest';
import { timingSafeEqual } from '../../../src/lib/utils/timing';

describe('timingSafeEqual', () => {
	it('retorna true para bytes idénticos', () => {
		const a = new Uint8Array([1, 2, 3, 4]);
		const b = new Uint8Array([1, 2, 3, 4]);
		expect(timingSafeEqual(a, b)).toBe(true);
	});

	it('retorna false para bytes distintos', () => {
		const a = new Uint8Array([1, 2, 3, 4]);
		const b = new Uint8Array([1, 2, 3, 5]);
		expect(timingSafeEqual(a, b)).toBe(false);
	});

	it('retorna false cuando las longitudes difieren', () => {
		const a = new Uint8Array([1, 2, 3]);
		const b = new Uint8Array([1, 2, 3, 4]);
		expect(timingSafeEqual(a, b)).toBe(false);
	});

	it('retorna true para arrays vacíos', () => {
		const a = new Uint8Array([]);
		const b = new Uint8Array([]);
		expect(timingSafeEqual(a, b)).toBe(true);
	});
});