export default {
  name: 'help',
  aliases: ['h', 'commands'],
  description: 'Show available commands',
  usage: 'help',
  dmOnly: true,     // DM-only for stealth
  deleteAfter: 10000,
  
  async execute(message, args, client) {
    const commands = client.commands;
    if (!commands) return await message.channel.send('No commands loaded.');
    
    const seen = new Set();
    let helpText = '**Ghostclient Commands**\n\n';
    
    for (const [name, cmd] of commands) {
      if (seen.has(cmd.name)) continue;
      seen.add(cmd.name);
      
      helpText += `**${cmd.name}**`;
      if (cmd.aliases?.length) {
        helpText += ` (${cmd.aliases.join(', ')})`;
      }
      helpText += `\n  ${cmd.description || 'No description'}\n`;
      helpText += `  Usage: \`${cmd.usage || cmd.name}\`\n`;
      helpText += cmd.dmOnly ? '  *DM only*\n' : '';
      helpText += '\n';
    }
    
    return await message.channel.send(helpText);
  },
};
