import { Server, ServerOptions, Socket } from 'socket.io';
import { createServer, Server as HttpServer } from 'http';
import { Container } from 'inversify';
import { SOCKET_METADATA, SocketControllerMeta } from './socket-metadata';
import { getAllSocketControllerConstructors, getControllerEvents } from './socket-discovery';

interface BuildOptions {
  log?: (msg: string) => void;
  verbose?: boolean;
}

export function buildSocketServer(
  container: Container,
  httpServer?: HttpServer,
  ioOptions?: Partial<ServerOptions>,
  buildOptions: BuildOptions = {}
): Server {
  const {
    log = () => {},
    verbose = false
  } = buildOptions;

  const server = httpServer || createServer();
  const io = new Server(server, ioOptions);

  if (verbose) {
    const originalTo = io.to.bind(io);
    io.to = function(room: string | string[]) {
      const namespace = originalTo(room);
      const originalEmit = namespace.emit.bind(namespace);
      namespace.emit = function(eventName: string, ...args: any[]) {
        log(`[OUTGOING BROADCAST] Room: ${room} | Event: ${eventName} | Data: ${JSON.stringify(args, null, 2)}`);
        return originalEmit(eventName, ...args);
      };
      return namespace;
    };
  }

  container.bind(Server).toConstantValue(io);

  const controllerCtors = getAllSocketControllerConstructors(container);
  log(`Discovered ${controllerCtors.length} socket controllers.`);

  // Pre-load metadata & event maps
  const controllerInfos = controllerCtors.map(ctor => {
    const meta: SocketControllerMeta | undefined = Reflect.getMetadata(SOCKET_METADATA.controller, ctor);
    const events = getControllerEvents(ctor);
    return { ctor, meta, events };
  });

  // TODO: figure out how this works and see if it works
  io.on('connection', (socket: Socket) => {
    log(`Socket connected: ${socket.id}`);

    if (verbose) {
      socket.onAny((eventName, ...args) => {
        log(`[INCOMING] Socket: ${socket.id} | Event: ${eventName} | Data: ${JSON.stringify(args, null, 2)}`);
      });

      const originalEmit = socket.emit.bind(socket);
      socket.emit = function(eventName: string, ...args: any[]) {
        log(`[OUTGOING] Socket: ${socket.id} | Event: ${eventName} | Data: ${JSON.stringify(args, null, 2)}`);
        return originalEmit(eventName, ...args);
    };
  }

    controllerInfos.forEach(({ctor, meta, events}) => {      
      const instance = container.get(ctor);
      const controllerMiddleware = meta?.middleware || [];
      runMiddlewareChain(socket, controllerMiddleware, err => {
        if (err) {
          log(`Middleware error on connect (${ctor.name}): ${err.message || err}`);
          return; // Skip this controller, continue to next
        }

        const onConnectHandler = Reflect.getMetadata(SOCKET_METADATA.onConnect, ctor);
        if (onConnectHandler) {
          try {
            onConnectHandler.call(instance, socket);
          } catch (e: any) {
            log(`onConnect error (${ctor.name}): ${e.message || e}`);
          }
        }

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

          // Only run event-level middleware (not controller middleware)
          const handlerWrapper = (data: any, ack?: Function) => {
            runMiddlewareChain(socket, ev.middleware, async err => {
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

          socket.on(meta?.namespace ? `${meta.namespace}:${finalEventName}` : finalEventName, handlerWrapper);
        });
      });
    });
  });

  return io;
}

function runMiddlewareChain(
  socket: Socket,
  middleware: ((socket: Socket, next: (err?: any) => void) => void | Promise<void>)[],
  done: (err?: any) => void
) {
  let idx = 0;
  const next = (err?: any) => {
    if (err) return done(err);
    if (idx >= middleware.length) return done();
    const fn = middleware[idx++];
    try {
      const result = fn(socket, next);
      // If the middleware returns a Promise, handle rejection
      if (result && typeof result.then === 'function') {
        result.catch((e) => done(e));
      }
    } catch (e) {
      done(e);
    }
  };
  next();
}