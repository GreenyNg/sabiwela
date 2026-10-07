import { AIError, type LLMProvider } from "../types";

export function geminiProvider(apiKey: string, model: string): LLMProvider {
  return {
    id: "gemini",
    async generateJson({ system, prompt, schema, signal }) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
          }),
          signal,
        }
      );

      if (res.status === 429) throw new AIError("rate_limited", "The AI service is busy or out of free quota.");
      if (!res.ok) {
        let detail = "";
        try {
          const body = await res.json();
          detail = typeof body?.error?.message === "string" ? `: ${body.error.message.slice(0, 200)}` : "";
        } catch {}
        throw new AIError("provider_error", `Gemini returned status ${res.status}${detail}`);
      }

      const data = await res.json();
      const parts: { text?: string }[] = data?.candidates?.[0]?.content?.parts ?? [];
      const text = parts.map((p) => p.text ?? "").join("");
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        throw new AIError("bad_output", "The AI did not return valid JSON.");
      }
      const parsed = schema.safeParse(json);
      if (!parsed.success) throw new AIError("bad_output", "The AI response did not match the expected shape.");
      return parsed.data;
    },
  };
}
