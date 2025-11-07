import http from 'http';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import limiter from './rest/middleware/limiter.js';

import { Container } from 'inversify';
import { InversifyExpressServer, TYPE } from 'inversify-express-utils';
import { env } from 'process';
import Store from './app/Store.js';
import GameService from './app/GameService.js';
import GamesManagerService from './app/GamesMangerService.js';
import { buildSocketServer } from './sockets/socket-utils/socket-builder.js';
import { GameController } from './sockets/GameController.js';
import { Server as SocketServer } from 'socket.io';
import GamesManagerController from './rest/GamesMangerController.js';

const container = new Container();
container.bind<Store>('Store').to(Store).inSingletonScope();
container.bind<GameService>('GameService').to(GameService).inSingletonScope();
// Bind GameController by class, not string, so socket-builder can resolve it
container.bind<GameController>(GameController).toSelf().inSingletonScope();

container.bind<GamesManagerService>('GamesManagerService').to(GamesManagerService).inSingletonScope();
container.bind<GamesManagerController>('GamesManagerController').to(GamesManagerController).inSingletonScope();

const app = new InversifyExpressServer(container)
    .setConfig((app) => {
        app.use(cors());
        app.use(morgan('dev'));
        app.use(limiter);
        app.use(express.json());
    })
    .build();

const server = http.createServer(app);
const io = buildSocketServer(container, server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const PORT = env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🎲 Liar's Dice Server running on http://localhost:${PORT}`);
});
