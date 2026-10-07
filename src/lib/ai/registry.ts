import { AIError, type LLMProvider } from "./types";
import { geminiProvider } from "./providers/gemini";

/** The shared ("house") provider, configured by environment variables. */
export function getHouseLLM(): LLMProvider {
  const key = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  if (!key || !model) throw new AIError("not_configured", "AI is not configured on the server.");
  return geminiProvider(key, model);
}
