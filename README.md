<h1 align="center">👻 Ghostclient</h1>

<p align="center">
  <b><i>"They don't know I'm a selfbot. They never know."</i></b>
</p>

<p align="center">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white"/>
  <img alt="License" src="https://img.shields.io/badge/License-MIT-yellow"/>
  <img alt="Stealth Level" src="https://img.shields.io/badge/Stealth-Ninja%20Grade-8A2BE2"/>
  <img alt="Discord ToS" src="https://img.shields.io/badge/Discord%20ToS-Voided%20With%20Style-ff69b4"/>
  <a href="https://discord.gg/p2CK5guHZx"><img alt="Discord" src="https://img.shields.io/badge/Discord-Join-5865F2?logo=discord&logoColor=white"/></a>
</p>

<p align="center">
  Ghostclient is a stealth-first Discord selfbot with a humanizer engine, AFK auto-response, anti-spam cooldown, lockdown mode, and multi-account support. It automates user accounts with randomized delays and varied responses to appear human.
</p>

---

## 👀 What is Ghostclient?

Ghostclient is a **stealth-first Discord selfbot** that does everything a selfbot should do — but without looking like one.

You know how most selfbots are **blatantly obvious**? You ping them, they instantly reply like a soulless robot, and suddenly everyone knows. **Ghostclient doesn't do that.**

Instead, it:
- ⏱️ **Waits** a human amount of time before responding (4–15 seconds)
- ⌨️ **Shows typing indicators** like a real person
- 🎭 **Varies its wording** every single time — no copy-paste tells
- 🧊 **Freezes everything** with a single command if you feel watched

> **TL;DR:** It's a selfbot that passes the Turing test on vibes alone.

---

## ⚠️ The Fine Print (Read or Regret)

```
DISCORD TERMS OF SERVICE: Section 3.1 — Automation
"Use of the API to automate user accounts is prohibited."
```

**Ghostclient is for EDUCATIONAL PURPOSES only.** You are responsible for your own account. The developers are not liable if Discord yeets you into the shadow realm.

**Pro tips to not get caught:**
- Don't use on your main account (use an alt)
- Don't be stupid about it (mass DMing, raiding, etc.)
- The Humanizer™ is good but it's not magic

---

## ✨ Features

### 🛡️ The Defense System (The Main Event)

| Feature | What it does |
|---------|-------------|
| **Humanizer™ Engine** | Random delays, typing indicators, varied responses — you look human |
| **AFK Auto-Response** | When pinged while AFK, responds naturally after a delay |
| **Anti-Spam Cooldown** | Won't flood the channel if someone spam-pings you |
| **Lockdown Mode** | `ononly` → instantly stops ALL commands and auto-responses |

### 💬 Commands

| Command | Aliases | What it does | DM Only? |
|---------|---------|-------------|----------|
| `ping` | `p`, `latency` | Check your bot's connection speed | ❌ |
| `afk` | `brb`, `away` | Set/remove AFK with a reason | ✅ |
| `prefix` | `setprefix` | View or change command prefix for this account | ❌ |
| `help` | `h`, `commands` | Lists all commands | ✅ |
| `ononly` | `panic`, `lockdown`, `kill` | **KILL SWITCH** — disables everything except itself | ✅ |

### 🔐 Lockdown Mode (`ononly`)

Run `.ononly` and:

```
🔒 Lockdown engaged. All commands and features are disabled.
```

- **No commands work** (except `ononly` itself)
- **No AFK responses** fire
- **Nothing** — you're a ghost
- Run `.ononly` again to restore everything

Perfect for when someone's acting suspicious and you need to go **completely dark**.

### 🔧 Per-Account Prefix

Each account can have its own command prefix — no more fighting over `.`:

```
.prefix             → shows current prefix (e.g. ".")
.prefix !           → changes prefix to "!"
!prefix             → now works with the new prefix
```

Prefixes are saved in the database and survive restarts. Fallback is whatever's in `config.json`.

### 👥 Multi-Account

Run multiple Discord accounts simultaneously from a single terminal.

**No config changes needed.** Just add numbered tokens to `.env`:

```bash
TOKEN_1=your_first_token
TOKEN_2=your_second_token
TOKEN_3=your_third_token
```

Accounts are auto-named `account1`, `account2`, etc. Each one has:
- Isolated AFK state
- Its own lockdown state
- All features, independently

