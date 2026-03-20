# CragCast Conversational AI – Implementation Plan

**Status: ✅ Core implementation complete**

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Chat UI (pages/chat.vue)                               │
│  - Message list with streaming responses                │
│  - Climbing-themed thinking phrases                     │
│  - Tool call indicators                                 │
│  - Suggested prompts for first-time users               │
└───────────────┬─────────────────────────────────────────┘
                │ SSE (Server-Sent Events)
                ▼
┌─────────────────────────────────────────────────────────┐
│  POST /api/chat  (server/api/chat.post.ts)              │
│  - Accepts { messages[] }                               │
│  - Max 20 messages, 1000 chars each                     │
│  - Returns SSE stream (token/tool_call/done/error)      │
└───────────────┬─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────┐
│  Orchestrator (server/utils/ai/orchestrator.ts)         │
│  - System prompt with tool selection guide              │
│  - Tool-use loop: AI decides which tools to call        │
│  - Streams final text response back via SSE             │
│  - Max 5 tool rounds per turn                           │
└───────┬───────┬───────┬───────┬───────┬───────┬────────┘
        │       │       │       │       │       │
        ▼       ▼       ▼       ▼       ▼       ▼
   ┌────────┐┌───────┐┌─────┐┌──────┐┌──────┐┌───────┐
   │Lookup  ││Crag   ││Rank ││MWIS  ││Region││Weather│
   │Crag    ││Score  ││     ││      ││Info  ││       │
   └────────┘└───────┘└─────┘└──────┘└──────┘└───────┘
   + Search
     Crags
```

## What Was Built

### 1. Cloudflare Workers AI Binding
- `[ai]` binding in `wrangler.toml`
- Model: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
- No API key needed — runs on Cloudflare's inference network

### 2. AI Orchestrator (`server/utils/ai/orchestrator.ts`)
Tool-use loop:
1. Build messages array with system prompt + conversation history
2. Call Workers AI with tool definitions
3. If AI returns tool calls → execute them, append results, re-call AI
4. If AI returns text → stream it back via `onToken` callback
5. Max 5 iterations to prevent runaway loops

### 3. System Prompt (`server/utils/ai/system-prompt.ts`)
- Identity: "CragCast, a UK climbing conditions advisor"
- Includes explicit tool selection guide:
  - "Is X dry?" → `lookup_crag` (no scoring needed)
  - "How good is X?" → `get_crag_score` (only when score requested)
  - "Where should I climb?" → `rank_regions`
  - etc.
- Instructs AI to always respond with helpful summary after tool calls
- Locked to climbing/weather topics
- British English

### 4. Tools (`server/utils/ai/tools.ts`)

| Tool | Description | Inputs | Source |
|------|-------------|--------|--------|
| `lookup_crag` | Find crag by name, return details + weather | `crag_name, dates[]` | D1 + Open-Meteo |
| `get_crag_score` | Score a crag 0-100 with modifiers | `crag_name, dates[]` | Scoring engine |
| `get_weather_forecast` | Hourly forecast for a location | `lat, lon, dates[]` | Open-Meteo |
| `search_crags` | Find crags in a region | `region_id, climb_type?, limit?` | D1 database |
| `rank_regions` | Rank all UK regions by conditions | `dates[], lat?, lon?, max_drive_mins?, top_n?` | Scoring engine |
| `get_region_info` | Region metadata and links | `region_id?` | Static regions data |
| `get_mwis_forecast` | Mountain weather forecast | `area` | MWIS HTML scraping |

Key design decision: `lookup_crag` was added specifically so the AI doesn't need to run the full scoring pipeline for simple weather questions. The system prompt guides the AI to prefer it over `get_crag_score` for most crag-specific queries.

### 5. Chat API Endpoint (`server/api/chat.post.ts`)
- **Method:** POST
- **Body:** `{ messages: Array<{role, content}> }`
- **Response:** SSE stream (`text/event-stream`)
- **Events:** `token`, `tool_call`, `done`, `error`
- **Limits:** 20 messages max, 1000 chars each, last must be user

### 6. Chat UI (`pages/chat.vue`)
- Message list with auto-scroll
- Suggested prompts on empty state
- Nav link in footer

### 7. Client Composable (`composables/useChat.ts`)
- `ChatMsg` type with `id, role, content, toolCalls[], streaming, thinkingPhrase`
- SSE parsing with buffer handling for partial lines
- Thinking phrases cycle every 5s: "Reading the topo...", "Chalking up...", "Checking the seepage...", etc.
- Stops thinking animation when content arrives or stream ends

### 8. Chat Message Component (`components/ChatMessage.vue`)
- Thinking state: bouncing dots animation + cycling phrase
- Tool call indicators: sky-blue dots with tool name
- Message content: whitespace-preserving text
- Scoped CSS for dot bounce keyframes

## Known Limitations / Future Work

1. **Model quality:** Llama 3.3 70B can sometimes refuse to answer or give unhelpful responses after tool calls. The improved system prompt mitigates this but doesn't eliminate it entirely.
2. **No rate limiting:** Planned but not yet implemented (KV-based counter per IP).
3. **No session persistence:** Messages are in-memory only (lost on page refresh).
4. **No user context injection:** User preferences/location from `usePrefs` are not yet passed to the AI.
5. **MWIS on-demand only:** MWIS forecasts are fetched live per AI request. A cron-based ingestion would be more reliable.
6. **SSE timeout:** Cloudflare Pages has a 30s timeout on free plan (100s paid). Long tool chains could hit this.

## Files

**New files created:**
- `server/api/chat.post.ts`
- `server/utils/ai/orchestrator.ts`
- `server/utils/ai/tools.ts`
- `server/utils/ai/system-prompt.ts`
- `server/utils/ai/types.ts`
- `pages/chat.vue`
- `components/ChatMessage.vue`
- `components/ChatInput.vue`
- `composables/useChat.ts`

**Modified files:**
- `wrangler.toml` — added `[ai]` binding
- `components/AppFooter.vue` — added chat nav link
