import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, 
  RotateCcw, 
  Copy, 
  Check, 
  Code, 
  Sparkles, 
  Sliders, 
  AlertCircle, 
  Cpu, 
  Send, 
  Trash2, 
  Download, 
  Settings, 
  User,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
  Zap,
  Activity,
  Columns,
  Sparkle,
  Brain
} from "lucide-react";

interface PlaygroundProps {
  onSuccess: () => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "model" | "system";
  text: string;
  timestamp: string;
  latencyMs?: number;
  tokens?: number;
  modelUsed?: string;
  requestedModel?: string;
  reasoning?: string | null;
  status?: "success" | "error";
}

const PRESETS = [
  {
    name: "General Query",
    icon: Sparkles,
    system: "You are a direct, helpful, and professional AI assistant.",
    prompt: "Briefly explain why quantum computing is faster than classical computing using a physical coin analogy."
  },
  {
    name: "Software Architecture",
    icon: Code,
    system: "You are a minimalist lead software architect. Answer with clean TypeScript code and concise architectural design patterns.",
    prompt: "Design a clean, modern type-safe reactive state manager in TypeScript."
  },
  {
    name: "Creative Brainstorming",
    icon: Info,
    system: "You are a creative product designer and developer copywriter.",
    prompt: "Give me 5 unique, highly memorable name proposals for a next-generation local AI model manager app."
  }
];

const THEMES = [
  {
    id: "slate",
    name: "Cosmic Slate",
    bgClass: "bg-slate-950 text-slate-100",
    cardClass: "bg-white/[0.03] border-white/10",
    accentClass: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    buttonClass: "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-blue-500/20",
    glowClass: "from-blue-600/10 to-indigo-600/5",
    color: "from-blue-400 to-indigo-500"
  },
  {
    id: "amber",
    name: "Matrix Amber",
    bgClass: "bg-neutral-950 text-amber-200",
    cardClass: "bg-amber-950/10 border-amber-500/20",
    accentClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    buttonClass: "bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold shadow-amber-500/20",
    glowClass: "from-amber-500/5 to-yellow-600/5",
    color: "from-amber-400 to-yellow-500"
  },
  {
    id: "frost",
    name: "Nordic Frost",
    bgClass: "bg-zinc-950 text-zinc-100",
    cardClass: "bg-sky-950/10 border-sky-500/20",
    accentClass: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    buttonClass: "bg-sky-400 hover:bg-sky-500 text-zinc-950 font-bold shadow-sky-400/20",
    glowClass: "from-sky-500/5 to-teal-500/5",
    color: "from-sky-400 to-teal-500"
  },
  {
    id: "neon",
    name: "Cyberpunk Neon",
    bgClass: "bg-slate-950 text-pink-100",
    cardClass: "bg-fuchsia-950/10 border-fuchsia-500/20",
    accentClass: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30",
    buttonClass: "bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600 text-white font-bold shadow-fuchsia-500/20",
    glowClass: "from-fuchsia-500/5 to-purple-600/5",
    color: "from-fuchsia-400 to-pink-500"
  }
];

