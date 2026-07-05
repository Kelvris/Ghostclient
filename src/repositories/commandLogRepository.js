import db from '../database.js';

export function logCommand(name, args, guildId, channelId, accountId = 'default') {
  const stmt = db.prepare(`
    INSERT INTO command_log (account_id, name, args, guild_id, channel_id, used_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(accountId, name, args, guildId, channelId, new Date().toISOString());
}
