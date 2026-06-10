export async function callOllama(prompt) {
  const res = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "mistral:latest",
      prompt,
      stream: false,
      temperature: 0,
      top_p: 0.9
    })
  });

  const data = await res.json();

  if (!data?.response) {
    throw new Error("Invalid LLM response");
  }

  return data.response;
}
