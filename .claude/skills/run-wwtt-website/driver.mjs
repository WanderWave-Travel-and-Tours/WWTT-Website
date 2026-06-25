/**
 * Playwright driver for WanderWave Travel & Tours (frontend).
 *
 * Usage (from repo root):
 *   node .claude/skills/run-wwtt-website/driver.mjs [command] [args...]
 *
 * Commands:
 *   screenshot <path> [url]   Take a screenshot. Default url = BASE_URL/packages
 *   navigate <url>            Go to a URL and print page title + status
 *   click <selector>          Click an element
 *   text <selector>           Print innerText of an element
 *   quit                      Close browser
 *
 * Environment:
 *   BASE_URL   default http://localhost:3000
 *   HEADLESS   set to "false" to open a visible window (Windows only)
 */

import { writeFileSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { createInterface } from 'readline';

// Playwright lives in frontend/node_modules — resolve it from there so this
// driver can be run from the repo root without needing its own node_modules.
const __dirname = dirname(fileURLToPath(import.meta.url));
const pwPath = pathToFileURL(join(__dirname, '../../../frontend/node_modules/playwright/index.mjs')).href;
const { chromium } = await import(pwPath);

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const HEADLESS = process.env.HEADLESS !== 'false';

const browser = await chromium.launch({ headless: HEADLESS });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

page.on('console', msg => {
  if (msg.type() === 'error') process.stderr.write(`[browser-err] ${msg.text()}\n`);
});

async function doCommand(cmd, args) {
  switch (cmd) {
    case 'screenshot': {
      const outPath = resolve(args[0] || 'screenshot.png');
      const url = args[1] || `${BASE_URL}/packages`;
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.screenshot({ path: outPath, fullPage: false });
      console.log(`screenshot → ${outPath}`);
      break;
    }
    case 'navigate': {
      const url = args[0] || BASE_URL;
      const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      console.log(`${res.status()} ${await page.title()} @ ${page.url()}`);
      break;
    }
    case 'click': {
      await page.locator(args[0]).first().click();
      console.log(`clicked: ${args[0]}`);
      break;
    }
    case 'text': {
      const el = page.locator(args[0]).first();
      console.log(await el.innerText());
      break;
    }
    case 'quit':
    case 'exit': {
      await browser.close();
      process.exit(0);
    }
    default:
      console.error(`unknown command: ${cmd}`);
  }
}

// If args passed on command line, run once then exit
const [,, cmd, ...rest] = process.argv;
if (cmd) {
  await doCommand(cmd, rest);
  await browser.close();
  process.exit(0);
}

// Otherwise enter REPL mode (for agent use via stdin pipe)
const rl = createInterface({ input: process.stdin });
console.log('driver ready — send: screenshot <path> [url] | navigate <url> | click <sel> | text <sel> | quit');
for await (const line of rl) {
  const [c, ...a] = line.trim().split(/\s+/);
  if (!c) continue;
  try { await doCommand(c, a); } catch (e) { console.error(`error: ${e.message}`); }
}
await browser.close();
