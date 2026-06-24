import type { APIRoute } from 'astro';
import { getTransparencySummary } from '../../../../../lib/services/transparency';

export const prerender = false;

export const GET: APIRoute = async () => {
	try {
		const data = await getTransparencySummary();
		return new Response(JSON.stringify(data), {
			status: 200,
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
				'Cache-Control': 'public, max-age=300, s-maxage=300',
			},
		});
	} catch (err) {
		console.error('GET /api/v1/public/transparency/summary failed', err);
		return new Response(JSON.stringify({ error: 'internal_error' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
				'Cache-Control': 'public, max-age=300, s-maxage=300',
			},
		});
	}
};
