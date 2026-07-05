import { setAFK, unsetAFK } from '../../defense/afkManager.js';
import { getRandomResponse } from '../../defense/humanizer.js';

const SET_RESPONSES = [
  (reason) => `AFK set: ${reason || 'busy'}. See you later!`,
  (reason) => `Got it! Marked as away: ${reason || 'no reason given'}.`,
  (reason) => `I'll let people know you're away: ${reason || 'busy'}.`,
];

const UNSET_RESPONSES = [
  'Welcome back! AFK mode turned off.',
  'AFK removed. You\'re back online!',
  'Glad you\'re back! AFK cleared.',
];

export default {
  name: 'afk',
  aliases: ['brb', 'away'],
  description: 'Set or remove AFK status',
  usage: 'afk [reason] | afk off',
  dmOnly: true,     // DM-only to avoid revealing selfbot usage
  deleteAfter: 5000, // auto-delete in guilds after 5s
  
  async execute(message, args, client) {
    if (args.length === 0 || (args[0]?.toLowerCase() !== 'off' && args[0]?.toLowerCase() !== 'end')) {
      // Set AFK
      const reason = args.join(' ') || 'busy';
      const guildId = message.guild?.id || null;
      setAFK(reason, guildId, client);
      
      const text = getRandomResponse(SET_RESPONSES)(reason);
      return await message.channel.send(text);
    } else {
      // Unset AFK
      unsetAFK(client);
      const text = getRandomResponse(UNSET_RESPONSES);
      return await message.channel.send(text);
    }
  },
};
