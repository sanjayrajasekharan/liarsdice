import http from 'http';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import limiter from '@rest/middleware/limiter.js';

import { Container } from 'inversify';
import { InversifyExpressServer } from 'inversify-express-utils';
import { env } from 'process';
import Store from '@store/Store.js';
import InMemoryStore from '@store/InMemoryStore.js';
import GameService from '@app/GameService.js';
import TurnTimerService from '@app/TurnTimerService.js';
import RoundTimerService from '@app/RoundTimerService.js';
import { buildSocketServer } from '@sockets/socket-utils/socket-builder.js';
import { GameController } from '@sockets/GameController.js';
import GamesManagerController from '@rest/GamesMangerController.js';

const container = new Container();
container.bind(Store).to(InMemoryStore).inSingletonScope();
container.bind(GameService).toSelf().inSingletonScope();
container.bind(TurnTimerService).toSelf().inSingletonScope();
container.bind(RoundTimerService).toSelf().inSingletonScope();
container.bind(GameController).toSelf().inSingletonScope();
container.bind(GamesManagerController).toSelf().inSingletonScope();

const corsOrigin = env.CORS_ORIGIN || 'http://localhost:5173';

const app = new InversifyExpressServer(container)
  .setConfig((app) => {
    app.use(cors({ origin: corsOrigin, credentials: true }));
    app.use(morgan('dev'));
    app.use(limiter);
    app.use(express.json());
  })
  .build();
const server = http.createServer(app);

buildSocketServer(container, server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  }
},
  {
    log: console.log,
    verbose: true
  }
);

const PORT = env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🎲 Liar's Dice Server running on port: ${PORT}`);
});
