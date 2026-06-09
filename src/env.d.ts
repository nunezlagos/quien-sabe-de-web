/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type D1Database = import('@cloudflare/workers-types').D1Database;
type R2Bucket = import('@cloudflare/workers-types').R2Bucket;

interface Env {
	DB: D1Database;
	BUCKET: R2Bucket;
}

declare namespace App {
	interface Locals extends Env {}
}
