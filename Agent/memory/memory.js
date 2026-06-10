let lastContext = {};

export function getContext() {
  return lastContext;
}

export function setContext(context) {
  lastContext = context;
}

export function clearContext() {
  lastContext = {};
}
