import { mysqlTable, int, text, varchar, boolean, datetime, index, uniqueIndex, primaryKey } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull().default(''),
  role: varchar('role', { length: 20, enum: ['user', 'provider', 'admin'] }).notNull().default('user'),
  status: varchar('status', { length: 20, enum: ['active', 'banned'] }).notNull().default('active'),
  avatarUrl: text('avatar_url'),
  communeId: int('commune_id').references(() => communes.id, { onDelete: 'set null' }),
  interests: text('interests'),
  onboardedAt: datetime('onboarded_at'),
  acceptedTermsAt: datetime('accepted_terms_at'),
  consentEmailProduct: boolean('consent_email_product'),
  consentAnalytics: boolean('consent_analytics'),
  consentProfilePublic: boolean('consent_profile_public'),
  emailVerified: boolean('email_verified').notNull().default(false),
  emailVerificationToken: text('email_verification_token'),
  sessionToken: text('session_token'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
});

export const communes = mysqlTable('communes', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  region: varchar('region', { length: 100 }).notNull().default('Metropolitana'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
});

export const trades = mysqlTable('trades', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  symbol: varchar('symbol', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  category: varchar('category', { length: 30, enum: ['hogar', 'tecnologia', 'automotriz', 'educacion', 'salud_belleza', 'otros'] }).notNull().default('hogar'),
  description: text('description'),
  basePriceClp: int('base_price_clp'),
  imageUrl: text('image_url'),
  whatsapp: varchar('whatsapp', { length: 50 }),
  verified: boolean('verified').notNull().default(false),
  status: varchar('status', { length: 20, enum: ['active', 'paused'] }).notNull().default('active'),
  communeId: int('commune_id').references(() => communes.id, { onDelete: 'set null' }),
  availableNow: boolean('available_now').notNull().default(false),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
});

export const tradeCommunes = mysqlTable('trade_communes', {
  tradeId: int('trade_id').notNull().references(() => trades.id, { onDelete: 'cascade' }),
  communeId: int('commune_id').notNull().references(() => communes.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.tradeId, t.communeId] }),
}));

export const reviews = mysqlTable('reviews', {
  id: int('id').autoincrement().primaryKey(),
  tradeId: int('trade_id').notNull().references(() => trades.id, { onDelete: 'cascade' }),
  userId: int('user_id').references(() => users.id, { onDelete: 'set null' }),
  reviewerName: varchar('reviewer_name', { length: 255 }).notNull(),
  rating: int('rating').notNull(),
  body: text('body').notNull(),
  response: text('response'),
  respondedAt: datetime('responded_at'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
});

export const contactEvents = mysqlTable('contact_events', {
  id: int('id').autoincrement().primaryKey(),
  tradeId: int('trade_id').notNull().references(() => trades.id, { onDelete: 'cascade' }),
  visitorId: text('visitor_id'),
  userId: int('user_id').references(() => users.id, { onDelete: 'set null' }),
  eventType: varchar('event_type', { length: 20, enum: ['whatsapp', 'email', 'phone', 'profile'] }).notNull(),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
});

export type Usuario = typeof users.$inferSelect;
export type UsuarioNuevo = typeof users.$inferInsert;
export type Trade = typeof trades.$inferSelect;
export type TradeNuevo = typeof trades.$inferInsert;
export type Commune = typeof communes.$inferSelect;
export type Review = typeof reviews.$inferSelect;

export const favorites = mysqlTable('favorites', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tradeId: int('trade_id').notNull().references(() => trades.id, { onDelete: 'cascade' }),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
});

export const portfolioImages = mysqlTable('portfolio_images', {
  id: int('id').autoincrement().primaryKey(),
  tradeId: int('trade_id').notNull().references(() => trades.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  caption: text('caption'),
  sortOrder: int('sort_order').notNull().default(0),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
});

export const adminAuditLog = mysqlTable('admin_audit_log', {
  id: int('id').autoincrement().primaryKey(),
  adminId: int('admin_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 255 }).notNull(),
  entityType: varchar('entity_type', { length: 100 }),
  entityId: int('entity_id'),
  details: text('details'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
});

export const appSettings = mysqlTable('app_settings', {
  id: int('id').autoincrement().primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: text('value').notNull(),
  updatedAt: datetime('updated_at').$defaultFn(() => new Date()),
});

export const userViews = mysqlTable('user_views', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tradeId: int('trade_id').notNull().references(() => trades.id, { onDelete: 'cascade' }),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (t) => ({
  byUserCreatedDesc: index('idx_user_views_user_created').on(t.userId, t.createdAt),
  uniqueView: uniqueIndex('uq_user_views_user_trade').on(t.userId, t.tradeId),
}));

export type ContactEvent = typeof contactEvents.$inferSelect;

export const donations = mysqlTable('donations', {
  id: int('id').autoincrement().primaryKey(),
  provider: varchar('provider', { length: 20, enum: ['mercadopago', 'webpay'] }).notNull(),
  externalId: varchar('external_id', { length: 255 }),
  amountClp: int('amount_clp').notNull(),
  status: varchar('status', { length: 20, enum: ['pending', 'approved', 'rejected', 'refunded', 'abandoned'] }).notNull().default('pending'),
  payerEmail: varchar('payer_email', { length: 255 }),
  userId: int('user_id').references(() => users.id, { onDelete: 'set null' }),
  recurring: boolean('recurring').notNull().default(false),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
  updatedAt: datetime('updated_at').$defaultFn(() => new Date()),
});

export type Donation = typeof donations.$inferSelect;

export const userRoles = mysqlTable('user_roles', {
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20, enum: ['user', 'provider', 'admin'] }).notNull(),
  grantedAt: datetime('granted_at').$defaultFn(() => new Date()),
  grantedBy: int('granted_by').references(() => users.id, { onDelete: 'set null' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.role] }),
}));

