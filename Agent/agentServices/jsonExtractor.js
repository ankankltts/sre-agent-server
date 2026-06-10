export function extractJSON(text) {
  try {
    JSON.parse(text.trim());    try {
    } catch {}

    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start !== -1 && end !== -1) {
      const jsonString = text.slice(start, end + 1);
      return JSON.parse(jsonString);
    }

    return null;

  } catch (err) {
    console.warn("JSON extraction failed:", err.message);
    return null;
  }
}

