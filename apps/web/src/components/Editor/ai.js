import { baseUrl } from "@/constains";
import { useState, useCallback, useRef } from "react";

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
      throw new Error("You don't have enough ai credits to generate code.");
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

          try {
            const data = JSON.parse(line.slice(6));
            if (data.response) {
              updateResponse(data.response);
            } else if (data.error) {
              throw new Error(data.error);
            }
          } catch (e) {
            console.error("Error parsing SSE data:", e);
          }
        }
      }
    } finally {
      if (buffer.trim()) {
        const remainingData = buffer.split("\n");
        for (const line of remainingData) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.response) {
                updateResponse(data.response);
              }
            } catch (e) {
              console.error("Error parsing remaining SSE data:", e);
            }
          }
        }
      }
    }
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
