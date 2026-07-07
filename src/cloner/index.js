import { scanGuild } from './scanner.js';
import { applyBlueprint } from './builder.js';
import { saveBackup, loadBackup, hasBackup, deleteBackup } from './backup.js';
import { logger } from '../logger.js';

/**
 * Preview mode — scans source and returns blueprint without modifying anything.
 */
export async function previewClone(client, sourceGuild) {
  const blueprint = await scanGuild(sourceGuild);
  return blueprint;
}

/**
 * Clone source guild to a brand new server.
 */
export async function cloneToNewGuild(client, sourceGuild) {
  const blueprint = await scanGuild(sourceGuild);

  // Create a new guild
  const newGuild = await client.guilds.create({
    name: blueprint.server.name || 'Cloned Server',
    icon: blueprint.server.icon ? await fetchImageBuffer(blueprint.server.icon) : undefined,
  });

  logger.info(`[Clone] Created new guild "${newGuild.name}" (${newGuild.id})`);

  // Apply the blueprint
  await applyBlueprint(client, newGuild, blueprint, (msg) => {
    logger.info(`[Clone] ${msg}`);
  });

  return newGuild;
}

/**
 * Clone source guild into an existing target guild.
 * Backs up target first, then applies source blueprint.
 */
export async function cloneToExistingGuild(client, sourceGuild, targetGuild, accountId) {
  // Step 1: Backup target
  logger.info(`[Clone] Backing up target guild "${targetGuild.name}"...`);
  const targetBackup = await scanGuild(targetGuild);
  saveBackup(accountId, targetGuild.id, targetGuild.name, targetBackup, 'pre_clone');

  // Step 2: Scan source
  const sourceBlueprint = await scanGuild(sourceGuild);

  // Step 3: Apply source to target
  await applyBlueprint(client, targetGuild, sourceBlueprint, (msg) => {
    logger.info(`[Clone] ${msg}`);
  });

  return { backupGuildId: targetGuild.id };
}

/**
 * Restore a guild from its last backup.
 */
export async function restoreFromBackup(client, targetGuild, accountId) {
  const backup = loadBackup(accountId, targetGuild.id);
  if (!backup) {
    throw new Error('No backup found for this server.');
  }

  await applyBlueprint(client, targetGuild, backup.blueprint, (msg) => {
    logger.info(`[Restore] ${msg}`);
  });

  deleteBackup(accountId, targetGuild.id);
  return true;
}

async function fetchImageBuffer(url) {
  const response = await fetch(url);
  return Buffer.from(await response.arrayBuffer());
}
