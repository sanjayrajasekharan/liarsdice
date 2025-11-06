import { Server, ServerOptions, Socket } from 'socket.io';
import { createServer, Server as HttpServer } from 'http';
import { Container } from 'inversify';
import { SOCKET_METADATA, SocketControllerMeta } from './socket-metadata';
import { getAllSocketControllerConstructors, getControllerEvents } from './socket-discovery';
import  SocketController  from './SocketController';

interface BuildOptions {
  detectDuplicateEvents?: boolean;
  allowNamespaceDuplicates?: boolean; // duplicates allowed if different namespaces
  log?: (msg: string) => void;
}

export function buildSocketServer(
  container: Container,
  httpServer?: HttpServer,
  ioOptions?: Partial<ServerOptions>,
  buildOptions: BuildOptions = {}
): Server {
  const {
    detectDuplicateEvents = true,
    allowNamespaceDuplicates = true,
    log = () => {}
  } = buildOptions;

  const server = httpServer || createServer();
  const io = new Server(server, ioOptions);

  const controllerCtors = getAllSocketControllerConstructors(container);
  log(`Discovered ${controllerCtors.length} socket controllers.`);

  // Pre-load metadata & event maps
  const controllerInfos = controllerCtors.map(ctor => {
    const meta: SocketControllerMeta | undefined = Reflect.getMetadata(SOCKET_METADATA.controller, ctor);
    const events = getControllerEvents(ctor);
    return { ctor, meta, events };
  });

  if (detectDuplicateEvents) {
    const seen = new Map<string, string>(); // eventName -> controllerName
    for (const info of controllerInfos) {
      const ns = info.meta?.namespace;
      for (const ev of info.events) {
        const key = allowNamespaceDuplicates && ns ? `${ns}::${ev.eventName}` : ev.eventName;
        if (seen.has(key)) {
          throw new Error(
            `Duplicate socket event "${ev.eventName}" (resolved key "${key}") in controllers: ${seen.get(key)} and ${info.ctor.name}`
          );
        }
        seen.set(key, info.ctor.name);
      }
    }
  }

  io.on('connection', (socket: Socket) => {
    log(`Socket connected: ${socket.id}`);

    controllerInfos.forEach(info => {
      const { ctor, meta, events } = info;
      // Resolve instance from container if bound; fallback to new
      let instance: SocketController;
      if (container.isBound(ctor)) {
        instance = container.get<SocketController>(ctor);
      } else {
        instance = new ctor();
      }

      // Attach current socket reference (transient)
      (instance as any).__currentSocket = socket;

      // Call onConnect lifecycle method if defined
      const onConnectHandler = Reflect.getMetadata(SOCKET_METADATA.onConnect, ctor);
      if (onConnectHandler) {
        try {
          onConnectHandler.call(instance, socket);
        } catch (e: any) {
          log(`onConnect error (${ctor.name}): ${e.message || e}`);
        }
      }

      // Call onDisconnect lifecycle method if defined
      const onDisconnectHandler = Reflect.getMetadata(SOCKET_METADATA.onDisconnect, ctor);
      if (onDisconnectHandler) {
        socket.on('disconnect', () => {
          try {
            onDisconnectHandler.call(instance, socket);
          } catch (e: any) {
            log(`onDisconnect error (${ctor.name}): ${e.message || e}`);
          }
        });
      }

      events.forEach(ev => {
        const finalEventName = meta?.namespace ? `${meta.namespace}:${ev.eventName}` : ev.eventName;

        // Compose middleware chain per-event: controller middleware + event middleware
        const handlerWrapper = (data: any, ack?: Function) => {
          // Run controller-level middleware first, then event-level middleware
          const combinedMiddleware = [...(meta?.middleware || []), ...ev.middleware];
          
          runMiddlewareChain(socket, combinedMiddleware, async err => {
            if (err) {
              log(`Middleware error (${finalEventName}): ${err.message || err}`);
              if (ack) ack({ error: true, message: err.message || String(err) });
              return;
            }
            try {
              const result = ev.handler.call(instance, socket, data);
              const awaited = result instanceof Promise ? await result : result;
              if (ack) ack(awaited);
            } catch (e: any) {
              log(`Event handler error (${finalEventName}): ${e.message || e}`);
              if (ack) ack({ error: true, message: e.message || String(e) });
            }
          });
        };

        socket.on(finalEventName, handlerWrapper);
        log(`Registered event "${finalEventName}" for controller ${ctor.name}`);
      });
    });
  });

  return io;
}

function runMiddlewareChain(
  socket: Socket,
  middleware: ((socket: Socket, next: (err?: any) => void) => void)[],
  done: (err?: any) => void
) {
  let idx = 0;
  const next = (err?: any) => {
    if (err) return done(err);
    if (idx >= middleware.length) return done();
    const fn = middleware[idx++];
    try {
      fn(socket, next);
    } catch (e) {
      done(e);
    }
  };
  next();
}