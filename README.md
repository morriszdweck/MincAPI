# MincAPI

**Instant & Smart AI GET Engine** — A fully capable AI API served via a single GET request.

Zero registration. Zero configuration. Call any endpoint with standard query parameters to retrieve text and logical reasoning traces instantly.

---

## Features

- **One GET Request** — No complex POST bodies, no API keys, no auth headers. Just a URL with query params.
- **Multiple Processing Lanes** — Choose between `auto`, `instant`, `low-reasoning`, `high-reasoning`, and `agent-swarm` routing modes.
- **JSON or Plain Text Output** — Set `output=text` to get a raw response string, or use the default JSON envelope for structured data.
- **System Prompt Support** — Customize the engine's behavior or tone with the optional `system` parameter.
- **Reasoning Traces** — Some lanes return chain-of-thought reasoning alongside the response.
- **Zero Cost, Zero Signup** — Public access. No accounts, no tokens, no billing.

---

## Quick Start

```bash
curl -X GET "https://mincapi.ai.studio/api/v1/generate?model=auto&prompt=Explain+photosynthesis+briefly"
```

That's it. Paste that into any terminal, browser, or script and you'll get a JSON response back.

---

## API Reference

### Base URL

```
https://mincapi.ai.studio/api/v1/generate
```

### Query Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `prompt` | **Yes** | The raw string text input to generate a response for. |
| `model` | No | Processing lane: `auto` (default), `instant`, `low-reasoning`, `high-reasoning`, or `agent-swarm`. |
| `output` | No | Response format: `json` (default, returns a JSON envelope) or `text` (returns only the raw generated string). |
| `system` | No | System instructions to customize the engine's behavior or tone. |

### Processing Lanes

| Lane | Description |
|------|-------------|
| `auto` | Smart routing — the engine selects the best model for your request. |
| `instant` | Zero-latency responses for straightforward queries. |
| `low-reasoning` | Structured logic with light chain-of-thought. |
| `high-reasoning` | Deep thought synthesis for complex, multi-step problems. |
| `agent-swarm` | Multi-agent coordination for advanced tasks. |

### Response Format (JSON)

```json
{
  "status": "success",
  "api": "MincAPI",
  "requested_model": "auto",
  "model": "instant",
  "prompt": "Explain photosynthesis briefly",
  "response": "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize foods from carbon dioxide and water.",
  "reasoning": null,
  "usage": {
    "prompt_tokens": 6,
    "completion_tokens": 40,
    "total_tokens": 46
  },
  "latency_ms": 142,
  "timestamp": "2026-07-19T07:20:00.000Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | `string` | `"success"` or `"error"`. |
| `api` | `string` | Always `"MincAPI"`. |
| `requested_model` | `string` | The lane you requested. |
| `model` | `string` | The actual lane used (may differ when `auto` routes). |
| `prompt` | `string` | Echo of your input prompt. |
| `response` | `string` | The generated output. |
| `reasoning` | `string \| null` | Chain-of-thought trace, if available. |
| `usage` | `object` | Token counts: `prompt_tokens`, `completion_tokens`, `total_tokens`. |
| `latency_ms` | `number` | Server-side processing time in milliseconds. |
| `timestamp` | `string` | ISO 8601 timestamp of the response. |

### Plain Text Mode

Append `&output=text` to receive only the raw response string (no JSON wrapping):

```
https://mincapi.ai.studio/api/v1/generate?prompt=Hello&output=text
```

---

## Examples

### Simple Query

```bash
curl "https://mincapi.ai.studio/api/v1/generate?prompt=What+is+the+capital+of+France?"
```

### High-Reasoning Mode

```bash
curl "https://mincapi.ai.studio/api/v1/generate?model=high-reasoning&prompt=Solve+this+step+by+step:+If+a+train+travels+120km+in+2+hours,+what+is+its+average+speed?"
```

### With System Prompt

```bash
curl "https://mincapi.ai.studio/api/v1/generate?prompt=Write+a+haiku&system=You+are+a+Japanese+poet.+Respond+only+in+English."
```

### Plain Text Output

```bash
curl "https://mincapi.ai.studio/api/v1/generate?prompt=Say+hello&output=text"
```

### JavaScript / Fetch

```js
const prompt = "Explain quantum computing in one sentence";
const res = await fetch(
  `https://mincapi.ai.studio/api/v1/generate?prompt=${encodeURIComponent(prompt)}&model=auto`
);
const data = await res.json();
console.log(data.response);
```

### Python / requests

```python
import requests

resp = requests.get("https://mincapi.ai.studio/api/v1/generate", params={
    "prompt": "Explain quantum computing in one sentence",
    "model": "auto"
})
print(resp.json()["response"])
```

---

## AI Agent App Builder

The MincAPI website includes a built-in **Agent App Builder** that compiles tailored system prompts for Claude, Cursor, or GPT. Select your app purpose, tech stack, and default processing lane, then paste the generated prompt into your favorite AI coding assistant to scaffold a complete micro-app powered by MincAPI.

Visit [mincapi.ai.studio](https://mincapi.ai.studio) to try it.

---

## Architecture

MincAPI is powered by free private weights running on high-speed servers, with resilient fallback support provided by [Sixfinger API](https://api.sixfinger.live).

The engine routes incoming requests through intelligent lane selection, balancing speed and depth of reasoning based on the requested model or automatic classification.

---

## License

This project is provided as a free, public-access API. See the website for terms of use.

---

## Links

- **Live API**: [https://mincapi.ai.studio](https://mincapi.ai.studio)
- **API Endpoint**: [https://mincapi.ai.studio/api/v1/generate](https://mincapi.ai.studio/api/v1/generate)
- **Fallback Provider**: [Sixfinger API](https://api.sixfinger.live)
