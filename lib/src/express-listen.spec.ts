import express from "express";
import * as net from "net";
import { listen } from "./express-listen";

describe("listen", () => {
  it("resolves once the server is accepting requests", async () => {
    // The polarity's other half: a callback written to always reject type-checks
    // just as well and would make every server exit on a clean start.
    const server = await listen(express(), 0);
    try {
      expect(server.listening).toBe(true);
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });

  it("rejects when the port cannot be bound", async () => {
    // A callback that ignores its argument type-checks and resolves here,
    // reporting a server that is not accepting requests as started.
    const occupier = net.createServer();
    occupier.on("error", () => undefined);
    const port = await new Promise<number>(resolve => {
      occupier.listen(0, () =>
        resolve((occupier.address() as net.AddressInfo).port)
      );
    });

    try {
      await expect(listen(express(), port)).rejects.toMatchObject({
        code: "EADDRINUSE"
      });
    } finally {
      await new Promise<void>(resolve => occupier.close(() => resolve()));
    }
  });

  it("leaves a post-bind error on the default path rather than swallowing it", async () => {
    // express's own listener is spent once `listening` wins but stays attached,
    // so without dropping it an error raised later reaches a no-op and vanishes.
    const server = await listen(express(), 0);
    try {
      expect(server.listenerCount("error")).toBe(0);
      expect(() => server.emit("error", new Error("later"))).toThrow("later");
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
});
