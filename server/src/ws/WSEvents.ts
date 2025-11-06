import { Socket, Server } from "socket.io";

interface SocketEventMap {
  eventName: string;
  method: Function;
  propertyKey: string;
}

export class SocketController {
  __events: SocketEventMap[] = [];
}

// TODO: understand how this works
export function socketController() {
  return function <T extends { new(...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      __events: SocketEventMap[] = (constructor.prototype.__events || []);
    };
  };
}

export function socketEvent(eventName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    if (!target.__events) target.__events = [];
    target.__events.push({ eventName, method: descriptor.value, propertyKey });
  };
}

export function registerEvents(socket: Socket, instance: SocketController) {
  const events = instance.__events || [];
  events.forEach(({ eventName, method }) => {
    socket.on(eventName, (data) => method.call(instance, socket, data));
  });

}

export function buildSocketServer(options?: any, onConnection?: (socket: Socket) => void, ...controllers: SocketController[]): Server {
  // raise error if events have duplicate names across controllers
  const eventNames = new Set<string>();
  controllers.forEach((controller) => {
    const events = controller.__events || [];
    events.forEach(({ eventName }) => {
      if (eventNames.has(eventName)) {
        throw new Error(`Duplicate event name detected: ${eventName}`);
      }
      eventNames.add(eventName);
    });
  });

  const io = new Server(options);
  io.on("connection", (socket) => {
    if (onConnection) onConnection(socket);
    if (!socket.connected) return;
    controllers.forEach((controller) => {
      registerEvents(socket, controller);
    });
  });
  return io;
}