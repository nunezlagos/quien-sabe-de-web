/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type D1Database = import('@cloudflare/workers-types').D1Database;
type R2Bucket = import('@cloudflare/workers-types').R2Bucket;
type KVNamespace = import('@cloudflare/workers-types').KVNamespace;

interface Env {
	DB: D1Database;
	BUCKET: R2Bucket;
	SESSION: KVNamespace;
	SESSION_TTL_SECONDS?: string;
	PUBLIC_SITE_URL?: string;
}

declare namespace App {
	interface User {
		id: number;
		email: string;
		name: string;
		role: 'user' | 'provider' | 'admin';
		roles?: string[];
		activeRole?: string;
		status: 'active' | 'banned';
		onboardedAt?: Date | null;
	}

	interface Locals {
		user?: User;
		runtime: {
			env: Env;
			ctx?: {
				waitUntil?: (promise: Promise<unknown>) => void;
			};
		};
		container?: import('./lib/di/container').Container;
	}
}