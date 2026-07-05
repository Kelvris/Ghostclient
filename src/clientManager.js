import { Client } from 'discord.js-selfbot-v13';
import config from './config.js';
import { logger } from './logger.js';

/**
 * Creates and manages multiple Discord client instances.
 * Each client is tagged with accountId and accountPrefix.
 */
export function createClients() {
  return config.accounts.map(account => {
    const client = new Client();
    client.accountId = account.id;
    client.accountPrefix = account.prefix;
    return { client, config: account };
  });
}

/**
 * Attaches standard event handlers to a single client.
 * @param {import('discord.js-selfbot-v13').Client} client
 * @param {Object} handlers - { onReady, onMessage, onError }
 */
export function setupClient(client, handlers) {
  client.on('ready', async () => {
    logger.success(`[${client.accountId}] Logged in as ${client.user.tag}`);
    if (handlers.onReady) await handlers.onReady(client);
  });

  client.on('messageCreate', async (message) => {
    try {
      if (handlers.onMessage) await handlers.onMessage(message, client);
    } catch (err) {
      logger.error(`[${client.accountId}] Unhandled error: ${err.message}`);
    }
  });

  client.on('error', (err) => {
    logger.error(`[${client.accountId}] Client error: ${err.message}`);
    if (handlers.onError) handlers.onError(err, client);
  });
}

/**
 * Logs in all clients. Returns when all are connected.
 * If one fails, others still attempt.
 */
export async function loginAll(clientEntries) {
  const results = await Promise.allSettled(
    clientEntries.map(({ client, config }) =>
      client.login(config.token).then(() => ({ client, config, ok: true }))
        .catch(err => ({ client, config, ok: false, error: err }))
    )
  );

  const failures = results.filter(r => r.value && !r.value.ok);
  if (failures.length > 0) {
    for (const f of failures) {
      logger.error(`[${f.value.config.id}] Login failed: ${f.value.error?.message || 'unknown error'}`);
    }
  }

  if (failures.length === clientEntries.length) {
    logger.error('[FATAL] All accounts failed to login. Exiting.');
    process.exit(1);
  }

  return results;
}

/**
 * Gracefully destroys all clients.
 */
export async function shutdownAll(clientEntries) {
  logger.info('Shutting down all clients...');
  for (const { client } of clientEntries) {
    try { client.destroy(); } catch {}
  }
}
