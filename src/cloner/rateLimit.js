import { randomDelay } from '../defense/humanizer.js';

/**
 * Iterates over items and calls fn(item) with randomized delays.
 * Takes a longer pause every `batchSize` operations.
 */
export async function pacedOperation(items, fn, options = {}) {
  const {
    baseDelay = 1200,
    batchSize = 3,
    batchPauseMin = 3000,
    batchPauseMax = 5000,
    label = 'operation',
  } = options;

  let count = 0;
  for (const item of items) {
    await fn(item);
    count++;
    if (count < items.length) {
      if (count % batchSize === 0) {
        await randomDelay(batchPauseMin, batchPauseMax);
      } else {
        await randomDelay(baseDelay * 0.8, baseDelay * 1.2);
      }
    }
  }
}
