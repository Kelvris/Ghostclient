import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '..', 'ghostclient.db');

const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Run migrations
db.exec(`
  CREATE TABLE IF NOT EXISTS afk_state (
    user_id    TEXT NOT NULL,
    account_id TEXT NOT NULL,
    reason     TEXT,
    set_at     TEXT NOT NULL,
    expires_at TEXT,
    guild_id   TEXT,
    PRIMARY KEY (user_id, account_id)
  );

  CREATE TABLE IF NOT EXISTS command_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id TEXT NOT NULL,
    name       TEXT NOT NULL,
    args       TEXT,
    guild_id   TEXT,
    channel_id TEXT,
    used_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS bot_state (
    account_id TEXT PRIMARY KEY,
    lockdown   INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  );
`);

logger.success('Database initialized');

export default db;
