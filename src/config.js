import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

let configFile = {};
const configPath = join(root, 'config.json');
const examplePath = join(root, 'config.example.json');

if (existsSync(configPath)) {
  configFile = JSON.parse(readFileSync(configPath, 'utf-8'));
} else if (existsSync(examplePath)) {
  configFile = JSON.parse(readFileSync(examplePath, 'utf-8'));
}

// Build accounts array from config
let accounts = [];

if (configFile.accounts && Array.isArray(configFile.accounts) && configFile.accounts.length > 0) {
  // Multi-account mode
  accounts = configFile.accounts.map(acc => ({
    id: acc.id || 'default',
    token: acc.token,
    prefix: acc.prefix || configFile.prefix || '.',
  }));
} else if (configFile.token) {
  // Single-token backward compatibility
  accounts = [{
    id: 'default',
    token: configFile.token,
    prefix: configFile.prefix || '.',
  }];
}

// Also check environment variable for single token
if (accounts.length === 0 && process.env.DISCORD_TOKEN) {
  accounts = [{
    id: 'default',
    token: process.env.DISCORD_TOKEN,
    prefix: process.env.PREFIX || configFile.prefix || '.',
  }];
}

if (accounts.length === 0) {
  console.error('[FATAL] No Discord tokens found. Configure accounts in config.json or set DISCORD_TOKEN in .env');
  process.exit(1);
}

// Validate all accounts have tokens
for (const acc of accounts) {
  if (!acc.token) {
    console.error(`[FATAL] Account "${acc.id}" has no token.`);
    process.exit(1);
  }
}

const config = {
  accounts,
  prefix: configFile.prefix || '.',
  minDelay: configFile.minDelay || 4000,
  maxDelay: configFile.maxDelay || 15000,
  typingMin: configFile.typingMin || 1000,
  typingMax: configFile.typingMax || 3000,
};

export default config;
