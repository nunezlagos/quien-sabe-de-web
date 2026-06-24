-- 0005_trades_whatsapp.sql
-- Wizard de creación de oficios (HU mockup create-trade.html).
-- Almacena el WhatsApp del prestador para contacto directo desde /p/{slug}.
-- NULL permitido: oficios legacy creados antes de esta migración no tienen WhatsApp.

ALTER TABLE trades ADD COLUMN whatsapp TEXT;
