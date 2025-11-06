import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import morgan from 'morgan';
import limiter from './rest/middleware/limiter.js';
import gamesRouter from './rest/GamesController.js';

import WebSocket from 'ws';
import Router from './ws/Router.js';
import { Container } from 'inversify';
import { InversifyExpressServer } from 'inversify-express-utils';
import { env } from 'process';
import Store from './app/Store.js';


const container = new Container();
container.bind(Store).toSelf().inSingletonScope();

const server = new InversifyExpressServer(container);
const app = server.build();

app.use(cors());
app.use(morgan('dev'));
app.use(limiter);

app.listen(env.PORT, () => {
    console.log(`Server is running on port ${env.PORT}`);
});