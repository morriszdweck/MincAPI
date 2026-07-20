import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Cpu, 
  Terminal, 
  Sparkles, 
  BookOpen, 
  Activity, 
  ChevronRight, 
  Github, 
  Blocks, 
  Flame, 
  Code, 
  Copy, 
  Check, 
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  HelpCircle as QuestionIcon
} from "lucide-react";
import DocSection from "./components/DocSection";
import StatsSection from "./components/StatsSection";
import { ApiStats } from "./types";

export default function App() {
  // Stats state
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // App Builder Generation State
  const [buildAppType, setBuildAppType] = useState("A real-time translation widget");
  const [buildTechStack, setBuildTechStack] = useState("React + Tailwind CSS");
  const [buildModel, setBuildModel] = useState("auto");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Fetch Analytics & Stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch statistics:", err);
    }
  }, []);

  // Combined Refresh Handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchStats();
    setIsRefreshing(false);
  }, [fetchStats]);

  // Initial Fetch & Long Polling setup (updates every 5 seconds)
  useEffect(() => {
    handleRefresh();
    const interval = setInterval(() => {
      fetchStats();
    }, 5000);
    return () => clearInterval(interval);
  }, [handleRefresh, fetchStats]);

  // Handle generating long agent copy-paste system prompt
  const generateAgentPrompt = () => {
    setIsGeneratingPrompt(true);
    setGeneratedPrompt("");
    
    setTimeout(() => {
      const baseUrl = "https://mincapi.ai.studio";
      
      let codeSnippet = "";
      if (buildTechStack.includes("React")) {
        codeSnippet = `// MincAPI Integration Configuration (Unrestricted GET request)
const BASE_URL = "${baseUrl}/api/v1/generate";

async function queryMincAPI(userPrompt: string) {
  try {
    const params = new URLSearchParams({
      prompt: userPrompt,
      model: "${buildModel}",
      system: "Format responses nicely."
    });
    
    const response = await fetch(\`\${BASE_URL}?\${params.toString()}\`);
    const data = await response.json();
    
    if (data.status === "success") {
      return {
        response: data.response,
        reasoning: data.reasoning || null,
        latency: data.latency_ms
      };
    } else {
      throw new Error(data.message || "Failed generation status");
    }
  } catch (error) {
    console.error("MincAPI integration failed:", error);
    throw error;
  }
}`;
      } else if (buildTechStack.includes("HTML5") || buildTechStack.includes("Vanilla")) {
        codeSnippet = `// MincAPI lightweight client-side fetch (GET request)
const endpoint = "${baseUrl}/api/v1/generate";

async function requestText(prompt) {
  const url = \`\${endpoint}?model=${buildModel}&prompt=\${encodeURIComponent(prompt)}\`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status === "success") {
    document.getElementById("output").innerText = data.response;
    if (data.reasoning) {
      document.getElementById("thoughts").innerText = data.reasoning;
    }
  }
}`;
      } else if (buildTechStack.includes("Next.js")) {
        codeSnippet = `// app/actions/generate.ts
'use server';

export async function fetchMinc(prompt: string) {
  const baseUrl = "${baseUrl}/api/v1/generate";
  const query = new URLSearchParams({
    prompt: prompt,
    model: "${buildModel}"
  });

  const res = await fetch(\`\${baseUrl}?\${query.toString()}\`, { cache: 'no-store' });
  if (!res.ok) throw new Error('MincAPI network error');
  return res.json();
}`;
      } else if (buildTechStack.includes("Flask")) {
        codeSnippet = `import requests

@app.route('/generate-stream')
def generate():
    prompt = request.args.get('prompt', '')
    url = "${baseUrl}/api/v1/generate"
    response = requests.get(url, params={"model": "${buildModel}", "prompt": prompt})
    return response.json()`;
      } else {
        codeSnippet = `const baseUrl = "${baseUrl}/api/v1/generate";
const params = new URLSearchParams({
  prompt: "Hello World",
  model: "${buildModel}"
});

fetch(\`\${baseUrl}?\${params.toString()}\`)
  .then(r => r.json())
  .then(data => console.log(data));`;
      }

      const template = `# System Instruction: AI Developer Workspace Config
Role: Senior AI Agent Architect & Full-Stack System Builder

## Objective:
Construct a complete, production-grade micro-application matching these specifications:
- **Application Goal**: ${buildAppType}
- **Tech Stack**: ${buildTechStack}
- **Processing Lane**: MincAPI GET Endpoint with model "${buildModel}"

---

## 1. MincAPI GET Integration Protocol
The application MUST query the AI API using **ONLY HTTP GET requests**. POST is excluded to leverage lightning-fast caching, zero headers overhead, and standard browser CORS configurations.

### Target GET Endpoint Structure:
\`\`\`
GET ${baseUrl}/api/v1/generate?model=${buildModel}&prompt={PROMPT_STRING}
\`\`\`

### Integration Boilerplate Code:
\`\`\`javascript
${codeSnippet}
\`\`\`

---

## 2. Core Technical Specifications:
1. **Model Lane**: Always supply \`model: "${buildModel}"\` inside the GET URL search parameters to route requests.
2. **CORS Safe Execution**: Connect client-side directly or proxy through server endpoints cleanly.
3. **Thought Traces Support**: MincAPI returns a \`reasoning\` field (string | null). When reasoning is present, render it inside an elegant collapsible console/trace container styled with an orange accent.
4. **Latency Statistics**: Extract \`latency_ms\` and response metadata from the payload and display them on the dashboard to provide real-time user-facing performance logs.
5. **State Management**: Preserve prompt history, favorites, or generated outputs inside client localStorage to persist user data between page reloads.

---

## 3. UI/UX Style Blueprint:
- Theme: Deep space / slate dark layout with rich glow borders and high-contrast texts.
- State loaders: Interactive spinners or custom loading cards while GET requests are in progress.
- Transitions: Fluid fade-in animations on new cards or message boxes.

Copy this system prompt, paste it directly into Cursor, Claude, or v0, and watch it build your fully operational micro-app!`;

      setGeneratedPrompt(template);
      setIsGeneratingPrompt(false);
    }, 450);
  };

  const copyPromptToClipboard = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="bg-[#02050e] text-slate-100 font-sans selection:bg-blue-500 selection:text-white relative overflow-hidden flex flex-col min-h-screen">
      {/* Glow shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] bg-blue-600/10 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none"></div>

      {/* Navigation Header */}
      <header className="relative z-40 border-b border-white/5 bg-[#02050e]/60 sticky top-0 backdrop-blur-xl shrink-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-gradient-to-br from-blue-400 to-indigo-600 shadow-lg shadow-blue-500/20 rounded-xl flex items-center justify-center text-white font-mono font-black text-sm">
              M
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white tracking-tight text-base font-sans">MincAPI</span>
                <span className="bg-emerald-500/15 text-emerald-300 text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border border-emerald-500/20 uppercase">PUBLIC ACCESS</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider">Instant & Smart AI GET Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="#docs-section"
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              <BookOpen className="h-4 w-4" />
              <span>API Reference</span>
            </a>
            
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/5 rounded-full">
              <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)] animate-pulse"></span>
              <span className="text-xs font-mono font-semibold text-white">ENGINE ONLINE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 w-full mx-auto max-w-7xl px-6 mt-8 flex-1 flex flex-col min-h-0 space-y-12">
      
        {/* Hero Section */}
        <section className="text-center md:text-left py-6 md:py-10 max-w-4xl">
          <div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
              A fully capable AI API,<br className="hidden md:block" /> served via <span className="underline decoration-wavy decoration-blue-500/60 underline-offset-4">one GET request</span>.
            </h1>
            <p className="mt-4 text-base md:text-lg text-slate-400 font-medium leading-relaxed max-w-3xl">
              Zero registration. Zero configuration. Call our endpoints with standard query parameters to retrieve text and logical reasoning traces instantly.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
              <a
                href="#docs-section"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold transition shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <BookOpen className="h-4 w-4 text-white" />
                <span>Read API Docs</span>
                <ChevronRight className="h-4 w-4" />
              </a>
              <a
                href="#builder-section"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white font-semibold transition cursor-pointer"
              >
                <Blocks className="h-4 w-4 text-indigo-400" />
                <span>Prompt Builder</span>
              </a>
            </div>
          </div>
        </section>

          {/* Analytics Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Active Engine Telemetry
              </h2>
            </div>
            <StatsSection stats={stats} />
          </section>

        {/* SPECIAL FEATURE: Minc AI Agent App Builder Section */}
        <section id="builder-section" className="bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-3xl p-6 lg:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
              <Blocks className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">AI Agent App Builder</h2>
              <p className="text-xs text-slate-400">Compile tailored workspace system prompts for Claude, Cursor, or GPT to build micro-apps powered by MincAPI</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form inputs */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">App Purpose</label>
                <input
                  type="text"
                  value={buildAppType}
                  onChange={(e) => setBuildAppType(e.target.value)}
                  placeholder="e.g. A real-time currency tracker"
                  className="w-full text-xs bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tech Stack</label>
                <select
                  value={buildTechStack}
                  onChange={(e) => setBuildTechStack(e.target.value)}
                  className="w-full text-xs bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white outline-hidden"
                >
                  <option value="React + Tailwind CSS">React + Tailwind CSS (Vite)</option>
                  <option value="HTML5 + Vanilla JS + CSS3">HTML5 + Vanilla JS (Single File)</option>
                  <option value="Next.js App Router + TypeScript">Next.js App Router + TypeScript</option>
                  <option value="Python Flask + HTMX">Python Flask + HTMX</option>
                  <option value="NodeJS Express CLI tool">NodeJS Express CLI tool</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Default Processing Lane</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBuildModel("auto")}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      buildModel === "auto" ? "bg-white text-slate-950 border-white" : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
                    }`}
                  >
                    Minc Auto
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuildModel("instant")}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      buildModel === "instant" ? "bg-white text-slate-950 border-white" : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
                    }`}
                  >
                    Instant Lane
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuildModel("low-reasoning")}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      buildModel === "low-reasoning" ? "bg-white text-slate-950 border-white" : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
                    }`}
                  >
                    Low Reasoning
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuildModel("high-reasoning")}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      buildModel === "high-reasoning" ? "bg-white text-slate-950 border-white" : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
                    }`}
                  >
                    High Reasoning
                  </button>
                  <button
                    type="button"
                    onClick={() => setBuildModel("agent-swarm")}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      buildModel === "agent-swarm" ? "bg-white text-slate-950 border-white" : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
                    }`}
                  >
                    Agent Swarm
                  </button>
                </div>
              </div>

              <button
                onClick={generateAgentPrompt}
                disabled={isGeneratingPrompt || !buildAppType.trim()}
                className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/10"
              >
                {isGeneratingPrompt ? (
                  <>
                    <Cpu className="h-4 w-4 animate-spin" />
                    <span>Compiling Build Prompt...</span>
                  </>
                ) : (
                  <>
                    <Flame className="h-4 w-4 text-amber-300" />
                    <span>Generate Agent System Prompt</span>
                  </>
                )}
              </button>
            </div>

            {/* Generated Prompt Code Block */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Compiled prompt output</span>
                {generatedPrompt && (
                  <button
                    onClick={copyPromptToClipboard}
                    className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg cursor-pointer"
                  >
                    {copiedPrompt ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedPrompt ? "Copied!" : "Copy System Prompt"}</span>
                  </button>
                )}
              </div>

              <div className="bg-black/40 border border-white/5 rounded-2xl p-4 min-h-[180px] max-h-[300px] overflow-y-auto font-mono text-xs leading-relaxed text-slate-300 whitespace-pre-wrap select-all">
                {isGeneratingPrompt ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2 text-slate-500">
                    <Cpu className="h-8 w-8 text-blue-500 animate-spin" />
                    <p>MincAPI is formatting, arranging boilerplate imports, and drafting your system architecture...</p>
                  </div>
                ) : generatedPrompt ? (
                  generatedPrompt
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                    <Code className="h-8 w-8 text-slate-700 mb-2" />
                    <p className="text-xs">Select options and click compile. You'll get a detailed workspace prompt that you can paste directly into Claude or Cursor to let it write the complete app code for you using MincAPI's clean GET API!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Documentation */}
        <section id="docs-section" className="pt-4">
          <DocSection />
        </section>

      </main>

      {/* Developer Footer */}
      <footer className="mt-20 border-t border-white/5 bg-[#02050e]/60 py-12 relative z-10 shrink-0">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white font-sans text-sm">MincAPI</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
          <div className="text-center md:text-right">
            <span>Powered by free private weights on high-speed servers. Special thanks to <a href="https://api.sixfinger.live" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition hover:underline">Sixfinger API (api.sixfinger.live)</a> for providing resilient fallback support.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
