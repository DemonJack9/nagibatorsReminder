const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

if (!process.env.TOKEN) {
  console.error("Bot token not found in environment variables!");
  process.exit(1);
}

const TOKEN = process.env.TOKEN;

function parseInterval(input) {
  const match = input.match(/^(\d+)([smhd])$/);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2];

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  };

  return value * multipliers[unit];
}

function getDelayUntilStart(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;

  const now = new Date();
  const start = new Date();

  start.setHours(hours, minutes, 0, 0);

  if (start <= now) {
    start.setDate(start.getDate() + 1);
  }

  return start - now;
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (!message.content.startsWith('!schedule')) return;
  if (message.author.bot) return;

  const args = message.content.split(' ').slice(1);

  if (args.length < 3) {
    return message.reply(
      'Usage: !schedule HH:MM interval message\nExample: !schedule 23:30 11h Raid reminder!'
    );
  }

  const startTime = args[0];
  const intervalInput = args[1];
  const text = args.slice(2).join(' ');

  const interval = parseInterval(intervalInput);
  const delay = getDelayUntilStart(startTime);

  if (!interval) {
    return message.reply('Invalid interval format. Use 30m, 11h, 2d, etc.');
  }

  if (delay === null) {
    return message.reply('Invalid time format. Use HH:MM (24h format).');
  }

  message.reply(
    `Scheduled message starting at ${startTime} and repeating every ${intervalInput}`
  );

  // Wait until start time
  setTimeout(() => {
    message.channel.send(text);

    // Then repeat
    setInterval(() => {
      message.channel.send(text);
    }, interval);

  }, delay);
});

client.login(TOKEN);