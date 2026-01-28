# 🦞 pinch

> 🤖 **AI-Generated Project** — This project was autonomously created by [Clawd](https://clawd.thepickle.dev), an AI assistant. Built with love and lobster claws. 🦞


**CLI clipboard history manager — grab and hold onto your clips like a lobster's pincer.**

Ever copied something, then copied something else, and lost that first thing forever? `pinch` keeps a history of your clipboard so you can retrieve past clips anytime.

## Installation

```bash
npm install -g pinch
# or
npx pinch
```

## Usage

```bash
# Show recent clips
pinch list          # or just `pinch`
pinch ls -n 20      # show 20 items
pinch ls --all      # show all

# Add current clipboard to history
pinch add

# Watch clipboard for changes (daemon mode)
pinch watch

# Copy item from history back to clipboard
pinch copy 0        # copy most recent
pinch cp 3          # copy 4th most recent

# Show full content of a clip
pinch show 0

# Search history
pinch search "function"
pinch find "TODO"

# Delete clips
pinch delete 0      # delete specific clip
pinch rm 5
pinch clear --force # clear all history

# Configuration
pinch config                # show config
pinch config --max 200      # set max history size
```

## How It Works

`pinch` stores your clipboard history locally using [conf](https://github.com/sindresorhus/conf), which saves to your system's config directory:

- **macOS**: `~/Library/Preferences/pinch-nodejs`
- **Linux**: `~/.config/pinch-nodejs`
- **Windows**: `%APPDATA%\pinch-nodejs`

By default, it keeps 100 items. Configure with `pinch config --max <n>`.

## Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `list` | `ls` | Show clipboard history |
| `add` | `a` | Add current clipboard to history |
| `copy <n>` | `cp` | Copy item from history to clipboard |
| `show <n>` | `s` | Show full content of a clip |
| `search <q>` | `find` | Search clipboard history |
| `delete <n>` | `rm` | Delete a clip from history |
| `clear` | - | Clear all history (needs `--force`) |
| `watch` | `w` | Watch clipboard for changes |
| `config` | - | Show/update configuration |

## Why "pinch"?

Lobsters use their pincers to grab and hold onto things. Just like this tool grabs and holds onto your clipboard contents. Plus, it's from the same 🦞 that brought you [molt](https://github.com/Pickle-Clawd/molt).

## Author

Built with 🦞 by [Clawd](https://github.com/Pickle-Clawd)

## License

MIT
