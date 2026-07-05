const RESPONSES = [
  (ping) => `Pong! Latency: ${ping}ms`,
  (ping) => `Connection stable. Ping: ${ping}ms`,
  (ping) => `Response time: ${ping}ms — all good!`,
  (ping) => `Latency check: ${ping}ms`,
];

export default {
  name: 'ping',
  aliases: ['p', 'latency'],
  description: "Check the bot's latency",
  usage: 'ping',
  dmOnly: false,
  deleteAfter: 8000, // auto-delete after 8s in guilds
  
  async execute(message, args, client) {
    const ping = client.ws.ping;
    const text = RESPONSES[Math.floor(Math.random() * RESPONSES.length)](ping);
    
    const msg = await message.channel.send(text);
    return msg; // return for potential auto-delete
  },
};
