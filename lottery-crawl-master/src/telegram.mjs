import axios from 'axios';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env');

const setVariable = (content, key, value) => {
  const line = `${key}=${value}`;
  const matcher = new RegExp(`^${key}=.*$`, 'm');
  return matcher.test(content) ? content.replace(matcher, line) : `${content.trimEnd()}\n${line}\n`;
};

export const telegramSettings = () => ({ chatId: process.env.TELEGRAM_CHAT_ID || '', tokenConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN) });

export async function saveTelegramSettings({ token, chatId }) {
  const nextChatId = String(chatId || '').trim();
  const nextToken = String(token || '').trim();
  if (!nextChatId) throw new Error('Cần nhập Chat ID hoặc tên channel Telegram.');
  if (nextToken && /\s/.test(nextToken)) throw new Error('Bot token Telegram không hợp lệ.');
  if (!nextToken && !process.env.TELEGRAM_BOT_TOKEN) throw new Error('Cần nhập bot token Telegram ở lần thiết lập đầu tiên.');
  let content = '';
  try { content = await readFile(envPath, 'utf8'); } catch { /* .env will be created if needed */ }
  content = setVariable(content, 'TELEGRAM_CHAT_ID', nextChatId);
  if (nextToken) content = setVariable(content, 'TELEGRAM_BOT_TOKEN', nextToken);
  await writeFile(envPath, content, 'utf8');
  process.env.TELEGRAM_CHAT_ID = nextChatId;
  if (nextToken) process.env.TELEGRAM_BOT_TOKEN = nextToken;
  return telegramSettings();
}

export async function notifyTelegram(message) {
  const { chatId } = telegramSettings();
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !chatId) return false;
  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chatId, text: message });
    return true;
  } catch (error) {
    console.error('Telegram notification failed:', error.message);
    return false;
  }
}
