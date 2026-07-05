import config from './config.js';
import { logger } from './logger.js';
import db from './database.js'; // run migrations
import { createClients, setupClient, loginAll, shutdownAll } from './clientManager.js';
import { registerCommands, handleCommand } from './commands/handler.js';
import { initAFKManager, handleMention } from './defense/afkManager.js';
import { getStoredPrefix } from './repositories/settingsRepository.js';

logger.info(`Starting Ghostclient with ${config.accounts.length} account(s)...`);

// Create all client instances
const clientEntries = createClients();

// Set up each client with handlers
for (const { client } of clientEntries) {
  setupClient(client, {
    async onReady(client) {
      // Register commands (shared singleton, runs once)
      await registerCommands(client);

      // Initialize AFK manager (per-account state)
      initAFKManager(client);

      // Load stored prefix from database
      const storedPrefix = getStoredPrefix(client.accountId);
      if (storedPrefix) {
        client.accountPrefix = storedPrefix;
        logger.info(`[${client.accountId}] Using stored prefix: "${storedPrefix}"`);
      }

      // Set status
      client.user.setPresence({
        status: 'online',
        activities: [],
      });
    },

    async onMessage(message, client) {
      // Ignore own messages
      if (message.author.id === client.user.id) return;

      // Handle AFK mentions (defense system) — account aware
      await handleMention(message, client);

      // Handle commands
      await handleCommand(message, client);
    },

    onError(err, client) {
      // Already logged in setupClient
    },
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await shutdownAll(clientEntries);
  try { db.close(); } catch {}
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await shutdownAll(clientEntries);
  try { db.close(); } catch {}
  process.exit(0);
});

// Login all accounts
loginAll(clientEntries);
