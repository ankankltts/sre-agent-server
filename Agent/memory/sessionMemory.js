const sessionStore = new Map();

export function getSessionContext(sessionId) {
  return sessionStore.get(sessionId) || {};
}

export function setSessionContext(sessionId, context) {
  sessionStore.set(sessionId, context);
}

export function clearSessionContext(sessionId) {
  sessionStore.delete(sessionId);
}