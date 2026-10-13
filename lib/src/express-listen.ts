import { Application } from "express";
import { Server } from "http";

/**
 * Start `app` on `port`, resolving once it is accepting requests.
 *
 * express adds this callback as the server's `error` listener as well as
 * handing it to node's `listening`, and wraps it so the first of the two wins.
 * Two consequences, and neither is optional to handle:
 *
 * A port that cannot be bound arrives here as the argument rather than as an
 * unhandled event. A callback that ignores it resolves, which reports a server
 * that never bound as started.
 *
 * Once `listening` has won, that listener is spent but stays attached, so an
 * error raised after the bind — a descriptor limit reached while accepting,
 * say — is delivered to a no-op and vanishes. Dropping it puts a later error
 * back on the default path, where it terminates the process instead.
 */
export function listen(app: Application, port: number): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, (error?: Error) => {
      if (error) {
        reject(error);
        return;
      }
      server.removeAllListeners("error");
      resolve(server);
    });
  });
}
