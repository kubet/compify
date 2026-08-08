import { baseUrl } from "@/constains";
import { useState, useCallback, useRef } from "react";
import { applyAiStreamEvent, assertAiStreamComplete, parseAiSseLine } from "./ai-stream";

const apiClient = {
  async generateCode(
    prompt,
    initialCode,
    endpoint,
    language,
    id,
    usedUiFrameworks,
    images,
    signal
  ) {
    const response = await fetch(baseUrl + endpoint, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        initialCode,
        language,
        id,
        usedUiFrameworks,
        images,
      }),
      signal,
    });

    if (!response.ok) {
      if (response.status === 402) {
        throw new Error("You don't have enough AI credits to generate code.");
      }
      throw new Error("AI generation request failed.");
    }

    return response;
  },
};

export function useAI() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [completion, setCompletion] = useState("");
  const fullResponseRef = useRef("");
  const abortControllerRef = useRef(null);

  const processStreamResponse = async (response, onResponseUpdate) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let streamState = { done: false, response: "" };

    const updateResponse = (newContent) => {
      fullResponseRef.current += newContent;
      onResponseUpdate(fullResponseRef.current);
      setCompletion(fullResponseRef.current);
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let dataIndex;
        while ((dataIndex = buffer.indexOf("data: ")) !== -1) {
          const endIndex = buffer.indexOf("\n", dataIndex);
          if (endIndex === -1) break;

          const line = buffer.slice(dataIndex, endIndex);
          buffer = buffer.slice(endIndex + 1);

          let event;
          try {
            event = parseAiSseLine(line);
          } catch (error) {
            throw new Error("Invalid AI stream response", { cause: error });
          }
          streamState = applyAiStreamEvent(streamState, event);
          if (streamState.response) updateResponse(streamState.response);
        }
      }
    } finally {
      if (buffer.trim()) {
        const remainingData = buffer.split("\n");
        for (const line of remainingData) {
          if (line.startsWith("data: ")) {
            const event = parseAiSseLine(line);
            streamState = applyAiStreamEvent(streamState, event);
            if (streamState.response) updateResponse(streamState.response);
          }
        }
      }
    }
    assertAiStreamComplete(streamState);
  };

  const generateCode = useCallback(
    async (
      prompt,
      initialCode,
      onResponseUpdate,
      endpoint,
      language,
      id,
      usedUiFrameworks,
      images
    ) => {
      if (!prompt.trim()) {
        throw new Error("Prompt cannot be empty");
      }

      setIsGenerating(true);
      onResponseUpdate("");
      fullResponseRef.current = "";

      abortControllerRef.current = new AbortController();

      try {
        const response = await apiClient.generateCode(
          prompt,
          initialCode,
          endpoint,
          language,
          id,
          usedUiFrameworks,
          images,
          abortControllerRef.current.signal
        );
        await processStreamResponse(response, onResponseUpdate);
        return fullResponseRef.current;
      } catch (error) {
        if (error.name === "AbortError") {
          console.warn("Generation aborted");
        } else {
          console.error("Error generating:", error);
          throw error;
        }
      } finally {
        setIsGenerating(false);
        onResponseUpdate(fullResponseRef.current);
      }
    },
    []
  );

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  }, []);

  return {
    isGenerating,
    generateCode,
    completion,
    stop,
  };
}
