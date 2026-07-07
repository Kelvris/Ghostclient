import { logger } from '../logger.js';

/**
 * Scans a guild and returns a Blueprint object.
 * @param {import('discord.js-selfbot-v13').Guild} guild
 * @returns {Object} blueprint
 */
export async function scanGuild(guild) {
  // Fetch all data upfront
  await guild.fetch();
  const roles = await guild.roles.fetch();
  const channels = await guild.channels.fetch();
  const emojis = guild.emojis.cache;

  const iconURL = guild.iconURL({ size: 256 }) || null;
  const bannerURL = guild.bannerURL({ size: 512 }) || null;
  const splashURL = guild.splashURL({ size: 512 }) || null;

  // 1. Server-level settings
  const server = {
    name: guild.name,
    description: guild.description || null,
    icon: iconURL,
    banner: bannerURL,
    splash: splashURL,
    verificationLevel: guild.verificationLevel,
    explicitContentFilter: guild.explicitContentFilter,
    afkTimeout: guild.afkTimeout,
    afkChannelId: guild.afkChannelId,  // we'll resolve by name later
    systemChannelId: guild.systemChannelId,
    defaultMessageNotifications: guild.defaultMessageNotifications,
  };

  // 2. Roles (sorted by position descending, skip @everyone)
  const roleData = roles
    .filter(r => r.name !== '@everyone')
    .sort((a, b) => b.position - a.position)
    .map(r => ({
      name: r.name,
      color: r.color,
      hoist: r.hoist,
      mentionable: r.mentionable,
      permissions: r.permissions.bitfield.toString(),
      position: r.position,
    }));

  // 3. Channels — handle categories first
  const categoryData = [];
  const textChannelData = [];
  const voiceChannelData = [];

  const sortedChannels = channels.sort((a, b) => {
    // Sort by position: categories first, then by position
    if (a.type !== b.type) return a.type === 4 ? -1 : 1;
    return (a.position || 0) - (b.position || 0);
  });

  // Build a lookup for parent channel names
  const channelNameMap = new Map();
  for (const ch of channels.values()) {
    channelNameMap.set(ch.id, ch.name);
  }

  for (const ch of sortedChannels.values()) {
    const base = {
      name: ch.name,  // Unicode "fonts" preserved as-is
      position: ch.position,
      parentName: ch.parentId ? channelNameMap.get(ch.parentId) || null : null,
    };

    if (ch.type === 4) { // Category
      categoryData.push(base);
    } else if (ch.type === 0) { // Text
      textChannelData.push({
        ...base,
        topic: ch.topic || null,
        nsfw: ch.nsfw || false,
        slowMode: ch.rateLimitPerUser || 0,
        permissionOverwrites: serializeOverwrites(ch, roles),
      });
    } else if (ch.type === 2) { // Voice
      voiceChannelData.push({
        ...base,
        bitrate: ch.bitrate || 64000,
        userLimit: ch.userLimit || 0,
        permissionOverwrites: serializeOverwrites(ch, roles),
      });
    }
  }

  // 4. Emojis
  const emojiData = emojis.map(e => ({
    name: e.name,
    animated: e.animated || false,
    imageURL: e.imageURL({ size: 64 }),
  }));

  // 5. Resolve AFK and system channel names
  if (server.afkChannelId) {
    const afkCh = channels.get(server.afkChannelId);
    server.afkChannelName = afkCh?.name || null;
  }
  if (server.systemChannelId) {
    const sysCh = channels.get(server.systemChannelId);
    server.systemChannelName = sysCh?.name || null;
  }
  delete server.afkChannelId;
  delete server.systemChannelId;

  const blueprint = {
    sourceGuildId: guild.id,
    sourceGuildName: guild.name,
    scannedAt: new Date().toISOString(),
    server,
    roles: roleData,
    categories: categoryData,
    textChannels: textChannelData,
    voiceChannels: voiceChannelData,
    emojis: emojiData,
  };

  logger.info(`[Scanner] Scanned "${guild.name}" — ${roleData.length} roles, ${categoryData.length} categories, ${textChannelData.length} text, ${voiceChannelData.length} voice, ${emojiData.length} emojis`);

  return blueprint;
}

/**
 * Serializes permission overwrites into plain objects with role names.
 */
function serializeOverwrites(channel, roles) {
  const overwrites = channel.permissionOverwrites?.cache;
  if (!overwrites || overwrites.size === 0) return [];

  const result = [];
  for (const [id, ow] of overwrites) {
    const role = roles.get(id);
    const entry = {
      type: ow.type, // 0 = role, 1 = member
      id: ow.id,
      allow: ow.allow?.bitfield?.toString() || '0',
      deny: ow.deny?.bitfield?.toString() || '0',
    };

    if (ow.type === 0) {
      // Role overwrite — store role name for mapping
      entry.roleName = role?.name || null;
    }
    // Member overwrites keep the original user ID (users are same across guilds)

    result.push(entry);
  }

  return result;
}
