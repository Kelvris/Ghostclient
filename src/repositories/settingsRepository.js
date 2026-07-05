import db from '../database.js';

export function getStoredPrefix(accountId) {
  const row = db.prepare('SELECT prefix FROM account_settings WHERE account_id = ?').get(accountId);
  return row?.prefix ?? null;
}

export function setStoredPrefix(accountId, prefix) {
  db.prepare(`
    INSERT INTO account_settings (account_id, prefix, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(account_id) DO UPDATE SET
      prefix = excluded.prefix,
      updated_at = excluded.updated_at
  `).run(accountId, prefix, new Date().toISOString());
}
