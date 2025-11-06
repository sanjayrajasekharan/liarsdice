import { SOCKET_METADATA, SocketControllerMeta, SocketMiddleware, SocketEventMeta } from './socket-metadata';

export default class SocketController {
  // Placeholder for shared helpers (e.g., emit wrappers)
  protected emit(event: string, payload: any) {
    (this as any).__currentSocket?.emit(event, payload);
  }
}

type Constructor<T = any> = new (...args: any[]) => T;

function ensureBase<T extends Constructor>(Target: T): T {
  if (Target.prototype instanceof SocketController) return Target;

  class AutoExtended extends SocketController {
    constructor(...args: any[]) {
      super();
      // Call original constructor logic (unsafe if it had super(), private fields, etc.)
      (Target as any).apply(this, args);
    }
  }

  // Copy prototype (excluding constructor)
  for (const key of Reflect.ownKeys(Target.prototype)) {
    if (key === 'constructor') continue;
    const desc = Object.getOwnPropertyDescriptor(Target.prototype, key)!;
    Object.defineProperty(AutoExtended.prototype, key, desc);
  }

  // Copy static members
  for (const key of Reflect.ownKeys(Target)) {
    if (['prototype', 'name', 'length'].includes(String(key))) continue;
    const desc = Object.getOwnPropertyDescriptor(Target, key)!;
    Object.defineProperty(AutoExtended, key, desc);
  }

  return AutoExtended as unknown as T;
}

export function socketController(namespace?: string, ...middleware: SocketMiddleware[]) {
  return function <T extends Constructor>(Target: T) {
    const Actual = ensureBase(Target);

    const meta: SocketControllerMeta = {
      namespace,
      middleware,
      target: Actual
    };

    Reflect.defineMetadata(SOCKET_METADATA.controller, meta, Actual);

    // Maintain global list (useful if not relying solely on container)
    const list: any[] = Reflect.getMetadata(SOCKET_METADATA.controllerList, Reflect) || [];
    list.push(Actual);
    Reflect.defineMetadata(SOCKET_METADATA.controllerList, list, Reflect);

    return Actual;
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

// Alias for backwards compatibility
export const socketEvent = event;

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