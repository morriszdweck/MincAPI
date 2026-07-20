import React, { useState } from "react";
import { Terminal, Copy, Check, FileText, Code2, ArrowRight } from "lucide-react";

export default function DocSection() {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"get" | "sdks">("get");
  const [sdkLang, setSdkLang] = useState<"js" | "python" | "go">("js");

  const baseUrl = "https://mincapi.ai.studio";

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const getCurlGet = `curl -X GET "${baseUrl}/api/v1/generate?model=auto&prompt=Explain+photosynthesis+briefly"`;

  const jsCode = `// Standard fetch example (Privacy-First GET Endpoint)
async function generateText() {
  const prompt = encodeURIComponent('Explain the theory of relativity in one sentence.');
  const url = \`${baseUrl}/api/v1/generate?model=auto&prompt=\${prompt}\`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  console.log("Response:", data.response);
  if (data.reasoning) {
    console.log("Thought Process:", data.reasoning);
  }
}

generateText();`;

  const pythonCode = `import requests

url = "${baseUrl}/api/v1/generate"
params = {
    "model": "high-reasoning",
    "prompt": "Explain the theory of relativity in one sentence."
}

response = requests.get(url, params=params)
data = response.json()
print("Response:", data["response"])
if "reasoning" in data and data["reasoning"]:
    print("Thought Process:", data["reasoning"])`;

  const goCode = `package main

import (
\t"encoding/json"
\t"fmt"
\t"io"
\t"net/http"
\t"net/url"
)

func main() {
\tapiURL := "${baseUrl}/api/v1/generate"
\t
\tparams := url.Values{}
\tparams.Add("model", "auto")
\tparams.Add("prompt", "Explain the theory of relativity in one sentence.")
\t
\tresp, err := http.Get(apiURL + "?" + params.Encode())
\tif err != nil {
\t\tpanic(err)
\t}
\tdefer resp.Body.Close()
\t
\tbody, _ := io.ReadAll(resp.Body)
\tfmt.Println(string(body))
}`;

  const jsonResponse = `{
  "status": "success",
  "api": "MincAPI",
  "requested_model": "auto",
  "model": "instant",
  "prompt": "Explain photosynthesis briefly",
  "response": "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods from carbon dioxide and water. Photosynthesis in plants generally involves the green pigment chlorophyll and generates oxygen as a byproduct.",
  "reasoning": null,
  "usage": {
    "prompt_tokens": 6,
    "completion_tokens": 40,
    "total_tokens": 46
  },
  "latency_ms": 142,
  "timestamp": "2026-07-19T07:20:00.000Z"
}`;

  const jsonResponseReasoning = `{
  "status": "success",
  "api": "MincAPI",
  "requested_model": "high-reasoning",
  "model": "high-reasoning",
  "prompt": "Why is the sky blue?",
  "response": "The sky is blue because of Rayleigh scattering. Sunlight reaches Earth's atmosphere and is scattered in all directions by all the gases and particles in the air. Blue light is scattered more than the other colors because it travels as shorter, smaller waves.",
  "reasoning": "1. Analyzing sky color physics.\\n2. Identifying gas molecular scattering mechanics (Rayleigh scattering).\\n3. Structuring clear synthesis.",
  "usage": {
    "prompt_tokens": 8,
    "completion_tokens": 55,
    "total_tokens": 63
  },
  "latency_ms": 1284,
  "timestamp": "2026-07-19T07:20:00.000Z"
}`;

  return (
    <div className="bg-[#040814]/40 border border-white/5 backdrop-blur-md rounded-3xl p-6 lg:p-8 space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
          <Terminal className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">API Reference & Integration</h2>
          <p className="text-xs text-slate-400">Integrate MincAPI into your software stack instantly. No keys, no registrations.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-1">
        <button
          onClick={() => setActiveTab("get")}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
            activeTab === "get" ? "border-blue-500 text-white" : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          GET Endpoint
        </button>
        <button
          onClick={() => setActiveTab("sdks")}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
            activeTab === "sdks" ? "border-blue-500 text-white" : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Code Sandbox & SDKs
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Parameters or Selector */}
        <div className="lg:col-span-5 space-y-6">
          {activeTab !== "sdks" ? (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Query Parameters</h3>
              <div className="overflow-hidden border border-white/5 rounded-xl bg-black/20 divide-y divide-white/5">
                <div className="p-3 flex items-start gap-3">
                  <div className="font-mono text-xs font-bold text-emerald-400">prompt</div>
                  <div className="text-xs text-slate-300">
                    <span className="text-[10px] bg-red-500/20 text-red-300 font-bold px-1.5 py-0.5 rounded mr-1">Required</span>
                    The raw string text input to generate a response for.
                  </div>
                </div>
                <div className="p-3 flex items-start gap-3">
                  <div className="font-mono text-xs font-bold text-blue-400">model</div>
                  <div className="text-xs text-slate-300">
                    <span className="text-[10px] bg-white/10 text-slate-400 font-bold px-1.5 py-0.5 rounded mr-1">Optional</span>
                    Desired lane: <span className="text-white font-semibold">auto</span> (default), <span className="text-white font-semibold">instant</span>, <span className="text-white font-semibold">low-reasoning</span>, <span className="text-white font-semibold">high-reasoning</span>, or <span className="text-white font-semibold">agent-swarm</span>.
                  </div>
                </div>
                <div className="p-3 flex items-start gap-3">
                  <div className="font-mono text-xs font-bold text-amber-400">output</div>
                  <div className="text-xs text-slate-300">
                    <span className="text-[10px] bg-white/10 text-slate-400 font-bold px-1.5 py-0.5 rounded mr-1">Optional</span>
                    Response format style: <span className="text-white font-semibold">json</span> (default JSON payload envelope) or <span className="text-white font-semibold">text</span> (returns only the raw generated response string as plain text).
                  </div>
                </div>
                <div className="p-3 flex items-start gap-3">
                  <div className="font-mono text-xs font-bold text-purple-400">system</div>
                  <div className="text-xs text-slate-300">
                    <span className="text-[10px] bg-white/10 text-slate-400 font-bold px-1.5 py-0.5 rounded mr-1">Optional</span>
                    Instructions to customize behavior or tone of the engine.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Select Platform</h3>
              <div className="grid grid-cols-3 gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setSdkLang("js")}
                  className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    sdkLang === "js" ? "bg-white text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                  }`}
                >
                  NodeJS
                </button>
                <button
                  onClick={() => setSdkLang("python")}
                  className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    sdkLang === "python" ? "bg-white text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Python
                </button>
                <button
                  onClick={() => setSdkLang("go")}
                  className={`py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                    sdkLang === "go" ? "bg-white text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                  }`}
                >
                  GoLang
                </button>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect your backend or server-side workflows in minutes. Our models return clean standard JSON outputs with strict CORS policies.
              </p>
            </div>
          )}

          {/* Response Payload Spec Card */}
          <div className="bg-[#0a0f1d] border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Response Payload Specs</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold font-mono">JSON</span>
            </div>
            <div className="text-xs text-slate-300 space-y-1 font-mono">
              <div><span className="text-white">"status"</span>: "success" | "error"</div>
              <div><span className="text-white">"api"</span>: "MincAPI"</div>
              <div><span className="text-white">"response"</span>: string (Output)</div>
              <div><span className="text-white">"reasoning"</span>: string | null (Thoughts)</div>
              <div><span className="text-white">"latency_ms"</span>: number</div>
            </div>
          </div>
        </div>

        {/* Right Side: Code View */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Code2 className="h-4 w-4 text-blue-400" />
              Source Execution Snippet
            </span>
            <button
              onClick={() => {
                const textToCopy =
                  activeTab === "get"
                    ? getCurlGet
                    : sdkLang === "js"
                    ? jsCode
                    : sdkLang === "python"
                    ? pythonCode
                    : goCode;
                handleCopy(textToCopy, activeTab);
              }}
              className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg cursor-pointer"
            >
              {copiedText === activeTab ? <Check className="h-3.5 w-3.5 text-emerald-400 animate-pulse" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedText === activeTab ? "Copied!" : "Copy Code"}</span>
            </button>
          </div>

          <div className="bg-[#020617] text-slate-200 rounded-xl p-4 font-mono text-xs overflow-x-auto leading-relaxed border border-white/5 max-h-[250px]">
            {activeTab === "get" ? (
              <span className="text-blue-300 break-all">{getCurlGet}</span>
            ) : sdkLang === "js" ? (
              <pre className="text-slate-300 whitespace-pre">{jsCode}</pre>
            ) : sdkLang === "python" ? (
              <pre className="text-slate-300 whitespace-pre">{pythonCode}</pre>
            ) : (
              <pre className="text-slate-300 whitespace-pre">{goCode}</pre>
            )}
          </div>

          {/* Expected Response structure display */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block">Expected Payload Response</span>
            <div className="bg-[#020617] text-slate-300 rounded-xl p-4 font-mono text-xs overflow-x-auto max-h-[160px] border border-white/5">
              <pre className="whitespace-pre">
                {activeTab === "sdks" && sdkLang === "python" ? jsonResponseReasoning : jsonResponse}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