export default function Playground({ onSuccess }: PlaygroundProps) {
  // Session Metrics & Configurations
  const [activeTheme, setActiveTheme] = useState<"slate" | "amber" | "frost" | "neon">("slate");
  const [model, setModel] = useState<"auto" | "instant" | "low-reasoning" | "high-reasoning">("auto");
  const [system, setSystem] = useState("");
  const [input, setInput] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Compare Mode State
  const [compareMode, setCompareMode] = useState(false);
  const [compareModelA, setCompareModelA] = useState<"auto" | "instant" | "low-reasoning" | "high-reasoning">("instant");
  const [compareModelB, setCompareModelB] = useState<"auto" | "instant" | "low-reasoning" | "high-reasoning">("high-reasoning");

  // Chat Sessions
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-main",
      sender: "model",
      text: "Welcome to MincAPI Studio! I am your real-time AI developer sandbox. Query any model, toggle premium color themes, or test dual models simultaneously in Compare Mode.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      requestedModel: "auto",
      modelUsed: "auto"
    }
  ]);

  // Parallel chats for Compare mode
  const [compareMessagesA, setCompareMessagesA] = useState<ChatMessage[]>([]);
  const [compareMessagesB, setCompareMessagesB] = useState<ChatMessage[]>([]);

  // Telemetry
  const [loading, setLoading] = useState(false);
  const [sessionQueries, setSessionQueries] = useState(0);
  const [sessionTokens, setSessionTokens] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Expanded thought accordions map
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatEndRefA = useRef<HTMLDivElement>(null);
  const chatEndRefB = useRef<HTMLDivElement>(null);

  const selectedThemeObj = THEMES.find(t => t.id === activeTheme) || THEMES[0];

  useEffect(() => {
    if (compareMode) {
      chatEndRefA.current?.scrollIntoView({ behavior: "smooth" });
      chatEndRefB.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, compareMessagesA, compareMessagesB, loading, compareMode]);

  const toggleThought = (msgId: string) => {
    setExpandedThoughts(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || input;
    if (!promptToSend.trim() || loading) return;

    if (!customPrompt) setInput("");

    setLoading(true);

    if (compareMode) {
      // -------------------------------------------------------------
      // Compare Mode Logic: Execute two API calls in parallel
      // -------------------------------------------------------------
      const userMsgId = Math.random().toString(36).substring(7);
      const userMsg: ChatMessage = {
        id: userMsgId,
        sender: "user",
        text: promptToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setCompareMessagesA(prev => [...prev, userMsg]);
      setCompareMessagesB(prev => [...prev, userMsg]);

      try {
        // Run parallel queries
        const [resA, resB] = await Promise.allSettled([
          fetchApi(promptToSend, compareModelA),
          fetchApi(promptToSend, compareModelB)
        ]);

        // Process Response A
        if (resA.status === "fulfilled") {
          const dataA = resA.value;
          setCompareMessagesA(prev => [
            ...prev,
            {
              id: Math.random().toString(36).substring(7),
              sender: "model",
              text: dataA.response || "",
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              latencyMs: dataA.latency_ms,
              tokens: dataA.usage?.total_tokens || 0,
              requestedModel: compareModelA,
              modelUsed: dataA.model,
              reasoning: dataA.reasoning,
              status: "success"
            }
          ]);
          setSessionTokens(t => t + (dataA.usage?.total_tokens || 0));
        } else {
          setCompareMessagesA(prev => [
            ...prev,
            {
              id: Math.random().toString(36).substring(7),
              sender: "model",
              text: `Error: ${resA.reason || "Failed to execute Column A Model"}`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              status: "error"
            }
          ]);
        }

        // Process Response B
        if (resB.status === "fulfilled") {
          const dataB = resB.value;
          setCompareMessagesB(prev => [
            ...prev,
            {
              id: Math.random().toString(36).substring(7),
              sender: "model",
              text: dataB.response || "",
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              latencyMs: dataB.latency_ms,
              tokens: dataB.usage?.total_tokens || 0,
              requestedModel: compareModelB,
              modelUsed: dataB.model,
              reasoning: dataB.reasoning,
              status: "success"
            }
          ]);
          setSessionTokens(t => t + (dataB.usage?.total_tokens || 0));
        } else {
          setCompareMessagesB(prev => [
            ...prev,
            {
              id: Math.random().toString(36).substring(7),
              sender: "model",
              text: `Error: ${resB.reason || "Failed to execute Column B Model"}`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              status: "error"
            }
          ]);
        }

        setSessionQueries(q => q + 2);
        onSuccess();
      } catch (compareErr) {
        console.error(compareErr);
      } finally {
        setLoading(false);
      }

    } else {
      // -------------------------------------------------------------
      // Single Model Sandbox Mode Logic
      // -------------------------------------------------------------
      const userMsgId = Math.random().toString(36).substring(7);
      const userMsg: ChatMessage = {
        id: userMsgId,
        sender: "user",
        text: promptToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages(prev => [...prev, userMsg]);

      try {
        const data = await fetchApi(promptToSend, model);
        
        const modelMsg: ChatMessage = {
          id: Math.random().toString(36).substring(7),
          sender: "model",
          text: data.response || "",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          latencyMs: data.latency_ms,
          tokens: data.usage?.total_tokens || 0,
          requestedModel: model,
          modelUsed: data.model,
          reasoning: data.reasoning,
          status: "success"
        };

        setMessages(prev => [...prev, modelMsg]);
        setSessionQueries(q => q + 1);
        setSessionTokens(t => t + (data.usage?.total_tokens || 0));
        onSuccess();
      } catch (err: any) {
        console.error(err);
        setMessages(prev => [
          ...prev,
          {
            id: Math.random().toString(36).substring(7),
            sender: "model",
            text: `Error: ${err.message || "Failed to contact local MincAPI server."}`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: "error"
          }
        ]);
      } finally {
        setLoading(false);
      }
    }
  };

  const fetchApi = async (promptText: string, modelTarget: string) => {
    const params = new URLSearchParams();
    params.append("prompt", promptText);
    params.append("model", modelTarget);
    if (system.trim()) params.append("system", system);

    const res = await fetch(`/api/v1/generate?${params.toString()}`);
    const data = await res.json();
    if (!res.ok || data.status === "error") {
      throw new Error(data.message || "Server responded with an error payload.");
    }
    return data;
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setSystem(preset.system);
    setInput(preset.prompt);
  };

  const clearChat = () => {
    if (compareMode) {
      setCompareMessagesA([]);
      setCompareMessagesB([]);
    } else {
      setMessages([
        {
          id: "welcome-reset",
          sender: "model",
          text: "MincAPI Studio chat thread has been completely refreshed. You are now communicating on a clean memory context.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          requestedModel: "auto",
          modelUsed: "auto"
        }
      ]);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={`border border-white/10 rounded-3xl overflow-hidden h-full flex flex-col shadow-2xl relative transition-all duration-300 ${selectedThemeObj.bgClass}`}>
      {/* Decorative localized gradient blur background based on active theme */}
      <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-b ${selectedThemeObj.glowClass} pointer-events-none opacity-50 z-0`}></div>

      {/* Main Unified Navigation + Model Header Bar */}
      <div className="relative z-20 px-4 md:px-5 py-3 bg-white/[0.02] border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        
        {/* Left: Brand logo + ChatGPT-style Model Selector Dropdown */}
        <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-400 to-indigo-600 shadow-md shadow-blue-500/15 rounded-xl flex items-center justify-center text-white font-mono font-black text-xs">
              M
            </div>
            <span className="font-bold text-white tracking-tight text-sm hidden xs:inline">MincAPI</span>
          </div>

          <div className="h-4 w-px bg-white/10 hidden sm:block"></div>

          {/* Clean dropdown at the top */}
          {!compareMode ? (
            <div className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-2.5 py-1.5 transition">
              <Brain className="h-3.5 w-3.5 text-blue-400" />
              <select
                value={model}
                onChange={(e: any) => setModel(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-200 hover:text-white outline-hidden cursor-pointer animate-none"
              >
                <option value="auto">Minc Auto (Default)</option>
                <option value="instant">Minc Instant</option>
                <option value="low-reasoning">Low Reasoning</option>
                <option value="high-reasoning">High Reasoning</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-blue-500/15 border border-blue-500/30 text-blue-300 rounded-xl px-2.5 py-1.5 text-xs font-bold">
              <Columns className="h-3.5 w-3.5" />
              <span>Dual Lane Compare</span>
            </div>
          )}
        </div>

        {/* Right: Actions like Compare, Settings Drawer, and Clear */}
        <div className="flex items-center justify-center sm:justify-end gap-1.5">
          {/* Compare switcher */}
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl border transition cursor-pointer ${
              compareMode
                ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
            }`}
            title="Toggle comparative model testing side-by-side"
          >
            <Columns className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Compare</span>
          </button>

          {/* Settings panel toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl border transition cursor-pointer ${
              showSettings
                ? "bg-white/15 text-white border-white/30"
                : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
            }`}
            title="Toggle settings drawer"
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Settings</span>
          </button>

          {/* Clean session */}
          <button
            onClick={clearChat}
            className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
            title="Clear current thread"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Primary Workspace Layout */}
      <div className="relative z-10 flex-1 flex flex-col min-h-0 overflow-hidden">
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col justify-between min-h-0 bg-black/15 relative overflow-hidden">
          
          {compareMode ? (
            // =========================================================
            // COMPARE MODE: Side-by-Side Dual Chats
            // =========================================================
            <div className="flex-1 min-h-0 grid grid-cols-2 divide-x divide-white/5 overflow-hidden">
              
              {/* Column A */}
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-4 py-2 bg-white/[0.01] border-b border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LANE A MODEL</span>
                  <select
                    value={compareModelA}
                    onChange={(e: any) => setCompareModelA(e.target.value)}
                    className="bg-black/60 text-xs font-bold text-white border border-white/10 rounded-lg px-2 py-1 outline-hidden"
                  >
                    <option value="auto">Minc Auto (Default)</option>
                    <option value="instant">Minc Instant</option>
                    <option value="low-reasoning">Low Reasoning</option>
                    <option value="high-reasoning">High Reasoning</option>
                  </select>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                  {compareMessagesA.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                      <Zap className="h-8 w-8 text-slate-600 mb-2 animate-pulse" />
                      <p className="text-xs">Send a prompt below to see Side-by-Side outputs.</p>
                    </div>
                  ) : (
                    compareMessagesA.map((msg) => renderCompareBubble(msg, "a"))
                  )}
                  {loading && (
                    <div className="flex gap-2.5 items-center text-xs text-slate-500 font-mono animate-pulse pl-2">
                      <Cpu className="h-3.5 w-3.5 animate-spin text-blue-400" />
                      <span>Computing Lane A...</span>
                    </div>
                  )}
                  <div ref={chatEndRefA} />
                </div>
              </div>

              {/* Column B */}
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-4 py-2 bg-white/[0.01] border-b border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LANE B MODEL</span>
                  <select
                    value={compareModelB}
                    onChange={(e: any) => setCompareModelB(e.target.value)}
                    className="bg-black/60 text-xs font-bold text-white border border-white/10 rounded-lg px-2 py-1 outline-hidden"
                  >
                    <option value="auto">Minc Auto (Default)</option>
                    <option value="instant">Minc Instant</option>
                    <option value="low-reasoning">Low Reasoning</option>
                    <option value="high-reasoning">High Reasoning</option>
                  </select>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                  {compareMessagesB.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                      <Brain className="h-8 w-8 text-slate-600 mb-2 animate-pulse" />
                      <p className="text-xs">Query comparison resolves dynamically in parallel.</p>
                    </div>
                  ) : (
                    compareMessagesB.map((msg) => renderCompareBubble(msg, "b"))
                  )}
                  {loading && (
                    <div className="flex gap-2.5 items-center text-xs text-slate-500 font-mono animate-pulse pl-2">
                      <Cpu className="h-3.5 w-3.5 animate-spin text-purple-400" />
                      <span>Computing Lane B...</span>
                    </div>
                  )}
                  <div ref={chatEndRefB} />
                </div>
              </div>

            </div>
          ) : (
            // =========================================================
            // STANDARD SANDBOX CHAT MODE
            // =========================================================
            <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-5 scrollbar-thin">
              <div className="max-w-3xl w-full mx-auto flex flex-col space-y-5">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3.5 w-full ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                  >
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border ${
                      msg.sender === "user" 
                        ? "bg-blue-500/10 border-blue-500/20 text-blue-300" 
                        : msg.status === "error"
                          ? "bg-red-500/10 border-red-500/20 text-red-300"
                          : `${selectedThemeObj.accentClass}`
                    }`}>
                      {msg.sender === "user" ? <User className="h-4 w-4" /> : <Cpu className="h-4 w-4" />}
                    </div>

                    <div className="space-y-1.5 max-w-[85%]">
                      {/* Collapsible Thought trace block if it exists */}
                      {msg.sender === "model" && msg.reasoning && (
                        <div className="border border-white/5 bg-black/40 rounded-xl overflow-hidden text-xs max-w-xl">
                          <button
                            onClick={() => toggleThought(msg.id)}
                            className="w-full flex items-center justify-between p-3 text-slate-400 hover:text-white transition font-mono"
                          >
                            <span className="flex items-center gap-1.5">
                              <Brain className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                              <span>Step-by-step Reasoning Process</span>
                            </span>
                            {expandedThoughts[msg.id] ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>
                          {expandedThoughts[msg.id] && (
                            <div className="px-3.5 pb-3 pt-1 border-t border-white/5 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">
                              {msg.reasoning}
                            </div>
                          )}
                        </div>
                      )}

                      <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-white/[0.04] text-white border border-white/10 rounded-tr-none"
                          : msg.status === "error"
                            ? "bg-red-950/20 text-red-200 border border-red-500/20 rounded-tl-none"
                            : "bg-black/30 text-slate-200 border border-white/5 rounded-tl-none"
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>

                      <div className={`flex items-center gap-3 text-[10px] text-slate-500 px-1 font-mono ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                        <span>{msg.timestamp}</span>
                        {msg.latencyMs && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400 font-bold">{msg.latencyMs}ms</span>
                          </>
                        )}
                        {msg.tokens && (
                          <>
                            <span>•</span>
                            <span>{msg.tokens} tokens</span>
                          </>
                        )}
                        {msg.modelUsed && (
                          <>
                            <span>•</span>
                            <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[9px] text-slate-300 uppercase font-bold">
                              {msg.requestedModel === "auto" ? `Auto ➔ ${msg.modelUsed}` : msg.modelUsed}
                            </span>
                          </>
                        )}
                        <button
                          onClick={() => handleCopyText(msg.text, msg.id)}
                          className="hover:text-white transition cursor-pointer flex items-center gap-0.5 ml-1"
                          title="Copy text"
                        >
                          {copiedId === msg.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-3 mr-auto animate-pulse">
                    <div className={`h-8 w-8 rounded-xl ${selectedThemeObj.accentClass} flex items-center justify-center shrink-0`}>
                      <Cpu className="h-4 w-4 animate-spin" />
                    </div>
                    <div className="bg-black/20 text-slate-400 border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none text-xs flex items-center gap-2">
                      <span className="flex gap-1">
                        <span className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                      </span>
                      <span>Solving via MincAPI engine...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>
          )}

          {/* Quick presets strip (only if not compare mode to keep it cleaner) */}
          {!compareMode && (
            <div className="px-6 py-2 bg-black/30 border-t border-white/5 shrink-0">
              <div className="max-w-3xl w-full mx-auto flex flex-wrap items-center gap-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Load Preset:</span>
                {PRESETS.map((p, i) => {
                  const IconComp = p.icon;
                  return (
                    <button
                      key={i}
                      onClick={() => applyPreset(p)}
                      className="flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 text-[10px] px-2.5 py-1 rounded-full font-bold transition cursor-pointer"
                    >
                      <IconComp className="h-3 w-3 text-slate-400" />
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input block footer */}
          <div className="p-4 bg-black/40 border-t border-white/5 shrink-0">
            <div className="max-w-3xl w-full mx-auto flex gap-3 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={compareMode ? "Enter prompt to broadcast to both lanes..." : "Type query for Minc..."}
                rows={1}
                className="flex-1 text-sm border border-white/10 bg-black/50 rounded-xl px-4 py-3 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white resize-none font-sans placeholder-slate-500 max-h-24"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={loading || !input.trim()}
                className={`p-3 rounded-xl flex items-center justify-center shrink-0 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${selectedThemeObj.buttonClass}`}
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Sliding Settings Drawer - Fits perfectly on top of any layout without squishing the chat area */}
        <AnimatePresence>
          {showSettings && (
            <>
              {/* Dark backdrop overlay with exit transition */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSettings(false)}
                className="absolute inset-0 bg-black/60 z-30 cursor-pointer"
              />

              {/* Drawer Container */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-[#030612]/95 backdrop-blur-xl border-l border-white/10 z-40 p-6 flex flex-col justify-between overflow-y-auto h-full shadow-2xl"
              >
                <div className="space-y-6">
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-blue-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Sandbox Settings</span>
                    </div>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="text-slate-400 hover:text-white text-xs font-bold font-mono bg-white/5 hover:bg-white/10 border border-white/5 px-2 py-1 rounded-lg transition cursor-pointer"
                    >
                      Close
                    </button>
                  </div>

                  {/* Theme switcher */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2.5">Studio Theme Palette</span>
                    <div className="grid grid-cols-2 gap-2">
                      {THEMES.map((th) => (
                        <button
                          key={th.id}
                          onClick={() => setActiveTheme(th.id as any)}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
                            activeTheme === th.id
                              ? "border-white bg-white/10 text-white"
                              : "border-white/5 bg-black/20 text-slate-400 hover:text-white"
                          }`}
                        >
                          <span>{th.name}</span>
                          <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${th.color}`}></span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Non-Compare Model selector */}
                  {!compareMode && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Primary Processing Model</label>
                      <div className="space-y-2">
                        <button
                          onClick={() => setModel("auto")}
                          className={`w-full flex flex-col items-start p-3 border rounded-xl text-left transition cursor-pointer ${
                            model === "auto"
                              ? "border-white bg-white/10 ring-1 ring-white/10"
                              : "border-white/5 hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">AUTO</span>
                            <span className="text-xs font-bold text-white">Minc Auto (Default)</span>
                          </div>
                          <span className="text-[11px] text-slate-400 leading-normal">Smart auto-routing based on prompt complexity</span>
                        </button>

                        <button
                          onClick={() => setModel("instant")}
                          className={`w-full flex flex-col items-start p-3 border rounded-xl text-left transition cursor-pointer ${
                            model === "instant"
                              ? "border-white bg-white/10 ring-1 ring-white/10"
                              : "border-white/5 hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">INSTANT</span>
                            <span className="text-xs font-bold text-white">Minc Instant</span>
                          </div>
                          <span className="text-[11px] text-slate-400 leading-normal">Fast, lightweight text generation</span>
                        </button>

                        <button
                          onClick={() => setModel("low-reasoning")}
                          className={`w-full flex flex-col items-start p-3 border rounded-xl text-left transition cursor-pointer ${
                            model === "low-reasoning"
                              ? "border-white bg-white/10 ring-1 ring-white/10"
                              : "border-white/5 hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">BALANCED</span>
                            <span className="text-xs font-bold text-white">Minc Low Reasoning</span>
                          </div>
                          <span className="text-[11px] text-slate-400 leading-normal">Intermediate logic and reasoning depth</span>
                        </button>

                        <button
                          onClick={() => setModel("high-reasoning")}
                          className={`w-full flex flex-col items-start p-3 border rounded-xl text-left transition cursor-pointer ${
                            model === "high-reasoning"
                              ? "border-white bg-white/10 ring-1 ring-white/10"
                              : "border-white/5 hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">DEEP THINK</span>
                            <span className="text-xs font-bold text-white">Minc High Reasoning</span>
                          </div>
                          <span className="text-[11px] text-slate-400 leading-normal">Deep multi-step thought simulation</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Custom directive prompt instruction */}
                  <div>
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider cursor-pointer"
                    >
                      <Sliders className="h-3.5 w-3.5" />
                      <span>{showAdvanced ? "Hide" : "Add"} System directive</span>
                    </button>

                    {showAdvanced && (
                      <div className="mt-3 p-3 bg-black/30 border border-white/5 rounded-xl">
                        <textarea
                          value={system}
                          onChange={(e) => setSystem(e.target.value)}
                          placeholder="e.g. 'You are a poetic assistant.'"
                          rows={2}
                          className="w-full text-xs border border-white/10 rounded-lg p-2 bg-black/40 text-white placeholder-slate-600 focus:outline-hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Session Metrics Card */}
                <div className="pt-6 border-t border-white/5 space-y-2 shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Session Telemetry</span>
                  <div className="bg-black/30 border border-white/5 rounded-xl p-3 grid grid-cols-2 gap-2 text-center text-xs font-mono">
                    <div>
                      <span className="text-slate-500 text-[9px] block">Queries Run</span>
                      <span className="text-white font-bold">{sessionQueries}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[9px] block">Tokens Spent</span>
                      <span className="text-white font-bold">{sessionTokens}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </div>
  );

  // Helper renderer for comparative message bubble
  function renderCompareBubble(msg: ChatMessage, laneId: string) {
    return (
      <div
        key={msg.id}
        className={`flex gap-2 text-xs max-w-full ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
      >
        <div className={`p-2.5 rounded-xl leading-normal ${
          msg.sender === "user"
            ? "bg-white/[0.04] text-white rounded-tr-none border border-white/10"
            : msg.status === "error"
              ? "bg-red-950/20 text-red-200 rounded-tl-none border border-red-500/10"
              : "bg-black/40 text-slate-200 rounded-tl-none border border-white/5"
        }`}>
          {msg.sender === "model" && msg.reasoning && (
            <div className="mb-2 p-2 border border-white/5 bg-black/30 rounded-lg text-[10px]">
              <div className="font-bold text-amber-300 font-mono flex items-center gap-1 mb-1">
                <Brain className="h-3 w-3" />
                <span>Reasoning Process</span>
              </div>
              <div className="font-mono text-slate-400 whitespace-pre-wrap leading-tight">{msg.reasoning}</div>
            </div>
          )}
          <p className="whitespace-pre-wrap font-sans">{msg.text}</p>
          
          {msg.sender === "model" && msg.status === "success" && (
            <div className="mt-2 pt-1.5 border-t border-white/5 flex flex-wrap gap-2 text-[9px] text-slate-500 font-mono">
              <span className="text-emerald-400 font-bold">{msg.latencyMs}ms</span>
              <span>•</span>
              <span>{msg.tokens} tokens</span>
              <span>•</span>
              <span className="text-slate-300 uppercase font-bold">{msg.modelUsed}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
}
