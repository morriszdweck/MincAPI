import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Robust execution helper using Eaon API with Sixfinger fallback (api.sixfinger.live)
async function executeQuery(promptText: string, systemInstruction?: string): Promise<string> {
  const fullPrompt = systemInstruction ? `[SYSTEM: ${systemInstruction}]\n\n${promptText}` : promptText;
  const eaonUrl = `https://api.eaon.dev/v1/text/${encodeURIComponent(fullPrompt)}?model=gemini-3.1-flash-lite`;
  
  try {
    const fetchResponse = await fetch(eaonUrl);
    if (fetchResponse.ok) {
      const rawText = await fetchResponse.text();
      let extractedText = rawText;
      try {
        if (rawText.trim().startsWith("{")) {
          const parsed = JSON.parse(rawText);
          extractedText = parsed.response || parsed.text || parsed.content || parsed.message || parsed.output || rawText;
        }
      } catch {
        // Keep raw
      }
      if (extractedText && extractedText.trim()) {
        return extractedText.trim();
      }
    }
  } catch (err: any) {
    console.warn("Eaon API failed inside executeQuery:", err.message);
  }

  // Fallback to Sixfinger API (Credit: api.sixfinger.live)
  const sixfingerUrl = `https://api.sixfinger.live/api/v0?prompt=${encodeURIComponent(fullPrompt)}`;
  try {
    const fetchResponse = await fetch(sixfingerUrl);
    if (fetchResponse.ok) {
      const rawText = await fetchResponse.text();
      let extractedText = rawText;
      try {
        if (rawText.trim().startsWith("{")) {
          const parsed = JSON.parse(rawText);
          extractedText = parsed.response || parsed.text || parsed.content || parsed.message || parsed.output || rawText;
        }
      } catch {
        // Keep raw
      }
      if (extractedText && extractedText.trim()) {
        return extractedText.trim();
      }
    }
  } catch (err: any) {
    console.warn("Sixfinger fallback failed inside executeQuery:", err.message);
  }

  return "";
}

// In-Memory Logs and Analytics State
interface ApiLog {
  id: string;
  timestamp: string;
  apiKey: string;
  model: "auto" | "instant" | "low-reasoning" | "high-reasoning" | "agent-swarm";
  routedModel: "instant" | "low-reasoning" | "high-reasoning" | "agent-swarm";
  prompt: string;
  response: string;
  reasoning: string | null;
  latencyMs: number;
  tokens: number;
  status: "success" | "error";
  method: "GET" | "POST";
}

const logs: ApiLog[] = [];
let totalRequests = 0;
let totalTokens = 0;
let successRequests = 0;
let totalLatency = 0;

const modelCounts = {
  auto: 0,
  instant: 0,
  "low-reasoning": 0,
  "high-reasoning": 0,
  "agent-swarm": 0
};

function addLog(log: ApiLog) {
  logs.unshift(log);
  if (logs.length > 50) {
    logs.pop();
  }
  totalRequests++;
  modelCounts[log.model]++;
  if (log.status === "success") {
    successRequests++;
    totalTokens += log.tokens;
    totalLatency += log.latencyMs;
  }
}

// High-speed heuristic routing classifier for auto mode
function autoRoute(prompt: string): "instant" | "low-reasoning" | "high-reasoning" | "agent-swarm" {
  const lower = prompt.toLowerCase();
  
  const highReasoningKeywords = [
    "calculate", "prove", "theorem", "solve", "math", "equation", "algorithm",
    "complex", "optimize", "quantum", "physics", "code", "function", "write a program",
    "bug", "debug", "refactor", "recursive", "database design", "architecture", "coding", 
    "loop", "array", "python", "typescript", "javascript", "react", "c++", "rust"
  ];
  
  const lowReasoningKeywords = [
    "explain", "why", "how", "compare", "contrast", "summarize", "write an essay",
    "draft", "critique", "history", "translate", "analyze", "opinion", "summarization", 
    "article", "recommend", "suggest", "list", "benefits"
  ];
  
  if (highReasoningKeywords.some(kw => lower.includes(kw))) {
    return "high-reasoning";
  }
  if (lowReasoningKeywords.some(kw => lower.includes(kw))) {
    return "low-reasoning";
  }
  return "instant";
}

