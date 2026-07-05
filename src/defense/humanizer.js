function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomDelay(minMs, maxMs) {
  const ms = randomInt(minMs, maxMs);
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function simulateTyping(channel, minMs, maxMs) {
  const duration = randomInt(minMs, maxMs);

  // Send initial typing indicator
  try { await channel.sendTyping(); } catch {}

  // Periodically refresh typing (indicator lasts ~10s naturally)
  const interval = setInterval(async () => {
    try { await channel.sendTyping(); } catch {}
  }, 8000);

  // Wait for the simulated typing duration
  await new Promise(resolve => setTimeout(() => {
    clearInterval(interval);
    resolve();
  }, duration));
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
