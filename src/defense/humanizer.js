function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomDelay(minMs, maxMs) {
  const ms = randomInt(minMs, maxMs);
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function simulateTyping(channel, minMs, maxMs) {
  const duration = randomInt(minMs, maxMs);
  try {
    await channel.startTyping();
    await new Promise(resolve => setTimeout(resolve, duration));
  } finally {
    try { await channel.stopTyping(true); } catch {}
  }
}

export function getRandomResponse(variations) {
  return variations[Math.floor(Math.random() * variations.length)];
}

export async function naturalResponse(channel, variations, options = {}) {
  const {
    minDelay = 4000,
    maxDelay = 15000,
    typingMin = 1000,
    typingMax = 3000,
  } = options;

  await randomDelay(minDelay, maxDelay);
  await simulateTyping(channel, typingMin, typingMax);

  const text = getRandomResponse(variations);
  const msg = await channel.send(text);
  return msg;
}
