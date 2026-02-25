import http from 'http';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import limiter from '@rest/middleware/limiter';

import { Container } from 'inversify';
import { InversifyExpressServer, TYPE } from 'inversify-express-utils';
import { env } from 'process';
import Store from '@app/Store';
import GameService from '@app/GameService';
import GamesManagerService from '@app/GamesMangerService';
import { buildSocketServer } from '@sockets/socket-utils/socket-builder';
import { GameController } from '@sockets/GameController';
import GamesManagerController from '@rest/GamesMangerController';

const container = new Container();
container.bind(Store).toSelf().inSingletonScope();
container.bind(GameService).toSelf().inSingletonScope();
container.bind(GameController).toSelf().inSingletonScope();

container.bind(GamesManagerService).toSelf().inSingletonScope();
container.bind(GamesManagerController).toSelf().inSingletonScope();

console.log("Bindings complete.");
const app = new InversifyExpressServer(container)
  .setConfig((app) => {
    app.use(cors());
    app.use(morgan('dev'));
    app.use(limiter);
    app.use(express.json());
  })
  .build();
console.log("Express app built.");
const server = http.createServer(app);

// TODO: maybe make this neater
buildSocketServer(container, server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
},
  {
    log: console.log,
    verbose: true
  }
);

const PORT = env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🎲 Liar's Dice Server running on http://localhost:${PORT}`);
});

// Periodic cleanup of stale games (every 15 minutes)
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;
setInterval(() => {
  const store = container.get(Store);
  const cleanedCount = store.cleanupStaleGames();
  if (cleanedCount > 0) {
    console.log(`🧹 Periodic cleanup: removed ${cleanedCount} stale game(s)`);
  }
}, CLEANUP_INTERVAL_MS);

console.log(`🕐 Stale game cleanup scheduled every ${CLEANUP_INTERVAL_MS / 60000} minutes`);
