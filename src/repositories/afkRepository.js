import db from '../database.js';

export function setAFK(userId, reason, guildId = null, accountId = 'default') {
  const stmt = db.prepare(`
    INSERT INTO afk_state (user_id, account_id, reason, set_at, guild_id)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, account_id) DO UPDATE SET
      reason = excluded.reason,
      set_at = excluded.set_at,
      guild_id = excluded.guild_id
  `);
  stmt.run(userId, accountId, reason, new Date().toISOString(), guildId);
}

export function unsetAFK(userId, accountId = 'default') {
  db.prepare('DELETE FROM afk_state WHERE user_id = ? AND account_id = ?').run(userId, accountId);
}

export function getAFK(userId, accountId = 'default') {
  return db.prepare('SELECT * FROM afk_state WHERE user_id = ? AND account_id = ?').get(userId, accountId);
}

export function isAFK(userId, accountId = 'default') {
  const row = getAFK(userId, accountId);
  return row ? true : false;
}
