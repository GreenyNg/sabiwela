import type { ZodType } from "zod";

export type AIErrorCode = "not_configured" | "rate_limited" | "bad_output" | "provider_error";

export class AIError extends Error {
  code: AIErrorCode;
  constructor(code: AIErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export interface LLMProvider {
  id: string;
  generateJson<T>(args: {
    system: string;
    prompt: string;
    schema: ZodType<T>;
    signal?: AbortSignal;
  }): Promise<T>;
}
