import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull().default(''),
  role: text('role', { enum: ['user', 'provider', 'admin'] }).notNull().default('user'),
  status: text('status', { enum: ['active', 'banned'] }).notNull().default('active'),
  avatarUrl: text('avatar_url'),
  consentEmailProduct: integer('consent_email_product', { mode: 'boolean' }),
  consentAnalytics: integer('consent_analytics', { mode: 'boolean' }),
  consentProfilePublic: integer('consent_profile_public', { mode: 'boolean' }),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  emailVerificationToken: text('email_verification_token'),
  sessionToken: text('session_token'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const communes = sqliteTable('communes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  region: text('region').notNull().default('Metropolitana'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

/**
 * Trades = oficios (no confundir con stock trades).
 * Modelo MVP: cada provider tiene 1..N oficios/trades que ofrece.
 */
export const trades = sqliteTable('trades', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  symbol: text('symbol').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  category: text('category', { enum: ['hogar', 'tecnologia', 'automotriz', 'educacion', 'salud_belleza', 'otros'] }).notNull().default('hogar'),
  description: text('description'),
  basePriceClp: integer('base_price_clp'),
  imageUrl: text('image_url'),
  whatsapp: text('whatsapp'),
  verified: integer('verified', { mode: 'boolean' }).notNull().default(false),
  status: text('status', { enum: ['active', 'paused'] }).notNull().default('active'),
  communeId: integer('commune_id').references(() => communes.id, { onDelete: 'set null' }),
  availableNow: integer('available_now', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

/**
 * Cobertura: en qué comunas atiende cada trade.
 */
export const tradeCommunes = sqliteTable('trade_communes', {
  tradeId: integer('trade_id').notNull().references(() => trades.id, { onDelete: 'cascade' }),
  communeId: integer('commune_id').notNull().references(() => communes.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: [t.tradeId, t.communeId],
}));

/**
 * Reviews de vecinos a providers.
 */
export const reviews = sqliteTable('reviews', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tradeId: integer('trade_id').notNull().references(() => trades.id, { onDelete: 'cascade' }),
  reviewerName: text('reviewer_name').notNull(),
  rating: integer('rating').notNull(),
  body: text('body').notNull(),
  response: text('response'),
  respondedAt: integer('responded_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

/**
 * Contact events: track whatsapp/email clicks from public profiles.
 */
export const contactEvents = sqliteTable('contact_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tradeId: integer('trade_id').notNull().references(() => trades.id, { onDelete: 'cascade' }),
  visitorId: text('visitor_id'),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  eventType: text('event_type', { enum: ['whatsapp', 'email', 'phone', 'profile'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export type Usuario = typeof users.$inferSelect;
export type UsuarioNuevo = typeof users.$inferInsert;
export type Trade = typeof trades.$inferSelect;
export type TradeNuevo = typeof trades.$inferInsert;
export type Commune = typeof communes.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type ContactEvent = typeof contactEvents.$inferSelect;