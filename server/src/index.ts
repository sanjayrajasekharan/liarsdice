import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import morgan from 'morgan';
import limiter from './rest/middleware/limiter.js';

import { Container } from 'inversify';
import { InversifyExpressServer } from 'inversify-express-utils';
import { env } from 'process';
import Store from './app/Store.js';
import { buildSocketServer } from './ws/ws-utils/socket-builder.js';
import { GameController } from './ws/GameController.js';
import { Server as SocketServer } from 'socket.io';


const container = new Container();
container.bind(Store).toSelf().inSingletonScope();
container.bind(GameController).toSelf().inSingletonScope();

const app = new InversifyExpressServer(container).build();

app.use(cors());
app.use(morgan('dev'));
app.use(limiter);

const server = http.createServer(app);
const io = buildSocketServer(container, server);

server.listen(env.PORT);
