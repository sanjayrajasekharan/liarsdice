import http from 'http';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import limiter from '@rest/middleware/limiter.js';

import { Container } from 'inversify';
import { InversifyExpressServer, TYPE } from 'inversify-express-utils';
import { env } from 'process';
import Store from '@store/Store.js';
import InMemoryStore from '@store/InMemoryStore.js';
import GameService from '@app/GameService.js';
import TurnTimerService from '@app/TurnTimerService.js';
import { buildSocketServer } from '@sockets/socket-utils/socket-builder.js';
import { GameController } from '@sockets/GameController.js';
import GamesManagerController from '@rest/GamesMangerController.js';

const container = new Container();
container.bind(Store).to(InMemoryStore).inSingletonScope();
container.bind(GameService).toSelf().inSingletonScope();
container.bind(TurnTimerService).toSelf().inSingletonScope();
container.bind(GameController).toSelf().inSingletonScope();
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
