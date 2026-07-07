import db from '../database.js';

/**
 * Saves a backup blueprint for a guild. Upserts by account_id + guild_id + type.
 */
export function saveBackup(accountId, guildId, guildName, blueprint, type = 'pre_clone') {
  const stmt = db.prepare(`
    INSERT INTO server_backups (account_id, guild_id, guild_name, blueprint, backup_type, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(account_id, guild_id, backup_type) DO UPDATE SET
      blueprint = excluded.blueprint,
      guild_name = excluded.guild_name,
      created_at = excluded.created_at
  `);
  stmt.run(accountId, guildId, guildName, JSON.stringify(blueprint), type, new Date().toISOString());
}

/**
 * Loads the latest backup of a given type for a guild.
 */
export function loadBackup(accountId, guildId, type = 'pre_clone') {
  const row = db.prepare(`
    SELECT * FROM server_backups
    WHERE account_id = ? AND guild_id = ? AND backup_type = ?
    ORDER BY created_at DESC LIMIT 1
  `).get(accountId, guildId, type);

  if (!row) return null;
  return {
    ...row,
    blueprint: JSON.parse(row.blueprint),
  };
}

/**
 * Checks if a backup exists.
 */
export function hasBackup(accountId, guildId, type = 'pre_clone') {
  const row = db.prepare(`
    SELECT 1 FROM server_backups
    WHERE account_id = ? AND guild_id = ? AND backup_type = ?
    LIMIT 1
  `).get(accountId, guildId, type);
  return !!row;
}

/**
 * Deletes a backup.
 */
export function deleteBackup(accountId, guildId, type = 'pre_clone') {
  db.prepare(`
    DELETE FROM server_backups
    WHERE account_id = ? AND guild_id = ? AND backup_type = ?
  `).run(accountId, guildId, type);
}
