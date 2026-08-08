import { describe, expect, test } from "bun:test";
import { applyAiStreamEvent, assertAiStreamComplete, parseAiSseLine } from "./ai-stream";

describe("AI SSE terminal handling", () => {
  test("rejects partial output followed by an error", () => {
    let state = applyAiStreamEvent({ done: false, response: "" }, parseAiSseLine('data: {"response":"partial"}'));
    expect(() => applyAiStreamEvent(state, parseAiSseLine('data: {"error":"secret"}'))).toThrow("AI generation failed");
  });
  test("rejects EOF without done", () => {
    expect(() => assertAiStreamComplete({ done: false })).toThrow("AI stream ended before completion");
  });
  test("accepts an explicit done terminal", () => {
    const state = applyAiStreamEvent({ done: false, response: "" }, parseAiSseLine('data: {"status":"done"}'));
    expect(() => assertAiStreamComplete(state)).not.toThrow();
  });
  test("rejects duplicate done and every event after done", () => {
    const done = applyAiStreamEvent(
      { done: false, response: "" },
      parseAiSseLine('data: {"status":"done"}'),
    );
    expect(() => applyAiStreamEvent(done, { status: "done" })).toThrow(
      "AI stream event received after completion",
    );
    expect(() => applyAiStreamEvent(done, { response: "late" })).toThrow(
      "AI stream event received after completion",
    );
  });

});
