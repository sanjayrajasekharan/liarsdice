import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;
const DIST = join(__dirname, 'dist');

const CRAWLER_AGENTS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'Slackbot',
  'Discordbot',
  'WhatsApp',
  'TelegramBot',
];

function isCrawler(userAgent) {
  return CRAWLER_AGENTS.some(bot => userAgent?.includes(bot));
}

app.get('/game/:gameCode', (req, res, next) => {
  if (!isCrawler(req.get('User-Agent'))) {
    return next();
  }

  const { gameCode } = req.params;

  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://liarsdice.app/game/${gameCode}" />
  <meta property="og:title" content="Join my game!" />
  <meta property="og:description" content="Click to join Liar's Dice game ${gameCode}" />
  <meta property="og:image" content="https://liarsdice.app/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Join my game!" />
  <meta name="twitter:description" content="Click to join Liar's Dice game ${gameCode}" />
  <meta name="twitter:image" content="https://liarsdice.app/og-image.png" />
  <title>Join my Liar's Dice game!</title>
</head>
<body></body>
</html>`);
});

app.use(express.static(DIST));

app.get('*', (req, res) => {
  res.sendFile(join(DIST, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Client server running on port ${PORT}`);
});
