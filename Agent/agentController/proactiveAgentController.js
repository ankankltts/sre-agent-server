import { proactiveEventBus } from "../agents/proactive-agent/index.js";
import {
  getOrCreateSession,
  updateProactiveContext
} from "../agents/sessionStore.js";

export function proactiveAgentStreamController(req, res) {
  const incomingSessionId = req.query.sessionId;
  const session = getOrCreateSession(incomingSessionId);
  const finalSessionId = session.sessionId;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.flushHeaders?.();

  const sendEvent = (payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  sendEvent({
    type: "connected",
    sessionId: finalSessionId,
    message: "Proactive agent stream connected",
    ts: new Date().toISOString()
  });

  const listener = (payload) => {
    const enrichedPayload = {
      ...payload,
      sessionId: payload.sessionId || finalSessionId
    };

    updateProactiveContext(finalSessionId, (currentContext = {}) => {
      const oldHistory = Array.isArray(currentContext.alertHistory)
        ? currentContext.alertHistory
        : [];

      const alert = normalizeProactivePayload(enrichedPayload);

      return {
        ...currentContext,
        lastAlertId: alert.alertId,
        lastAlertType: alert.alertType,
        lastStationId: alert.stationId,
        lastPedestalId: alert.pedestalId,
        lastSeverity: alert.severity,
        lastMessage: alert.message,
        lastRecommendation: alert.recommendation,
        lastEventTime: alert.eventTime,
        alertHistory: [
          ...oldHistory,
          alert
        ].slice(-10)
      };
    });

    sendEvent(enrichedPayload);
  };

  proactiveEventBus.on("proactive-update", listener);

  const heartbeat = setInterval(() => {
    res.write(`: heartbeat ${new Date().toISOString()}\n\n`);
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
    proactiveEventBus.off("proactive-update", listener);
    res.end();
  });
}

function normalizeProactivePayload(payload = {}) {
  return {
    alertId: payload.alertId || payload.incidentKey || `alert_${Date.now()}`,
    alertType: payload.alertType || payload.type || "proactive_alert",
    stationId: payload.stationId || payload.lmId || null,
    pedestalId: payload.pedestalId || null,
    severity: payload.severity || "info",
    message: payload.message || payload.issue || "Proactive alert detected.",
    recommendation: payload.recommendation || null,
    eventTime: payload.eventTime || payload.ts || new Date().toISOString(),
    raw: payload
  };
}