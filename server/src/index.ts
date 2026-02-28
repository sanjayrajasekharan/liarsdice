import http from 'http';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import limiter from '@rest/middleware/limiter';

import { Container } from 'inversify';
import { InversifyExpressServer } from 'inversify-express-utils';
import { env } from 'process';
import Store from '@store/Store';
import InMemoryStore from '@store/InMemoryStore';
import GameService from '@app/GameService';
import TurnTimerService from '@app/TurnTimerService';
import RoundTimerService from '@app/RoundTimerService';
import { buildSocketServer } from '@sockets/socket-utils/socket-builder';
import { GameController } from '@sockets/GameController';
import GamesManagerController from '@rest/GamesMangerController';

const container = new Container();
container.bind(Store).to(InMemoryStore).inSingletonScope();
container.bind(GameService).toSelf().inSingletonScope();
container.bind(TurnTimerService).toSelf().inSingletonScope();
container.bind(RoundTimerService).toSelf().inSingletonScope();
container.bind(GameController).toSelf().inSingletonScope();
container.bind(GamesManagerController).toSelf().inSingletonScope();

const app = new InversifyExpressServer(container)
  .setConfig((app) => {
    app.use(cors());
    app.use(morgan('dev'));
    app.use(limiter);
    app.use(express.json());
  })
  .build();
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
  console.log(`🎲 Liar's Dice Server running on port: ${PORT}`);
});
