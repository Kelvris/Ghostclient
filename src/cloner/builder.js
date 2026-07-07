import { logger } from '../logger.js';
import { pacedOperation } from './rateLimit.js';
import { buildRoleNameMap, mapOverwrites } from './mapper.js';
import { randomDelay } from '../defense/humanizer.js';

/**
 * Applies a blueprint to a target guild.
 * @param {import('discord.js-selfbot-v13').Client} client
 * @param {import('discord.js-selfbot-v13').Guild} targetGuild
 * @param {Object} blueprint
 * @param {Function} progressCallback - function(message) for sending progress updates
 */
export async function applyBlueprint(client, targetGuild, blueprint, progressCallback = () => {}) {
  const log = (msg) => {
    logger.info(`[Builder] ${msg}`);
    progressCallback(msg);
  };

  // ── Phase 0: Fetch current target state ──────────────────────────────
  log('Fetching target guild data...');
  await targetGuild.fetch();
  const targetRoles = await targetGuild.roles.fetch();
  const targetChannels = await targetGuild.channels.fetch();

  let roleNameMap = new Map();

  // ── Phase 1: Create roles ────────────────────────────────────────────
  log(`Creating ${blueprint.roles.length} roles...`);
  const createdRoles = [];
  for (const roleDef of blueprint.roles) {
    // Check if role with same name already exists
    const existing = targetRoles.find(r => r.name === roleDef.name);
    if (existing) {
      log(`  Role "${roleDef.name}" already exists, skipping`);
      createdRoles.push(existing);
      continue;
    }

    try {
      const newRole = await targetGuild.roles.create({
        name: roleDef.name,
        color: roleDef.color,
        hoist: roleDef.hoist,
        mentionable: roleDef.mentionable,
        permissions: BigInt(roleDef.permissions),
        reason: 'Server clone',
      });
      createdRoles.push(newRole);
      log(`  Created role "${roleDef.name}"`);
    } catch (err) {
      log(`  ⚠️ Could not create role "${roleDef.name}": ${err.message}`);
    }

    await randomDelay(800, 1500);
  }

  // Build role name→ID map from all roles in target (existing server roles + any we just created)
  const updatedRoles = await targetGuild.roles.fetch();
  roleNameMap = buildRoleNameMap(blueprint.roles, [...updatedRoles.values()]);

  // ── Phase 2: Delete existing channels ─────────────────────────────
  log(`Deleting ${targetChannels.size} existing channels...`);
  const nonCategories = targetChannels.filter(c => c.type !== 4);
  const categories = targetChannels.filter(c => c.type === 4);

  for (const ch of [...nonCategories.values(), ...categories.values()]) {
    try {
      await ch.delete('Server clone — replacing structure');
      log(`  Deleted ${ch.name}`);
    } catch (err) {
      log(`  ⚠️ Could not delete ${ch.name}: ${err.message}`);
    }
    await randomDelay(500, 1000);
  }

  // ── Phase 3: Create categories ────────────────────────────────────
  const createdCategoryNames = new Map();
  log(`Creating ${blueprint.categories.length} categories...`);
  for (const catDef of blueprint.categories) {
    try {
      const category = await targetGuild.channels.create({
        name: catDef.name,
        type: 4,
        reason: 'Server clone',
      });
      createdCategoryNames.set(catDef.name, category);
      log(`  Created category "${catDef.name}"`);
    } catch (err) {
      log(`  ⚠️ Could not create category "${catDef.name}": ${err.message}`);
    }
    await randomDelay(800, 1500);
  }

  // ── Phase 4: Create text channels ───────────────────────────────
  log(`Creating ${blueprint.textChannels.length} text channels...`);
  for (const chDef of blueprint.textChannels) {
    try {
      const parent = chDef.parentName ? createdCategoryNames.get(chDef.parentName) : null;

      const channel = await targetGuild.channels.create({
        name: chDef.name,
        type: 0,
        topic: chDef.topic,
        nsfw: chDef.nsfw,
        rateLimitPerUser: chDef.slowMode,
        parent: parent?.id || null,
        reason: 'Server clone',
      });

      // Apply permission overwrites (best effort — skip if no perms)
      if (chDef.permissionOverwrites?.length > 0 && roleNameMap.size > 0) {
        const mapped = mapOverwrites(chDef.permissionOverwrites, roleNameMap, targetGuild.id, blueprint.sourceGuildId);
        for (const ow of mapped) {
          try {
            await channel.permissionOverwrites.create(ow.id, {
              allow: BigInt(ow.allow),
              deny: BigInt(ow.deny),
              type: ow.type,
            });
          } catch (err) {
            log(`  ⚠️ Could not set overwrite on "${chDef.name}": ${err.message}`);
          }
          await randomDelay(400, 800);
        }
      }

      log(`  Created text channel "${chDef.name}"`);
    } catch (err) {
      log(`  ⚠️ Could not create text channel "${chDef.name}": ${err.message}`);
    }
    await randomDelay(800, 1500);
  }

  // ── Phase 5: Create voice channels ──────────────────────────────
  log(`Creating ${blueprint.voiceChannels.length} voice channels...`);
  for (const chDef of blueprint.voiceChannels) {
    try {
      const parent = chDef.parentName ? createdCategoryNames.get(chDef.parentName) : null;

      const channel = await targetGuild.channels.create({
        name: chDef.name,
        type: 2,
        bitrate: Math.min(chDef.bitrate, 384000),
        userLimit: chDef.userLimit,
        parent: parent?.id || null,
        reason: 'Server clone',
      });

      // Apply permission overwrites (best effort — skip if no perms)
      if (chDef.permissionOverwrites?.length > 0 && roleNameMap.size > 0) {
        const mapped = mapOverwrites(chDef.permissionOverwrites, roleNameMap, targetGuild.id, blueprint.sourceGuildId);
        for (const ow of mapped) {
          try {
            await channel.permissionOverwrites.create(ow.id, {
              allow: BigInt(ow.allow),
              deny: BigInt(ow.deny),
              type: ow.type,
            });
          } catch (err) {
            log(`  ⚠️ Could not set overwrite on "${chDef.name}": ${err.message}`);
          }
          await randomDelay(400, 800);
        }
      }

      log(`  Created voice channel "${chDef.name}"`);
    } catch (err) {
      log(`  ⚠️ Could not create voice channel "${chDef.name}": ${err.message}`);
    }
    await randomDelay(800, 1500);
  }

  // ── Phase 6: Update server settings ───────────────────────────────
  log('Updating server settings...');
  try {
    const settings = {};
    if (blueprint.server.name) settings.name = blueprint.server.name;
    if (blueprint.server.description !== undefined) settings.description = blueprint.server.description;
    if (blueprint.server.verificationLevel !== undefined) settings.verificationLevel = blueprint.server.verificationLevel;
    if (blueprint.server.explicitContentFilter !== undefined) settings.explicitContentFilter = blueprint.server.explicitContentFilter;
    if (blueprint.server.afkTimeout !== undefined) settings.afkTimeout = blueprint.server.afkTimeout;
    if (blueprint.server.defaultMessageNotifications !== undefined) settings.defaultMessageNotifications = blueprint.server.defaultMessageNotifications;

    await targetGuild.edit(settings);
    log('Server settings updated');
  } catch (err) {
    log(`  ⚠️ Could not update server settings: ${err.message}`);
  }

  // ── Phase 7: Upload icon/banner/splash ────────────────────────────
  if (blueprint.server.icon) {
    try {
      const response = await fetch(blueprint.server.icon);
      const buffer = Buffer.from(await response.arrayBuffer());
      await targetGuild.setIcon(buffer);
      log('Server icon updated');
    } catch (err) {
      log(`  ⚠️ Could not set icon: ${err.message}`);
    }
  }

  if (blueprint.server.banner) {
    try {
      const response = await fetch(blueprint.server.banner);
      const buffer = Buffer.from(await response.arrayBuffer());
      await targetGuild.setBanner(buffer);
      log('Server banner updated');
    } catch (err) {
      log(`  ⚠️ Could not set banner: ${err.message}`);
    }
  }

  if (blueprint.server.splash) {
    try {
      const response = await fetch(blueprint.server.splash);
      const buffer = Buffer.from(await response.arrayBuffer());
      await targetGuild.setSplash(buffer);
      log('Server splash updated');
    } catch (err) {
      log(`  ⚠️ Could not set splash: ${err.message}`);
    }
  }

  // ── Phase 8: Clone emojis ─────────────────────────────────────────
  if (blueprint.emojis?.length > 0) {
    log(`Cloning ${blueprint.emojis.length} emojis...`);
    for (const emojiDef of blueprint.emojis) {
      try {
        const response = await fetch(emojiDef.imageURL);
        const buffer = Buffer.from(await response.arrayBuffer());
        await targetGuild.emojis.create({
          attachment: buffer,
          name: emojiDef.name,
        });
        log(`  Emoji "${emojiDef.name}" cloned`);
      } catch (err) {
        log(`  ⚠️ Could not clone emoji "${emojiDef.name}": ${err.message}`);
      }
      await randomDelay(1000, 2000);
    }
  }

  log('✅ Clone complete!');
}
