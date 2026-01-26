#!/usr/bin/env node

import { Command } from "commander";
import clipboard from "clipboardy";
import chalk from "chalk";
import ora from "ora";
import {
  getClips,
  addClip,
  getClipById,
  getClipByIndex,
  clearClips,
  deleteClip,
  searchClips,
  getMaxItems,
  setMaxItems,
  ClipItem,
} from "./storage.js";

const program = new Command();

// ASCII art logo
const logo = `
${chalk.hex("#FF6B4A")("   🦞 pinch")}
${chalk.dim("   Clipboard history manager")}
`;

function formatTimestamp(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function displayClip(clip: ClipItem, index: number): void {
  const time = formatTimestamp(clip.timestamp);
  console.log(
    chalk.hex("#FF6B4A")(`[${index}]`) +
    chalk.dim(` (${time}) `) +
    chalk.white(clip.preview)
  );
}

program
  .name("pinch")
  .description("🦞 Clipboard history manager — grab and hold onto your clips")
  .version("1.0.0");

// List clips
program
  .command("list")
  .alias("ls")
  .description("Show clipboard history")
  .option("-n, --number <count>", "Number of items to show", "10")
  .option("-a, --all", "Show all items")
  .action((options) => {
    const clips = getClips();
    
    if (clips.length === 0) {
      console.log(logo);
      console.log(chalk.dim("   No clips yet. Copy something!"));
      console.log(chalk.dim(`   Run ${chalk.white("pinch add")} to capture your clipboard.\n`));
      return;
    }
    
    const limit = options.all ? clips.length : parseInt(options.number, 10);
    const displayClips = clips.slice(0, limit);
    
    console.log(logo);
    console.log(chalk.dim(`   Showing ${displayClips.length} of ${clips.length} clips\n`));
    
    displayClips.forEach((clip, i) => displayClip(clip, i));
    console.log();
    console.log(chalk.dim(`   Use ${chalk.white("pinch copy <index>")} to copy an item.`));
    console.log();
  });

// Add current clipboard to history
program
  .command("add")
  .alias("a")
  .description("Add current clipboard content to history")
  .action(async () => {
    try {
      const content = await clipboard.read();
      const clip = addClip(content);
      
      if (clip) {
        console.log(chalk.green("✓") + " Pinched: " + chalk.dim(clip.preview));
      } else if (!content || content.trim().length === 0) {
        console.log(chalk.yellow("⚠") + " Clipboard is empty");
      } else {
        console.log(chalk.dim("Already have this clip"));
      }
    } catch (err) {
      console.log(chalk.red("✗") + " Failed to read clipboard");
    }
  });

// Copy item from history back to clipboard
program
  .command("copy <index>")
  .alias("cp")
  .description("Copy item from history to clipboard")
  .action(async (indexStr: string) => {
    const index = parseInt(indexStr, 10);
    const clip = getClipByIndex(index);
    
    if (!clip) {
      console.log(chalk.red("✗") + ` No clip at index ${index}`);
      return;
    }
    
    try {
      await clipboard.write(clip.content);
      console.log(chalk.green("✓") + " Copied: " + chalk.dim(clip.preview));
    } catch (err) {
      console.log(chalk.red("✗") + " Failed to write to clipboard");
    }
  });

// Show full content of a clip
program
  .command("show <index>")
  .alias("s")
  .description("Show full content of a clip")
  .action((indexStr: string) => {
    const index = parseInt(indexStr, 10);
    const clip = getClipByIndex(index);
    
    if (!clip) {
      console.log(chalk.red("✗") + ` No clip at index ${index}`);
      return;
    }
    
    console.log(chalk.dim(`\n--- Clip ${index} (${formatTimestamp(clip.timestamp)}) ---\n`));
    console.log(clip.content);
    console.log(chalk.dim("\n--- End ---\n"));
  });

// Search clips
program
  .command("search <query>")
  .alias("find")
  .description("Search clipboard history")
  .action((query: string) => {
    const results = searchClips(query);
    
    if (results.length === 0) {
      console.log(chalk.dim(`No clips matching "${query}"`));
      return;
    }
    
    console.log(logo);
    console.log(chalk.dim(`   Found ${results.length} clip(s) matching "${query}"\n`));
    
    const clips = getClips();
    results.forEach((clip) => {
      const index = clips.findIndex((c) => c.id === clip.id);
      displayClip(clip, index);
    });
    console.log();
  });

// Delete a clip
program
  .command("delete <index>")
  .alias("rm")
  .description("Delete a clip from history")
  .action((indexStr: string) => {
    const index = parseInt(indexStr, 10);
    const clip = getClipByIndex(index);
    
    if (!clip) {
      console.log(chalk.red("✗") + ` No clip at index ${index}`);
      return;
    }
    
    deleteClip(clip.id);
    console.log(chalk.green("✓") + " Deleted: " + chalk.dim(clip.preview));
  });

// Clear all history
program
  .command("clear")
  .description("Clear all clipboard history")
  .option("-f, --force", "Skip confirmation")
  .action((options) => {
    const clips = getClips();
    
    if (clips.length === 0) {
      console.log(chalk.dim("History is already empty"));
      return;
    }
    
    if (!options.force) {
      console.log(chalk.yellow("⚠") + ` This will delete ${clips.length} clip(s).`);
      console.log(chalk.dim(`  Run with ${chalk.white("--force")} to confirm.`));
      return;
    }
    
    clearClips();
    console.log(chalk.green("✓") + ` Cleared ${clips.length} clip(s)`);
  });

// Watch clipboard (daemon mode)
program
  .command("watch")
  .alias("w")
  .description("Watch clipboard for changes")
  .action(async () => {
    console.log(logo);
    console.log(chalk.dim("   Watching clipboard... (Ctrl+C to stop)\n"));
    
    let lastContent = "";
    
    try {
      lastContent = await clipboard.read();
    } catch {
      // Ignore initial read error
    }
    
    const checkInterval = setInterval(async () => {
      try {
        const content = await clipboard.read();
        if (content !== lastContent && content.trim()) {
          lastContent = content;
          const clip = addClip(content);
          if (clip) {
            console.log(
              chalk.green("📌") + " " +
              chalk.dim(formatTimestamp(Date.now())) + " " +
              clip.preview
            );
          }
        }
      } catch {
        // Ignore read errors
      }
    }, 500);
    
    process.on("SIGINT", () => {
      clearInterval(checkInterval);
      console.log(chalk.dim("\n   Stopped watching.\n"));
      process.exit(0);
    });
  });

// Config commands
program
  .command("config")
  .description("Show or update configuration")
  .option("--max <count>", "Set max history size")
  .action((options) => {
    if (options.max) {
      const max = parseInt(options.max, 10);
      if (isNaN(max) || max < 1) {
        console.log(chalk.red("✗") + " Max must be a positive number");
        return;
      }
      setMaxItems(max);
      console.log(chalk.green("✓") + ` Max history size: ${max}`);
      return;
    }
    
    console.log(logo);
    console.log(chalk.dim("   Configuration:\n"));
    console.log(`   Max history size: ${chalk.white(getMaxItems())}`);
    console.log(`   Current clips: ${chalk.white(getClips().length)}`);
    console.log();
  });

// Default: show list if no command given
if (process.argv.length === 2) {
  process.argv.push("list");
}

program.parse();
