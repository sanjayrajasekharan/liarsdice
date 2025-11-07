import { SOCKET_METADATA, SocketControllerMeta, SocketMiddleware, SocketEventMeta } from './socket-metadata';


type Constructor<T = any> = new (...args: any[]) => T;


export function socketController(namespace?: string, ...middleware: SocketMiddleware[]) {
  return function <T extends Constructor>(Target: T) {

    const meta: SocketControllerMeta = {
      namespace,
      middleware,
      target: Target
    };

    Reflect.defineMetadata(SOCKET_METADATA.controller, meta, Target);
    // TODO: look into this --> Maintain global list (useful if not relying solely on container)
    const list: any[] = Reflect.getMetadata(SOCKET_METADATA.controllerList, Reflect) || [];
    list.push(Target);
    Reflect.defineMetadata(SOCKET_METADATA.controllerList, list, Reflect);

    return Target;
  };
}

export function event(eventName: string, ...middleware: SocketMiddleware[]) {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const ctor = target.constructor;
    const events: SocketEventMeta[] = Reflect.getMetadata(SOCKET_METADATA.events, ctor) || [];
    events.push({
      eventName,
      key: propertyKey,
      handler: descriptor.value,
      middleware
    });
    Reflect.defineMetadata(SOCKET_METADATA.events, events, ctor);
  };
}

export function onConnect() {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const ctor = target.constructor;
    Reflect.defineMetadata(SOCKET_METADATA.onConnect, descriptor.value, ctor);
  };
}

export function onDisconnect() {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const ctor = target.constructor;
    Reflect.defineMetadata(SOCKET_METADATA.onDisconnect, descriptor.value, ctor);
  };
}