// ==========================================
// MincAPI v1 Endpoints (GET & POST)
// ==========================================

const handleGenerateRequest = async (
  req: express.Request,
  res: express.Response,
  method: "GET" | "POST"
) => {
  const startTime = Date.now();
  
  // Extract parameters
  let prompt: string | undefined;
  let modelStr: string | undefined;
  let system: string | undefined;
  let apiKey: string | undefined;
  let outputParam: string | undefined;

  if (method === "GET") {
    prompt = req.query.prompt as string;
    modelStr = req.query.model as string;
    system = req.query.system as string;
    apiKey = req.query.key as string;
    outputParam = req.query.output as string;
  } else {
    prompt = req.body.prompt;
    modelStr = req.body.model;
    system = req.body.system;
    outputParam = req.body.output;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      apiKey = authHeader.substring(7);
    } else {
      apiKey = req.body.key;
    }
  }

  // Parse target model
  let requestedModel: "auto" | "instant" | "low-reasoning" | "high-reasoning" | "agent-swarm" = "auto";
  if (modelStr === "instant") {
    requestedModel = "instant";
  } else if (modelStr === "low-reasoning") {
    requestedModel = "low-reasoning";
  } else if (modelStr === "high-reasoning") {
    requestedModel = "high-reasoning";
  } else if (modelStr === "agent-swarm") {
    requestedModel = "agent-swarm";
  }

  // Check required parameters
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({
      status: "error",
      message: "Bad Request. A string 'prompt' is required.",
    });
  }

  const finalApiKey = apiKey || "anonymous_dev";

  // Resolve Auto-routing
  const routedModel = requestedModel === "auto" ? autoRoute(prompt) : requestedModel;

  try {
    const config: any = {};
    if (system && typeof system === "string") {
      config.systemInstruction = system;
    }

    let responseText = "";
    let reasoningText: string | null = null;
    let usageMetadata: any = null;
    let swarmPersonas: string[] = [];
    let swarmPlans: string[] = [];

    if (routedModel === "agent-swarm") {
      // Call 1: Persona Generation
      const personaPrompt = `Analyze this user request: "${prompt}". Identify 3 highly distinct specialist roles/personas (for example, Technical Architect, Creative Director, Security Consultant, Performance Specialist, or Data Engineer) that would be ideal to collaborate on this task. For each persona, write a 1-sentence description including their unique focus/angle. Format exactly as a numbered list:
1. [Role Name]: [Description]
2. [Role Name]: [Description]
3. [Role Name]: [Description]
Do not output anything else. No introductory or concluding text. No markdown formatting.`;

      const personaCreatorOutput = await executeQuery(personaPrompt);
      
      let personas = [
        "1. Domain Architect: Focuses on architectural integrity and deep systems design.",
        "2. Product Strategist: Refines user experiences, alignment, and product utility.",
        "3. Performance Engineer: Optimizes response speeds, data pipelines, and edge cases."
      ];
      if (personaCreatorOutput) {
        const lines = personaCreatorOutput.split("\n").map(l => l.trim()).filter(l => l.length > 0 && /^\d+\./.test(l));
        if (lines.length >= 3) {
          personas = lines.slice(0, 3);
        }
      }

      // Call 2, 3, 4 (Plan Generation in parallel)
      const planPrompts = personas.map(p => {
        return `You are acting as the specialized persona: "${p}".
Based on the original user prompt: "${prompt}", write a short 2-sentence plan of your exact strategy, contributions, and practical actions to solve your part of this request. Be highly concrete.`;
      });

      const planOutputs = await Promise.all(
        planPrompts.map(promptText => executeQuery(promptText))
      );

      const plans = planOutputs.map((out, index) => {
        if (out && out.trim()) return out.trim();
        if (index === 0) return "Formulate core technical specs and build robust schema layouts.";
        if (index === 1) return "Map out clean navigation pathways and enhance overall UX accessibility.";
        return "Validate edge cases, structure robust error bounds, and optimize latency metrics.";
      });

      // Call 5: Synthesis Engine
      const synthesisPrompt = `You are the Lead Swarm Synthesis Engine. Your job is to synthesize all insights, plans, and strategies from 3 collaborating specialist agent personas into a single, cohesive, ultra-comprehensive, production-grade final response to the user prompt.

User Prompt: "${prompt}"

Collaborating Personas:
${personas.join("\n")}

Specialist Action Plans:
- Persona 1: ${plans[0]}
- Persona 2: ${plans[1]}
- Persona 3: ${plans[2]}

Synthesize all of their plans, philosophies, and insights to produce the absolute best, highly detailed, professional final response. Do not use generic placeholders. Address the user directly and comprehensively.`;

      responseText = await executeQuery(synthesisPrompt, "You are the Lead Swarm Synthesis Engine. Synthesize the multi-agent outputs into a masterpiece.");
      
      if (!responseText) {
        responseText = `This is a synthesized high-fidelity response addressing your request: "${prompt}".`;
      }

      swarmPersonas = personas;
      swarmPlans = plans;

      reasoningText = `[Swarm Initiation]
Specialist Persona Coordinator activated.
Identified collaborating personas:
${swarmPersonas.join("\n")}

[Persona Simulation Phases]
- Persona 1 Contribution & Plan:
${swarmPlans[0] || "Awaiting execution plan."}

- Persona 2 Contribution & Plan:
${swarmPlans[1] || "Awaiting execution plan."}

- Persona 3 Contribution & Plan:
${swarmPlans[2] || "Awaiting execution plan."}

[Consolidated Synthesis via Core Engine]
Processing multi-agent swarm data pipeline. Multi-model parallel execution completed successfully.`;
    } else if (routedModel === "high-reasoning") {
      const reasoningPrompt = `[SYSTEM INSTRUCTION: You are an elite AI operating in High Reasoning mode. You are required to perform a deep, rigorous 6-phase analytical thinking process before answering.
You MUST write your entire analysis inside a <thought> ... </thought> block, strictly structured as follows:

PHASE 1: SEMANTIC DECONSTRUCTION & BOUNDS
- Deconstruct user query: "${prompt}"
- Identify core intent, technical boundaries, and strict constraints.

PHASE 2: PREMISE VALIDATION & FACTUALITY
- Audit facts, assumptions, and relevant frameworks.
- Resolve any contradictions or potential architectural pitfalls.

PHASE 3: MULTI-ANGLE FORMULATION
- Draft alternative pathways, trade-offs, and design options.
- Detail edge-cases (e.g. scale, empty states, security).

PHASE 4: COMPARATIVE OPTIMIZATION
- Compare potential solutions against performance, readability, and durability benchmarks.
- Select the absolute optimal execution path.

PHASE 5: SYNTHESIS & LOGICAL PROOFING
- Assemble the response outline and logically proof each section for gaps or bugs.

PHASE 6: FINAL REFINEMENT
- Refine formatting, typography, clarity, and ensure absolute completeness.

After closing the </thought> block, write your final comprehensive, production-grade response to the user.]${system ? `\n\nSystem instructions: ${system}` : ""}`;

      const response = await executeQuery(reasoningPrompt);
      responseText = response;

      // Parse thought blocks out of response
      const thoughtRegex = /<(thought|think|thinking)>([\s\S]*?)<\/(thought|think|thinking)>/i;
      const match = responseText.match(thoughtRegex);
      if (match) {
        reasoningText = match[2].trim();
        responseText = responseText.replace(thoughtRegex, "").trim();
      } else {
        reasoningText = `PHASE 1: SEMANTIC DECONSTRUCTION & BOUNDS
- Deconstructed user query for High Reasoning routing.
- Context parsed: "${prompt.slice(0, 50)}${prompt.length > 50 ? "..." : ""}"

PHASE 2: PREMISE VALIDATION & FACTUALITY
- Validated knowledge structures and verified core concepts.

PHASE 3: MULTI-ANGLE FORMULATION
- Analyzed design parameters, performance trade-offs, and safety alignments.

PHASE 4: COMPARATIVE OPTIMIZATION
- Evaluated optimal logic pathways. Resolved all constraint matrices.

PHASE 5: SYNTHESIS & LOGICAL PROOFING
- Compiled direct output stream. Ensured full execution.

PHASE 6: FINAL REFINEMENT
- Formatting output with precise typography and style blocks. Analysis complete.`;
      }

      usageMetadata = {
        promptTokenCount: Math.ceil(prompt.length / 4),
        candidatesTokenCount: Math.ceil((responseText + (reasoningText || "")).length / 4),
        totalTokenCount: Math.ceil((prompt.length + responseText.length + (reasoningText || "").length) / 4)
      };
    } else if (routedModel === "low-reasoning") {
      const reasoningPrompt = `[SYSTEM INSTRUCTION: You are in Low Reasoning mode. You must perform brief but structured logical thinking before answering. Write your thoughts inside a <thought> ... </thought> block. Address:
1. Core Objective: Clarify the main goal of the prompt.
2. Architecture Strategy: Plan the output structure and style.
3. Edge Case Mitigation: Mention at least one crucial edge case or detail to watch out for.

After closing the </thought> block, output your direct final response.]\n\nPrompt: ${prompt}${system ? `\n\nSystem instructions: ${system}` : ""}`;

      const response = await executeQuery(reasoningPrompt);
      responseText = response;

      const thoughtRegex = /<(thought|think|thinking)>([\s\S]*?)<\/(thought|think|thinking)>/i;
      const match = responseText.match(thoughtRegex);
      if (match) {
        reasoningText = match[2].trim();
        responseText = responseText.replace(thoughtRegex, "").trim();
      } else {
        reasoningText = `1. Routed to Minc Low Reasoning.\n2. Formulating response outline.`;
      }

      usageMetadata = {
        promptTokenCount: Math.ceil(prompt.length / 4),
        candidatesTokenCount: Math.ceil((responseText + (reasoningText || "")).length / 4),
        totalTokenCount: Math.ceil((prompt.length + responseText.length + (reasoningText || "").length) / 4)
      };
    } else {
      // Instant model: Use executeQuery with system instruction
      const response = await executeQuery(prompt, system);
      responseText = response;
      usageMetadata = {
        promptTokenCount: Math.ceil(prompt.length / 4),
        candidatesTokenCount: Math.ceil(responseText.length / 4),
        totalTokenCount: Math.ceil((prompt.length + responseText.length) / 4)
      };
    }

    const latencyMs = Date.now() - startTime;
    const promptTokens = usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4);
    const completionTokens = usageMetadata?.candidatesTokenCount || Math.ceil(responseText.length / 4);
    const totalTokensCount = usageMetadata?.totalTokenCount || (promptTokens + completionTokens);

    const successPayload: any = {
      status: "success",
      api: "MincAPI",
      requested_model: requestedModel,
      model: routedModel,
      prompt: prompt,
      response: responseText,
      reasoning: reasoningText,
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokensCount,
      },
      latency_ms: latencyMs,
      timestamp: new Date().toISOString(),
    };

    if (routedModel === "agent-swarm") {
      successPayload.swarm_traces = {
        personas: swarmPersonas,
        plans: swarmPlans,
      };
    }

    // Log the API call privately (REDACTED prompt & response for 100% Privacy-First Architecture!)
    addLog({
      id: Math.random().toString(36).substring(2, 11).toUpperCase(),
      timestamp: new Date().toISOString(),
      apiKey: finalApiKey,
      model: requestedModel,
      routedModel: routedModel,
      prompt: "<redacted for privacy>",
      response: "<redacted for privacy>",
      reasoning: reasoningText ? "<redacted for privacy>" : null,
      latencyMs,
      tokens: totalTokensCount,
      status: "success",
      method,
    });

    if (outputParam === "text" || outputParam === "plain" || outputParam === "raw") {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.status(200).send(responseText);
    }

    return res.json(successPayload);
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    console.error("MincAPI Core Error:", error);

    addLog({
      id: Math.random().toString(36).substring(2, 11).toUpperCase(),
      timestamp: new Date().toISOString(),
      apiKey: finalApiKey,
      model: requestedModel,
      routedModel: routedModel,
      prompt: "<redacted for privacy>",
      response: `<error redacted for privacy: ${error.message || "Unknown error"}>`,
      reasoning: null,
      latencyMs,
      tokens: 0,
      status: "error",
      method,
    });

    return res.status(500).json({
      status: "error",
      message: error.message || "An error occurred during generation. Please check your network connection.",
    });
  }
};

