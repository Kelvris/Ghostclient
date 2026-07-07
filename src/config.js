import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ─── Load config.json (settings only — NO tokens, NO accounts) ─────────────
let configFile = {};
const configPath = join(root, 'config.json');
const examplePath = join(root, 'config.example.json');

if (existsSync(configPath)) {
  configFile = JSON.parse(readFileSync(configPath, 'utf-8'));
} else if (existsSync(examplePath)) {
  configFile = JSON.parse(readFileSync(examplePath, 'utf-8'));
}

const prefix = configFile.prefix || '.';

// ─── Build accounts: tokens from .env ONLY ─────────────────────────────────
let accounts = [];

// 1) Scan for TOKEN_1, TOKEN_2, ... TOKEN_N (multi-account)
const tokenKeys = Object.keys(process.env)
  .filter(k => /^TOKEN_\d+$/.test(k))
  .sort((a, b) => {
    const na = parseInt(a.split('_')[1], 10);
    const nb = parseInt(b.split('_')[1], 10);
    return na - nb;
  });

if (tokenKeys.length > 0) {
  for (const key of tokenKeys) {
    const num = key.split('_')[1];
    accounts.push({
      id: `account${num}`,
      token: process.env[key],
      prefix,
    });
  }
}

// 2) Fallback: single DISCORD_TOKEN env var
if (accounts.length === 0 && process.env.DISCORD_TOKEN) {
  accounts.push({
    id: 'default',
    token: process.env.DISCORD_TOKEN,
    prefix,
  });
}

if (accounts.length === 0) {
  console.error('');
  console.error('  ⚠️  No tokens found!');
  console.error('');
  console.error('  Create a .env file:');
  console.error('    cp .env.example .env');
  console.error('');
  console.error('  Then add your token(s):');
  console.error('    # Single account:');
  console.error('    DISCORD_TOKEN=your_token_here');
  console.error('');
  console.error('    # Multi-account:');
  console.error('    TOKEN_1=your_first_token');
  console.error('    TOKEN_2=your_second_token');
  console.error('    TOKEN_3=your_third_token');
  console.error('');
  process.exit(1);
}

// Validate
for (const acc of accounts) {
  if (!acc.token) {
    console.error(`[FATAL] Account "${acc.id}" has an empty token.`);
    process.exit(1);
  }
}

const config = {
  accounts,
  prefix,
  dmDeleteAfter: configFile.dmDeleteAfter ?? 15000,
  minDelay: configFile.minDelay || 4000,
  maxDelay: configFile.maxDelay || 15000,
  typingMin: configFile.typingMin || 1000,
  typingMax: configFile.typingMax || 3000,
};

export default config;
