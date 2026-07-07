/**
 * Builds a Map of source role name → target role ID.
 * @param {Array} sourceRoles - roles from the source guild
 * @param {Array} targetRoles - roles from the target guild
 * @returns {Map<string, string>}
 */
export function buildRoleNameMap(sourceRoles, targetRoles) {
  const map = new Map();

  // @everyone exists in every guild — ID always equals guild ID
  // Handled specially by the builder, not here

  for (const srcRole of sourceRoles) {
    if (srcRole.name === '@everyone') continue;
    const match = targetRoles.find(r => r.name === srcRole.name);
    if (match) {
      map.set(srcRole.name, match.id);
    }
    // If no match, the overwrite will be skipped later
  }

  return map;
}

/**
 * Maps permission overwrites from source role IDs → target role IDs.
 * @param {Array} overwrites - channel.permissionOverwrites.cache array
 * @param {Map<string, string>} roleNameMap - source name → target ID
 * @param {string} targetGuildId - target guild ID (for @everyone)
 * @param {string} sourceGuildId - source guild ID (for @everyone)
 * @returns {Array} mapped overwrites [{ type, id, allow, deny }]
 */
export function mapOverwrites(overwrites, roleNameMap, targetGuildId, sourceGuildId) {
  const result = [];

  for (const ow of overwrites) {
    // Handle @everyone — its ID equals the guild ID, not a role ID
    if (ow.id === sourceGuildId) {
      result.push({
        type: ow.type,
        id: targetGuildId,
        allow: ow.allow?.bitfield ?? ow.allow,
        deny: ow.deny?.bitfield ?? ow.deny,
      });
      continue;
    }

    // Try to map by role name
    const roleName = ow.roleName || ow.name; // discord.js may have .name or .roleName
    if (roleName && roleNameMap.has(roleName)) {
      result.push({
        type: ow.type,
        id: roleNameMap.get(roleName),
        allow: ow.allow?.bitfield ?? ow.allow,
        deny: ow.deny?.bitfield ?? ow.deny,
      });
    }
    // If we can't map it, skip (graceful fallback)
  }

  return result;
}