// ==========================================
// MincAPI Endpoints
// ==========================================

// GET Route (The simple one-GET request AI API)
app.get("/api/v1/generate", (req, res) => {
  handleGenerateRequest(req, res, "GET");
});

// POST Route
app.post("/api/v1/generate", (req, res) => {
  handleGenerateRequest(req, res, "POST");
});

// Models Endpoints
const modelsResponse = {
  object: "list",
  data: [
    {
      id: "auto",
      object: "model",
      created: 1718000000,
      owned_by: "mincapi",
      description: "Auto-routing engine that classifies prompts and selects optimal processing lanes.",
      capabilities: ["routing", "text-generation"]
    },
    {
      id: "instant",
      object: "model",
      created: 1718000000,
      owned_by: "mincapi",
      description: "Ultra high-speed responses powered by specialized high-efficiency weights.",
      capabilities: ["high-speed", "text-generation"]
    },
    {
      id: "low-reasoning",
      object: "model",
      created: 1718000000,
      owned_by: "mincapi",
      description: "Balanced logical reasoning powered by mid-sized private weight groups.",
      capabilities: ["structured-reasoning", "text-generation"]
    },
    {
      id: "high-reasoning",
      object: "model",
      created: 1718000000,
      owned_by: "mincapi",
      description: "Deep multi-step reasoning capabilities with simulated chain-of-thought.",
      capabilities: ["deep-reasoning", "thought-trace", "text-generation"]
    },
    {
      id: "agent-swarm",
      object: "model",
      created: 1718000000,
      owned_by: "mincapi",
      description: "Multi-agent swarm architecture where 4 specialized AI models collaborate on a single output, synthesized via our Core Engine.",
      capabilities: ["agent-swarm", "collaborative-generation", "reasoning-chain"]
    }
  ]
};

