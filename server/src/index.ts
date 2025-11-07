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
import { Server as SocketServer } from 'socket.io';
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
const io = buildSocketServer(container, server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }},
     {
        log: console.log
    }
);

const PORT = env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🎲 Liar's Dice Server running on http://localhost:${PORT}`);
});
