export function parseAiSseLine(line) {
  if (!line.startsWith("data: ")) return null;
  return JSON.parse(line.slice(6));
}

export function applyAiStreamEvent(state, event) {
  if (!event) return state;
  if (state.done) throw new Error("AI stream event received after completion");
  if (event.error) throw new Error("AI generation failed");
  return {
    done: state.done || event.status === "done",
    response: event.response || "",
  };
}

export function assertAiStreamComplete(state) {
  if (!state.done) throw new Error("AI stream ended before completion");
}
