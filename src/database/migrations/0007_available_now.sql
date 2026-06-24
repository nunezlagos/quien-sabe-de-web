-- 0007_available_now.sql
-- Simple available_now flag for trades (HU-24 MVP).
-- Full schedule system comes in HU-24.1.

ALTER TABLE trades ADD COLUMN available_now INTEGER NOT NULL DEFAULT 0;
