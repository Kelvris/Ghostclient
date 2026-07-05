import { toggleLockdown } from '../../repositories/stateRepository.js';

const ENABLE_RESPONSES = [
  '🔒 **Lockdown engaged.** All commands and features are disabled until you run `ononly` again.',
  '🔒 **Panic mode activated.** Only `ononly` will work from now on.',
  '🔒 **Lockdown enabled.** Everything else is frozen. Run `ononly` to restore.',
  '🔒 **Ghost mode.** No commands or auto-responses will fire. `ononly` to undo.',
];

const DISABLE_RESPONSES = [
  '🔓 **Lockdown lifted.** All commands and features restored.',
  '🔓 **Panic mode deactivated.** Welcome back!',
  '🔓 **Lockdown disabled.** Everything is back to normal.',
  '🔓 **Ghost mode off.** Features are live again.',
];

export default {
  name: 'ononly',
  aliases: ['panic', 'lockdown', 'kill'],
  description: 'Toggle lockdown mode (disables all other commands and features)',
  usage: 'ononly',
  dmOnly: true,
  deleteAfter: 6000,

  async execute(message, args, client) {
    const accountId = client.accountId || 'default';
    const next = toggleLockdown(accountId);

    const pool = next ? ENABLE_RESPONSES : DISABLE_RESPONSES;
    const text = pool[Math.floor(Math.random() * pool.length)];

    return await message.channel.send(text);
  },
};
