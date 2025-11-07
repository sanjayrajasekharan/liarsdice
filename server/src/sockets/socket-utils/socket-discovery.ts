import { Container } from 'inversify';
import { SOCKET_METADATA, SocketEventMeta } from './socket-metadata';

export function getAllSocketControllerConstructors(container: Container): any[] {
  const globalList: any[] = Reflect.getMetadata(SOCKET_METADATA.controllerList, Reflect) || [];

  const discovered: any[] = [];
  for (const ctor of globalList) {
    if (container.isBound(ctor)) {
      discovered.push(ctor);
    } else {
      discovered.push(ctor);
    }
  }
  return discovered;
}

export function getControllerEvents(ctor: any): SocketEventMeta[] {
  return Reflect.getMetadata(SOCKET_METADATA.events, ctor) || [];
}