import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ─── Load config.json (settings only, NO tokens) ───────────────────────────
let configFile = {};
const configPath = join(root, 'config.json');
const examplePath = join(root, 'config.example.json');

if (existsSync(configPath)) {
  configFile = JSON.parse(readFileSync(configPath, 'utf-8'));
} else if (existsSync(examplePath)) {
  configFile = JSON.parse(readFileSync(examplePath, 'utf-8'));
}

// ─── Build accounts: IDs from config, tokens from ENVIRONMENT ONLY ─────────
let accounts = [];

// 1) Check for GHOST_TOKEN_<ID> env vars (multi-account via .env)
const ghostTokenKeys = Object.keys(process.env).filter(k => k.startsWith('GHOST_TOKEN_'));
if (ghostTokenKeys.length > 0) {
  // If config.json has accounts, use their IDs + prefixes
  if (configFile.accounts && Array.isArray(configFile.accounts) && configFile.accounts.length > 0) {
    for (const acc of configFile.accounts) {
      const id = acc.id || 'default';
      const token = process.env[`GHOST_TOKEN_${id.toUpperCase()}`];
      if (token) {
        accounts.push({
          id,
          token,
          prefix: acc.prefix || configFile.prefix || '.',
        });
      }
    }
  } else {
    // No accounts in config — auto-create from env vars
    for (const key of ghostTokenKeys) {
      const id = key.replace('GHOST_TOKEN_', '').toLowerCase();
      accounts.push({
        id,
        token: process.env[key],
        prefix: configFile.prefix || '.',
      });
    }
  }
}

// 2) Fallback: single DISCORD_TOKEN env var
if (accounts.length === 0 && process.env.DISCORD_TOKEN) {
  accounts.push({
    id: 'default',
    token: process.env.DISCORD_TOKEN,
    prefix: process.env.PREFIX || configFile.prefix || '.',
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
  console.error('    # Multi-account (match IDs from config.json):');
  console.error('    GHOST_TOKEN_MAIN=token_for_main');
  console.error('    GHOST_TOKEN_ALT=token_for_alt');
  console.error('');
  process.exit(1);
}

// Validate
for (const acc of accounts) {
  if (!acc.token) {
    console.error(`[FATAL] Account "${acc.id}" has no token. Set GHOST_TOKEN_${acc.id.toUpperCase()} in .env`);
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
