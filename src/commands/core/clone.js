import { previewClone, cloneToNewGuild, cloneToExistingGuild, restoreFromBackup } from '../../cloner/index.js';
import { loadBackup, hasBackup, saveBackup } from '../../cloner/backup.js';
import { scanGuild } from '../../cloner/scanner.js';

function formatBlueprintSummary(blueprint) {
  return [
    `**Server:** ${blueprint.sourceGuildName}`,
    `**Roles:** ${blueprint.roles.length}`,
    `**Categories:** ${blueprint.categories.length}`,
    `**Text Channels:** ${blueprint.textChannels.length}`,
    `**Voice Channels:** ${blueprint.voiceChannels.length}`,
    `**Emojis:** ${blueprint.emojis.length}`,
  ].join('\n');
}

export default {
  name: 'clone',
  aliases: [],
  description: 'Clone server structure, backup, or restore',
  usage: 'clone <source> | clone <source> to <target> | clone preview <source> | clone backup <server> | clone undo <server>',
  dmOnly: true,
  deleteAfter: 0, // Don't auto-delete — user needs to see progress

  async execute(message, args, client) {
    if (args.length === 0) {
      return await message.channel.send(
        '**Usage:**\n' +
        '`.clone <source>` — Clone to a new server\n' +
        '`.clone <source> to <target>` — Clone into existing server\n' +
        '`.clone preview <source>` — Preview what would be cloned\n' +
        '`.clone backup <server>` — Backup a server\'s structure\n' +
        '`.clone undo <server>` — Undo last clone (restore backup)'
      );
    }

    // ── Parse subcommands ──────────────────────────────────────────
    let mode = 'clone'; // default
    let sourceId, targetId;

    // .clone preview <source>
    if (args[0] === 'preview' && args[1]) {
      mode = 'preview';
      sourceId = args[1];
    }
    // .clone backup <server>
    else if (args[0] === 'backup' && args[1]) {
      mode = 'backup';
      sourceId = args[1];
    }
    // .clone undo <server>
    else if (args[0] === 'undo' && args[1]) {
      mode = 'undo';
      sourceId = args[1];
    }
    // .clone <source> to <target>
    else if (args.includes('to') && args.length >= 3) {
      const toIndex = args.indexOf('to');
      sourceId = args.slice(0, toIndex).join(' ');
      targetId = args.slice(toIndex + 1).join(' ');
    }
    // .clone <source>
    else {
      sourceId = args.join(' ');
    }

    // ── Resolve guilds ─────────────────────────────────────────────
    const resolveGuild = (id) => {
      // Try by ID first
      let guild = client.guilds.cache.get(id);
      // Try by name (case-insensitive)
      if (!guild) {
        guild = client.guilds.cache.find(g => g.name.toLowerCase() === id.toLowerCase());
      }
      return guild;
    };

    // ── Mode: preview ──────────────────────────────────────────────
    if (mode === 'preview') {
      const sourceGuild = resolveGuild(sourceId);
      if (!sourceGuild) return await message.channel.send('❌ Could not find source server.');

      await message.channel.send(`🔍 Scanning "${sourceGuild.name}"...`);
      try {
        const blueprint = await previewClone(client, sourceGuild);
        await message.channel.send(
          `**Preview — ${blueprint.sourceGuildName}**\n\n${formatBlueprintSummary(blueprint)}`
        );
      } catch (err) {
        await message.channel.send(`❌ Error scanning: ${err.message}`);
      }
      return;
    }

    // ── Mode: backup ───────────────────────────────────────────────
    if (mode === 'backup') {
      const guild = resolveGuild(sourceId);
      if (!guild) return await message.channel.send('❌ Could not find server.');

      await message.channel.send(`💾 Backing up "${guild.name}"...`);
      try {
        const blueprint = await scanGuild(guild);
        saveBackup(client.accountId, guild.id, guild.name, blueprint, 'manual');
        await message.channel.send(`✅ Backup saved for **${guild.name}** (${blueprint.roles.length} roles, ${blueprint.textChannels.length + blueprint.voiceChannels.length} channels)`);
      } catch (err) {
        await message.channel.send(`❌ Error backing up: ${err.message}`);
      }
      return;
    }

    // ── Mode: undo ─────────────────────────────────────────────────
    if (mode === 'undo') {
      const guild = resolveGuild(sourceId);
      if (!guild) return await message.channel.send('❌ Could not find server.');

      if (!hasBackup(client.accountId, guild.id)) {
        return await message.channel.send('❌ No backup found for this server. Use `.clone backup <server>` first.');
      }

      await message.channel.send(`⏪ Restoring "${guild.name}" from backup...`);
      try {
        await restoreFromBackup(client, guild, client.accountId);
        await message.channel.send(`✅ **${guild.name}** has been restored to its backed-up state.`);
      } catch (err) {
        await message.channel.send(`❌ Error restoring: ${err.message}`);
      }
      return;
    }

    // ── Mode: clone (to new or existing) ───────────────────────────
    const sourceGuild = resolveGuild(sourceId);
    if (!sourceGuild) return await message.channel.send('❌ Could not find source server.');

    if (targetId) {
      // Clone to existing server
      const targetGuild = resolveGuild(targetId);
      if (!targetGuild) return await message.channel.send('❌ Could not find target server.');

      if (sourceGuild.id === targetGuild.id) {
        return await message.channel.send('❌ Source and target cannot be the same server.');
      }

      // Check for existing backup warning
      if (hasBackup(client.accountId, targetGuild.id)) {
        await message.channel.send('⚠️ This server already has a backup. Clone will overwrite it. Continue? (yes/no)');
        // For now, proceed. A future improvement could add confirmation.
      }

      await message.channel.send(`🔄 Cloning **"${sourceGuild.name}"** → **"${targetGuild.name}"**\nThis may take a while depending on server size...`);

      try {
        const result = await cloneToExistingGuild(client, sourceGuild, targetGuild, client.accountId);
        await message.channel.send(`✅ Clone complete! Use \`.clone undo ${targetGuild.id}\` to restore the original structure.`);
      } catch (err) {
        await message.channel.send(`❌ Clone failed: ${err.message}`);
      }
    } else {
      // Clone to new server
      await message.channel.send(`🆕 Creating new server from **"${sourceGuild.name}"**...`);

      try {
        const newGuild = await cloneToNewGuild(client, sourceGuild);
        await message.channel.send(`✅ New server created: **${newGuild.name}** (ID: ${newGuild.id})`);
      } catch (err) {
        if (err.message?.includes('create guild') || err.message?.includes('GUILDS')) {
          await message.channel.send('❌ Cannot create a new server from here. Try using `.clone <source> to <target>` instead.');
        } else {
          await message.channel.send(`❌ Clone failed: ${err.message}`);
        }
      }
    }
  },
};
