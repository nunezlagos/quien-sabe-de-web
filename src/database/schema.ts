import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull().default(''),
  role: text('role', { enum: ['user', 'provider', 'admin'] }).notNull().default('user'),
  status: text('status', { enum: ['active', 'banned'] }).notNull().default('active'),
  avatarUrl: text('avatar_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const communes = sqliteTable('communes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  region: text('region').notNull().default('Metropolitana'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export type Usuario = typeof users.$inferSelect;
export type UsuarioNuevo = typeof users.$inferInsert;