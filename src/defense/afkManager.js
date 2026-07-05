import { setAFK as dbSetAFK, unsetAFK as dbUnsetAFK, isAFK as dbIsAFK, getAFK } from '../repositories/afkRepository.js';
import { naturalResponse } from './humanizer.js';
import { getLockdownState } from '../repositories/stateRepository.js';
import config from '../config.js';
import { logger } from '../logger.js';

const AFK_RESPONSES = [
  "Hey, I'm currently away: {reason}. I'll get back to you when I'm free!",
  "Sorry, I'm AFK ({reason}). Will reply later!",
  "Not around right now — {reason}. Drop a message and I'll respond when I can.",
  "Afk: {reason}. Catch you later!",
  "Hey! I'm busy at the moment ({reason}). I'll reply as soon as I can.",
  "Currently unavailable: {reason}. Feel free to leave a message!",
  "Gotta go — {reason}. Talk soon!",
  "Away from keyboard: {reason}. Will respond when I'm back.",
];

const recentMentionChannels = new Map(); // accountId -> Set of channelIds
const MENTION_COOLDOWN = 30_000;

export function initAFKManager(client) {
  const userId = client.user?.id;
  const accountId = client.accountId;

  if (userId && dbIsAFK(userId, accountId)) {
    const state = getAFK(userId, accountId);
    logger.info(`[${accountId}] AFK mode active (reason: ${state.reason || 'none'})`);
  }

  // Initialize cooldown map for this account
  if (!recentMentionChannels.has(accountId)) {
    recentMentionChannels.set(accountId, new Set());
  }
}

export function setAFK(reason = '', guildId = null, client) {
  if (!client?.user?.id || !client?.accountId) return;
  dbSetAFK(client.user.id, reason, guildId, client.accountId);
  logger.info(`[${client.accountId}] AFK set | reason: ${reason || 'none'}`);
}

export function unsetAFK(client) {
  if (!client?.user?.id || !client?.accountId) return;
  dbUnsetAFK(client.user.id, client.accountId);
  logger.info(`[${client.accountId}] AFK removed`);
}

export function checkAFK(client) {
  if (!client?.user?.id || !client?.accountId) return false;
  return dbIsAFK(client.user.id, client.accountId);
}

export async function handleMention(message, client) {
  const userId = client?.user?.id;
  const accountId = client?.accountId;
  if (!userId || !accountId) return;
  if (message.author.id === userId) return;

  // Check lockdown — if active, don't respond
  if (getLockdownState(accountId)) return;

  // Check if message mentions the selfbot user
  const isMentioned = message.mentions.users.has(userId);
  if (!isMentioned) return;

  const afkState = getAFK(userId, accountId);
  if (!afkState) return;

  // Rate limit per account+channel
  const accountChannels = recentMentionChannels.get(accountId);
  if (accountChannels?.has(message.channel.id)) return;
  accountChannels?.add(message.channel.id);
  setTimeout(() => accountChannels?.delete(message.channel.id), MENTION_COOLDOWN);

  // Build response with reason
  const reason = afkState.reason || 'busy';
  const filledResponses = AFK_RESPONSES.map(r => r.replace('{reason}', reason));

  // Log
  const channelName = message.guild ? `#${message.channel.name}` : 'DM';
  logger.info(`[${accountId}] AFK mention in ${channelName} from ${message.author.tag}`);

  // Use humanizer to send natural delayed response
  await naturalResponse(message.channel, filledResponses, {
    minDelay: config.minDelay,
    maxDelay: config.maxDelay,
    typingMin: config.typingMin,
    typingMax: config.typingMax,
  });
}
