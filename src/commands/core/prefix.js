import { logger } from '../../logger.js';
import { getStoredPrefix, setStoredPrefix } from '../../repositories/settingsRepository.js';

export default {
  name: 'prefix',
  aliases: ['setprefix'],
  description: 'View or change the command prefix for this account',
  usage: 'prefix [newprefix]',
  dmOnly: false,
  deleteAfter: 5000,

  async execute(message, args, client) {
    const accountId = client.accountId;

    if (args.length === 0) {
      const current = client.accountPrefix;
      return await message.channel.send(`Current prefix: \`${current}\``);
    }

    const newPrefix = args[0].trim();

    if (newPrefix.length < 1) {
      return await message.channel.send('Prefix cannot be empty.');
    }

    if (newPrefix.length > 5) {
      return await message.channel.send('Prefix too long. Max 5 characters.');
    }

    // Persist to database
    setStoredPrefix(accountId, newPrefix);

    // Update live
    client.accountPrefix = newPrefix;

    logger.info(`[${accountId}] Prefix changed to "${newPrefix}"`);
    return await message.channel.send(`Prefix changed to \`${newPrefix}\``);
  },
};
