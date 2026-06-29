/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

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
    container?: import('./lib/di/container').Container;
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    DB_HOST?: string;
    DB_PORT?: string;
    DB_USER?: string;
    DB_PASSWORD?: string;
    DB_NAME?: string;
    MINIO_ENDPOINT?: string;
    MINIO_PORT?: string;
    MINIO_ACCESS_KEY?: string;
    MINIO_SECRET_KEY?: string;
    MINIO_BUCKET?: string;
    MINIO_USE_SSL?: string;
    SESSION_SECRET?: string;
    SESSION_TTL_SECONDS?: string;
    PUBLIC_SITE_URL?: string;
    PORT?: string;
    HOST?: string;
  }
}
