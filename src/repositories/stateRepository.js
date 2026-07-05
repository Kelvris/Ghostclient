import db from '../database.js';

export function getLockdownState(accountId) {
  const row = db.prepare('SELECT lockdown FROM bot_state WHERE account_id = ?').get(accountId);
  return row ? !!row.lockdown : false;
}

export function setLockdownState(accountId, enabled) {
  db.prepare(`
    INSERT INTO bot_state (account_id, lockdown, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(account_id) DO UPDATE SET
      lockdown = excluded.lockdown,
      updated_at = excluded.updated_at
  `).run(accountId, enabled ? 1 : 0, new Date().toISOString());
}

export function toggleLockdown(accountId) {
  const current = getLockdownState(accountId);
  const next = !current;
  setLockdownState(accountId, next);
  return next;
}