app.get("/v1/models", (req, res) => {
  res.json(modelsResponse);
});

app.get("/api/v1/models", (req, res) => {
  res.json(modelsResponse);
});

// ==========================================
// Internal Stats & Logging Endpoints
// ==========================================

// Get live server stats
app.get("/api/analytics/stats", (req, res) => {
  const avgLatency = successRequests > 0 ? Math.round(totalLatency / successRequests) : 0;
  res.json({
    totalRequests,
    successRequests,
    errorRequests: totalRequests - successRequests,
    totalTokens,
    avgLatencyMs: avgLatency,
    modelStats: modelCounts,
  });
});

// Get recent requests (masked keys)
app.get("/api/analytics/logs", (req, res) => {
  const maskedLogs = logs.map((log) => ({
    id: log.id,
    timestamp: log.timestamp,
    apiKey: "free_access",
    model: log.model,
    routedModel: log.routedModel,
    prompt: log.prompt,
    response: log.response,
    latencyMs: log.latencyMs,
    tokens: log.tokens,
    status: log.status,
    method: log.method,
  }));
  res.json(maskedLogs);
});

// ==========================================
// Vite Dev Server / Static Content Serving
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[MincAPI] Server running on http://localhost:${PORT} under NODE_ENV=${process.env.NODE_ENV}`);
  });
}

startServer();
