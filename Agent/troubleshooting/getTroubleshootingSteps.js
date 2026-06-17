import { searchDocs } from "../rag/vectorStore.js";

export async function getTroubleshootingSteps({ type, issue }) {
  if (!type || !issue) {
    return "Type and issue are required for troubleshooting.";
  }

  const query = `${type} ${issue} troubleshooting`;

  const { docs } = await searchDocs(query, type, issue);

  if (!docs || docs.length === 0) {
    return `No troubleshooting steps found for ${type} (${issue}).`;
  }

  const stepsSet = new Set();

  docs.forEach((doc) => {
    doc.steps?.forEach((step) => {
      stepsSet.add(step);
    });
  });

  const steps = Array.from(stepsSet);

  if (steps.length === 0) {
    return `No troubleshooting steps found for ${type} (${issue}).`;
  }

  return `
Troubleshooting (${type} - ${issue}):

${steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}
`.trim();
}