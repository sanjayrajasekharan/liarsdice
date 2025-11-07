import 'reflect-metadata';
import { Socket } from 'socket.io';

export const SOCKET_METADATA = {
  controller: Symbol.for('socket:controller'),
  controllerList: Symbol.for('socket:controller:list'),
  events: Symbol.for('socket:events'),
  onConnect: Symbol.for('socket:onConnect'),
  onDisconnect: Symbol.for('socket:onDisconnect')
};

export interface SocketControllerMeta {
  namespace?: string;
  middleware: SocketMiddleware[];
  target: any;
}

export interface SocketEventMeta {
  eventName: string;
  key: string | symbol;
  handler: Function;
  middleware: SocketMiddleware[];
}

export type SocketMiddleware = (socket: Socket, next: (err?: any) => void) => void;

export interface EventHandlerContext<Data = any> {
  socket: Socket;
  data: Data;
}