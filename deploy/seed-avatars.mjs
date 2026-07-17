import mysql from 'mysql2/promise';
import { Client } from 'minio';

const url = new URL(process.env.DATABASE_URL || 'mysql://quiensabe:quiensabe@mysql:3306/quiensabe');
const conn = await mysql.createConnection({
  host: url.hostname,
  port: Number(url.port) || 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ''),
});

const bucket = process.env.MINIO_BUCKET || 'quien-sabe-files';
const minio = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'minio',
  port: Number(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});
const hostBase = `http://localhost:9002/${bucket}/avatars`;

const FEMALE = ['maría', 'maria', 'camila', 'valentina', 'ana', 'carolina'];
function genderOf(name) {
  const first = name.toLowerCase().split(' ')[0];
  return FEMALE.includes(first) ? 'women' : 'men';
}

const [rows] = await conn.query('SELECT id, name FROM users ORDER BY id');
const counters = { men: 0, women: 0 };
const seed = { men: [11, 32, 45, 51, 83], women: [21, 26, 44, 57, 68] };

let done = 0;
for (const u of rows) {
  const gender = genderOf(u.name);
  const idx = seed[gender][counters[gender] % seed[gender].length];
  counters[gender]++;

  const res = await fetch(`https://randomuser.me/api/portraits/${gender}/${idx}.jpg`);
  if (!res.ok) {
    console.warn(`skip ${u.name}: portrait ${res.status}`);
    continue;
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const key = `avatars/${String(u.id).padStart(2, '0')}.jpg`;
  await minio.putObject(bucket, key, buffer, buffer.length, { 'Content-Type': 'image/jpeg' });

  await conn.query('UPDATE users SET avatar_url = ? WHERE id = ?', [
    `${hostBase}/${String(u.id).padStart(2, '0')}.jpg`,
    u.id,
  ]);
  done++;
  console.log(`avatar ${u.name} (${gender}/${idx}) -> ${key}`);
}

console.log(`Avatares OK: ${done}/${rows.length}`);
await conn.end();