export const eventsLog = mysqlTable('events_log', {
  id: int('id').autoincrement().primaryKey(),
  event: varchar('event', { length: 30, enum: ['signup', 'search', 'contact', 'review', 'donation', 'ticket_open'] }).notNull(),
  actorRole: varchar('actor_role', { length: 20, enum: ['anonymous', 'user', 'provider', 'admin'] }).notNull(),
  propsJson: text('props_json').notNull().default('{}'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (t) => ({
  byEvent: index('idx_events_log_event').on(t.event),
  byEventCreatedDesc: index('idx_events_log_event_created').on(t.event, t.createdAt),
}));

export type UserRole = typeof userRoles.$inferSelect;
export type EventLog = typeof eventsLog.$inferSelect;

export const providerAvailability = mysqlTable('provider_availability', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  dayOfWeek: int('day_of_week').notNull(),
  startTime: varchar('start_time', { length: 10 }).notNull(),
  endTime: varchar('end_time', { length: 10 }).notNull(),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (t) => ({
  uniqueSlot: uniqueIndex('uq_provider_availability_slot').on(t.userId, t.dayOfWeek, t.startTime),
  byProvider: index('idx_provider_availability_user').on(t.userId),
}));

export const tickets = mysqlTable('tickets', {
  id: int('id').autoincrement().primaryKey(),
  kind: varchar('kind', { length: 30, enum: ['suplantacion', 'mal_servicio', 'contenido', 'consulta'] }).notNull(),
  status: varchar('status', { length: 20, enum: ['abierto', 'en_revision', 'cerrado'] }).notNull().default('abierto'),
  assigneeAdminId: int('assignee_admin_id').references(() => users.id, { onDelete: 'set null' }),
  targetProviderId: int('target_provider_id').references(() => trades.id, { onDelete: 'cascade' }),
  createdByUserId: int('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  contactEmail: varchar('contact_email', { length: 255 }),
  subject: varchar('subject', { length: 255 }).notNull(),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (t) => ({
  byStatusCreated: index('idx_tickets_status_created').on(t.status, t.createdAt),
  byAssignee: index('idx_tickets_assignee').on(t.assigneeAdminId),
  byKind: index('idx_tickets_kind').on(t.kind),
  byUserProvider: index('idx_tickets_user_provider').on(t.createdByUserId, t.targetProviderId, t.status),
}));

export const ticketMessages = mysqlTable('ticket_messages', {
  id: int('id').autoincrement().primaryKey(),
  ticketId: int('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  sender: varchar('sender', { length: 20, enum: ['author', 'admin', 'system'] }).notNull(),
  body: text('body').notNull(),
  internalNote: boolean('internal_note').notNull().default(false),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (t) => ({
  byTicketPublic: index('idx_ticket_messages_ticket_public').on(t.ticketId, t.internalNote, t.createdAt),
}));

export const expenses = mysqlTable('expenses', {
  id: int('id').autoincrement().primaryKey(),
  description: varchar('description', { length: 255 }).notNull(),
  amountClp: int('amount_clp').notNull(),
  category: varchar('category', { length: 30, enum: ['hosting', 'dominio', 'marketing', 'legal', 'herramientas', 'otros'] }).notNull().default('otros'),
  receiptUrl: text('receipt_url'),
  createdBy: int('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (t) => ({
  byCreatedDesc: index('idx_expenses_created').on(t.createdAt),
}));

export const monthlyReports = mysqlTable('monthly_reports', {
  id: int('id').autoincrement().primaryKey(),
  yearMonth: varchar('year_month', { length: 7 }).notNull().unique(),
  totalDonations: int('total_donations').notNull().default(0),
  totalExpenses: int('total_expenses').notNull().default(0),
  pdfUrl: text('pdf_url'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
});

export const verificationDocuments = mysqlTable('verification_documents', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  kind: varchar('kind', { length: 30, enum: ['cedula', 'certificado', 'comprobante', 'otro'] }).notNull(),
  objectKey: varchar('object_key', { length: 255 }).notNull(),
  contentType: varchar('content_type', { length: 100 }).notNull(),
  uploadedAt: datetime('uploaded_at'),
  createdAt: datetime('created_at').$defaultFn(() => new Date()),
}, (t) => ({
  byUser: index('idx_verification_docs_user').on(t.userId),
}));

export type Ticket = typeof tickets.$inferSelect;
export type TicketNew = typeof tickets.$inferInsert;
export type TicketMessage = typeof ticketMessages.$inferSelect;
export type VerificationDocument = typeof verificationDocuments.$inferSelect;
