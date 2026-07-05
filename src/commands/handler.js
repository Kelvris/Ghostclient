import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import config from '../config.js';
import { logger } from '../logger.js';
import { logCommand } from '../repositories/commandLogRepository.js';
import { getLockdownState } from '../repositories/stateRepository.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const coreDir = join(__dirname, 'core');

const commands = new Map();

export async function registerCommands(client) {
  // Only load commands once (shared across all accounts)
  if (commands.size === 0) {
    const files = readdirSync(coreDir).filter(f => f.endsWith('.js'));

    for (const file of files) {
      const mod = await import(join(coreDir, file));
      const cmd = mod.default;

      if (!cmd || !cmd.name) {
        logger.warn(`Skipping ${file}: no valid command export`);
        continue;
      }

      commands.set(cmd.name, cmd);

      if (cmd.aliases && Array.isArray(cmd.aliases)) {
        for (const alias of cmd.aliases) {
          commands.set(alias, cmd);
        }
      }

      logger.debug(`Registered command: ${cmd.name}${cmd.dmOnly ? ' (DM-only)' : ''}`);
    }

    logger.success(`Loaded ${files.length} commands`);
  }

  // Attach to client for easy access
  client.commands = commands;

  return commands;
}

export async function handleCommand(message, client) {
  // Ignore bot messages and self
  if (message.author.bot) return;
  if (message.author.id === client.user.id) return;

  // Use per-account prefix, fallback to global
  const prefix = client.accountPrefix || config.prefix;
  const content = message.content.trim();

  // Check prefix
  if (!content.startsWith(prefix)) return;

  // Parse
  const args = content.slice(prefix.length).trim().split(/\s+/);
  const commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  // Find command
  const cmd = commands.get(commandName);
  if (!cmd) {
    // Unknown command — silently ignore for stealth
    return;
  }

  const accountId = client.accountId || 'default';

  // LOCKDOWN CHECK — only 'ononly' can run during lockdown
  if (getLockdownState(accountId) && cmd.name !== 'ononly') {
    // Silently ignore — lockdown active
    return;
  }

  // Log command usage
  logCommand(cmd.name, args.join(' '), message.guild?.id || null, message.channel.id, accountId);

  // DM-only check
  if (cmd.dmOnly && message.guild) {
    logger.info(`[${accountId}] DM-only command "${cmd.name}" used in guild, auto-deleting`);

    // Delete the user's command message
    try { await message.delete(); } catch (err) {
      logger.warn(`Could not delete command message: ${err.message}`);
    }

    // Send response with auto-delete
    try {
      const response = await cmd.execute(message, args, client);
      if (response && config.dmDeleteAfter) {
        setTimeout(async () => {
          try { await response.delete(); } catch {}
        }, config.dmDeleteAfter);
      }
    } catch (err) {
      logger.error(`Error executing ${cmd.name}: ${err.message}`);
    }

    return;
  }

  // Execute normally
  try {
    const response = await cmd.execute(message, args, client);

    // Auto-delete in guilds if configured
    if (response && cmd.deleteAfter && message.guild) {
      setTimeout(async () => {
        try { await response.delete(); } catch {}
      }, cmd.deleteAfter);
    }
  } catch (err) {
    logger.error(`Error executing ${cmd.name}: ${err.message}`);
  }
}
