const sessions = new Map();

export function createSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createDefaultSession(sessionId) {
  return {
    sessionId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function getOrCreateSession(sessionId) {
  const finalSessionId = sessionId || createSessionId();

  if (!sessions.has(finalSessionId)) {
    sessions.set(finalSessionId, createDefaultSession(finalSessionId));
  }

  return sessions.get(finalSessionId);
}

export function getSession(sessionId) {
  if (!sessionId) return null;
  return sessions.get(sessionId) || null;
}

export function updateEvContext(sessionId, updater) {
  const session = getOrCreateSession(sessionId);
  const current = session.evContext || {};

  const next =
    typeof updater === "function"
      ? updater(current)
      : {
          ...current,
          ...updater
        };

  const updated = {
    ...session,
    evContext: next,
    updatedAt: new Date().toISOString()
  };

  sessions.set(session.sessionId, updated);
  return updated;
}

export function updateLogContext(sessionId, updater) {
  const session = getOrCreateSession(sessionId);
  const current = session.logContext || {};

  const next =
    typeof updater === "function"
      ? updater(current)
      : {
          ...current,
          ...updater
        };

  const updated = {
    ...session,
    logContext: next,
    updatedAt: new Date().toISOString()
  };

  sessions.set(session.sessionId, updated);
  return updated;
}

export function updateProactiveContext(sessionId, updater) {
  const session = getOrCreateSession(sessionId);
  const current = session.proactiveContext || {};

  const next =
    typeof updater === "function"
      ? updater(current)
      : {
          ...current,
          ...updater
        };

  const updated = {
    ...session,
    proactiveContext: next,
    updatedAt: new Date().toISOString()
  };

  sessions.set(session.sessionId, updated);
  return updated;
}

export function clearSession(sessionId) {
  if (!sessionId) return false;
  return sessions.delete(sessionId);
}