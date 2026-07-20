export interface ApiLog {
  id: string;
  timestamp: string;
  apiKey: string;
  model: "auto" | "instant" | "low-reasoning" | "high-reasoning";
  routedModel?: "instant" | "low-reasoning" | "high-reasoning";
  prompt: string;
  response: string;
  reasoning?: string | null;
  latencyMs: number;
  tokens: number;
  status: "success" | "error";
  method: "GET" | "POST";
}

export interface ApiStats {
  totalRequests: number;
  successRequests: number;
  errorRequests: number;
  totalTokens: number;
  avgLatencyMs: number;
  modelStats?: {
    auto: number;
    instant: number;
    "low-reasoning": number;
    "high-reasoning": number;
  };
}
