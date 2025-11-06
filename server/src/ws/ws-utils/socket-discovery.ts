import { Container } from 'inversify';
import { SOCKET_METADATA, SocketEventMeta } from './socket-metadata';

export function getAllSocketControllerConstructors(container?: Container): any[] {
  // If container provided, scan its bindings for those with controller metadata
  const globalList: any[] = Reflect.getMetadata(SOCKET_METADATA.controllerList, Reflect) || [];

  if (!container) return globalList;

  const discovered: any[] = [];
  // Inversify private API access would be hacky; instead we rely on global list + container availability
  for (const ctor of globalList) {
    if (container.isBound(ctor)) {
      discovered.push(ctor);
    } else {
      // Still include if not bound (will instantiate manually)
      discovered.push(ctor);
    }
  }
  return discovered;
}

export function getControllerEvents(ctor: any): SocketEventMeta[] {
  return Reflect.getMetadata(SOCKET_METADATA.events, ctor) || [];
}