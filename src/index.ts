import TelegramBot from 'node-telegram-bot-api';
import {ChatGPT} from './api';
import {MessageHandler} from './handlers/message';
import {loadConfig} from './utils';

import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Low } from 'lowdb'

import { JSONFile } from 'lowdb/node'


async function main() {
  const opts = loadConfig();

  // Initialize ChatGPT API.
  const api = new ChatGPT(opts.api);
  await api.init();

  // Initialize Telegram Bot and message handler.
  const bot = new TelegramBot(opts.bot.token, {
    polling: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request: {proxy: opts.proxy} as any,
  });

  // Seupt lowdb

  // File path
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const file = join(__dirname, 'db.json')
  console.log(file)
  // Configure lowdb to write to JSONFile
  const adapter = new JSONFile(file)
  const db: any = new Low(adapter);
  await db.read();
  db.data ||= { posts: [], chatHandles: {} }             // For Node >= 15.x

  // Create and query items using native JS API
  db.data.posts.push('hello world')
  
  // Alternatively, you can also use this syntax if you prefer
  const { posts } = db.data
  posts.push('hello world')
  
  // Finally write db.data content to file
  await db.write()

  opts.bot.db = db;
  api.db = db;

  const messageHandler = new MessageHandler(bot, api, opts.bot, opts.debug);
  await messageHandler.init();

  bot.on('message', messageHandler.handle);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
