import { EventEmitter } from "events";

export const proactiveEventBus = new EventEmitter();

proactiveEventBus.setMaxListeners(50);

export function emitProactiveUpdate(payload) {
  proactiveEventBus.emit("proactive-update", {
    ...payload,
    ts: new Date().toISOString()
  });
}