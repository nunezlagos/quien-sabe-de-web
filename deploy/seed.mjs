import mysql from 'mysql2/promise';

const {
  DB_HOST = 'db',
  DB_PORT = '3306',
  DB_USER = 'quiensabe',
  DB_PASSWORD = 'quiensabe',
  DB_NAME = 'quiensabe',
} = process.env;

const conn = await mysql.createConnection({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
});

console.log('Seeding database...');

// --- Helpers ---
const PREFIJO = 'pbkdf2';
const ITERACIONES = 200_000;
const LONGITUD_SALT = 16;
const LONGITUD_HASH = 32;

function bytesABase64(bytes) {
  return Buffer.from(bytes).toString('base64');
}

async function hashContrasena(contrasena) {
  const salt = new Uint8Array(LONGITUD_SALT);
  crypto.getRandomValues(salt);
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(contrasena),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITERACIONES, hash: 'SHA-256' },
    material,
    LONGITUD_HASH * 8,
  );
  const hash = new Uint8Array(bits);
  return `${PREFIJO}$${ITERACIONES}$${bytesABase64(salt)}$${bytesABase64(hash)}`;
}

const DEMO_PASSWORD = 'Demo1234';
const passwordHash = await hashContrasena(DEMO_PASSWORD);

// --- Wipe in dependency order (idempotent reseed) ---
await conn.query('SET FOREIGN_KEY_CHECKS = 0');
for (const t of [
  'reviews',
  'favorites',
  'contact_events',
  'portfolio_images',
  'trades',
  'trade_communes',
  'users',
  'communes',
  'sessions',
  'password_resets',
  'user_roles',
  'role_audit',
  'audit_log',
  'trade_verifications',
  'rate_limit_log',
  'email_outbox',
  'events_log',
  'donations',
  'donor_display',
]) {
  try {
    await conn.query(`TRUNCATE TABLE \`${t}\``);
  } catch {
    /* table might not exist */
  }
}
await conn.query('SET FOREIGN_KEY_CHECKS = 1');

const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

// --- Communes (RM sample) ---
const communes = [
  ['Santiago', 'santiago'],
  ['Providencia', 'providencia'],
  ['Ñuñoa', 'nunoa'],
  ['Maipú', 'maipu'],
  ['Las Condes', 'las-condes'],
  ['Vitacura', 'vitacura'],
  ['La Florida', 'la-florida'],
  ['Puente Alto', 'puente-alto'],
];
for (const [name, slug] of communes) {
  await conn.query(
    'INSERT INTO communes (name, slug, region, created_at) VALUES (?, ?, ?, ?)',
    [name, slug, 'Metropolitana', now],
  );
}
const [[{ id: santiagoId }]] = await conn.query(
  "SELECT id FROM communes WHERE slug='santiago'",
);

// --- Demo users ---
const users = [
  ['vecino@demo.cl', 'María González', 'user'],
  ['prestador@demo.cl', 'Pedro Ramírez', 'provider'],
  ['admin@demo.cl', 'Carolina Pérez', 'admin'],
  ['juan@demo.cl', 'Juan Soto', 'user'],
  ['ana@demo.cl', 'Ana Morales', 'user'],
];
for (const [email, name, role] of users) {
  await conn.query(
    `INSERT INTO users
       (email, name, password_hash, role, status, email_verified, onboarded_at, accepted_terms_at, created_at)
     VALUES (?, ?, ?, ?, 'active', true, ?, ?, ?)`,
    [email, name, passwordHash, role, now, now, now],
  );
}

const [[{ id: prestadorId }]] = await conn.query(
  "SELECT id FROM users WHERE email='prestador@demo.cl'",
);
const [[{ id: vecinoId }]] = await conn.query(
  "SELECT id FROM users WHERE email='vecino@demo.cl'",
);

// --- Trades for prestador ---
const trades = [
  ['Gasfiter a domicilio', 'gasfiter-a-domicilio', 'hogar', 'Reparación de filtraciones, instalaciones y mantención.', 25000, '+56911111111', true, true],
  ['Electricista certificado', 'electricista-certificado', 'hogar', 'Instalaciones eléctricas, cambio de tableros y certificaciones.', 30000, '+56922222222', true, true],
  ['Jardinería y poda', 'jardineria-y-poda', 'exterior', 'Mantención de jardines, poda de árboles y diseño paisajístico.', 20000, '+56933333333', true, false],
  ['Pintura interior', 'pintura-interior', 'hogar', 'Pintura de casas, departamentos y oficinas. Presupuesto sin costo.', 18000, '+56944444444', false, true],
];
for (const [name, slug, category, description, basePrice, whatsapp, verified, availableNow] of trades) {
  await conn.query(
    `INSERT INTO trades
       (user_id, symbol, name, slug, category, description, base_price_clp, image_url, whatsapp, verified, status, commune_id, available_now, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?)`,
    [prestadorId, slug, name, slug, category, description, basePrice, null, whatsapp, verified, santiagoId, availableNow, now],
  );
  const [[{ id: tradeId }]] = await conn.query(
    "SELECT id FROM trades WHERE slug=?",
    [slug],
  );
  // associate with a couple of communes
  await conn.query(
    'INSERT INTO trade_communes (trade_id, commune_id) VALUES (?, ?), (?, ?)',
    [tradeId, santiagoId, tradeId, santiagoId + 1],
  );
}

// --- Reviews ---
const [allTrades] = await conn.query("SELECT id, slug FROM trades");
for (const t of allTrades) {
  await conn.query(
    'INSERT INTO reviews (trade_id, user_id, reviewer_name, rating, body, created_at) VALUES (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?)',
    [
      t.id, vecinoId, 'María González', 5, 'Excelente trabajo, muy profesional.', now,
      t.id, null, 'Carlos R.', 4, 'Buen servicio, llegó puntual.', now,
    ],
  );
}

console.log('Seeding complete.');
await conn.end();