One `.env`. Multiple ghosts. Maximum chaos.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (if you don't have it, go fix your life)
- A Discord user token (Google is your friend)

### Installation

```bash
# Clone it
git clone https://github.com/Kelvris/Ghostclient.git
cd Ghostclient

# Install the goodies
npm install

# Set up your secrets
cp .env.example .env
# Edit .env — paste your Discord token
```

### Configuration

**Rule:** `config.json` = settings · `.env` = secrets. Simple.

#### 1. `config.json` (settings — public-safe)

```json
{
  "prefix": ".",
  "minDelay": 4000,
  "maxDelay": 15000,
  "typingMin": 1000,
  "typingMax": 3000
}
```

No tokens. No accounts. Just settings.

#### 2. `.env` (secrets — keep this private!)

```bash
# Single account:
DISCORD_TOKEN=your_token_here

# Multi-account (no config changes needed):
TOKEN_1=your_first_token
TOKEN_2=your_second_token
```

That's it. `TOKEN_1` becomes `account1`, `TOKEN_2` becomes `account2`, and so on.

### Run It

```bash
npm run dev     # Development mode (auto-restart on changes)
# or
npm start       # Production mode
```

---

## ⚙️ Architecture (For the Nerds)

```
Ghostclient/
├── src/
│   ├── index.js                     # Entry point — one ring to rule them all
│   ├── config.js                    # Config loader (env + json)
│   ├── logger.js                    # Colored logging (pretty console goes brr)
│   ├── database.js                  # SQLite with WAL mode
│   ├── clientManager.js             # Multi-account client wizard
│   ├── repositories/
│   │   ├── afkRepository.js         # AFK data go brr
│   │   ├── commandLogRepository.js  # 📝 logging
│   │   ├── settingsRepository.js    # ⚙️ per-account settings (prefix)
│   │   └── stateRepository.js       # Lockdown state persistence
│   ├── defense/
│   │   ├── humanizer.js             # 🔥 The real MVP — anti-detection engine
│   │   └── afkManager.js            # AFK state + mention defense
│   └── commands/
│       ├── handler.js               # Command parser + lockdown enforcer
│       └── core/
│           ├── ping.js              # 🏓
│           ├── afk.js               # 🛌
│           ├── prefix.js            # 🔄 per-account prefix
│           ├── help.js              # 📖
│           └── ononly.js            # ☠️ KILL SWITCH
├── config.example.json              # Template for your config
├── .env.example                     # Template for your secrets
└── package.json                     # Dependencies galore
```

### Tech Stack

| Thing | Choice | Why |
|-------|--------|-----|
| Language | JavaScript (ESM) | No build step, just run |
| Discord Lib | `discord.js-selfbot-v13` | The O.G. selfbot library |
| Database | `better-sqlite3` | Fast, local, zero setup |
| Logging | `chalk` | Console prettiness |

---

## 🔧 Advanced Configuration

### Timing Settings (Customize Your Humanizer™)

```json
{
  "minDelay": 2000,
  "maxDelay": 20000,
  "typingMin": 500,
  "typingMax": 5000
}
```

| Setting | Default | Range | What it controls |
|---------|---------|-------|-----------------|
| `minDelay` | 4000ms | 1000–30000 | Minimum wait before responding |
| `maxDelay` | 15000ms | 1000–60000 | Maximum wait before responding |
| `typingMin` | 1000ms | 500–10000 | Minimum typing indicator duration |
| `typingMax` | 3000ms | 500–15000 | Maximum typing indicator duration |

---

## 🧪 How the Humanizer™ Works

1. **Message comes in** (someone pinged you)
2. **Random delay** (4–15 seconds by default) — you look like you're busy
3. **Typing indicator** appears for 1–3 seconds
4. **Random response** from a pool of 8+ variations
5. **Response sent** — they have NO IDEA it was automated

Every response is different. Every timing is different. The humanizer learns nothing because there's nothing to learn — it's pure entropy.

---

## 🤝 Contributing

Got an idea? Found a bug? Want to add a feature?

1. Fork it
2. Branch it
3. Code it
4. PR it
5. Profit???

---

## 📜 License

MIT — Do whatever you want, just don't blame us when Discord sends you that scary email.

---

<p align="center">
  <sub>Made with ☕, 😤, and a complete disregard for Discord's Terms of Service.</sub>
  <br>
  <sub>Star the repo if you're a real one ⭐</sub>
</p>
