# Neural Monitor 🛡️

**A real-time 3D visualization dashboard for [OpenClaw](https://github.com/moltbot/moltbot) AI agents.**

Watch your agents communicate, process events, and learn — with beautiful WebGL-powered graphics.

> 🔗 **Built for [PR #7358: Event-Sourced Memory](https://github.com/moltbot/moltbot/pull/7358)** — Persistent memory via NATS JetStream

![Neural Monitor Dashboard](docs/screenshot.png)

## Features

- **🌐 3D Neural Visualization** — Watch events flow through a neural network with glowing nodes and animated beams
- **👥 Multi-Agent Support** — Monitor multiple AI agents simultaneously with color-coded activity
- **📊 Real-Time Stats** — Live event counts, uptime tracking, and per-agent statistics
- **🧠 Brain Panel** — View commitments, contradictions, learning context, and knowledge graph
- **📜 Event Log** — Filterable live stream of events with type-based categorization
- **⚡ WebSocket Streaming** — Low-latency event delivery via NATS JetStream

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Neural Monitor                          │
├─────────────────────────────────────────────────────────────┤
│  React + Three.js + Tailwind     Vite Dev Server (5173)     │
│              │                                              │
│              ▼                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              WebSocket Bridge (8765)                 │   │
│  │              Stats API (8766)                        │   │
│  │              Brain API (8767) [optional]             │   │
│  └─────────────────────────────────────────────────────┘   │
│              │                                              │
│              ▼                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           NATS JetStream (4222)                      │   │
│  │           openclaw-events stream                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## What You Can See

### 3D Visualization
- **Central Core** — Represents the event stream hub with orbital rings
- **Inner Ring (Agents)** — Each AI agent appears as a glowing sphere
  - Size scales with event count
  - Pulses when active
  - Shows name, emoji, and live event count
- **Outer Ring (Event Types)** — Categories: Messages 💬, Tools 🔧, Knowledge 🧠, Lifecycle ⚡
- **Energy Beams** — Watch events flow from agents to event types
- **Inter-Agent Communication** — See when agents send messages to each other

### Stats Header
- Gateway uptime
- Total events processed
- Live/Offline connection status

### Agent Cards (Bottom)
- Per-agent event counts
- Last activity timestamp
- Agent emoji and role

### Event Log (Right Panel)
- Real-time event stream
- Filter by event type
- Event preview with timestamp

### Brain Panel (Optional, requires Brain API)
- Active commitments/promises
- Detected contradictions
- Learning context and topics
- Knowledge graph stats

## Installation

### Prerequisites

- Node.js 18+
- NATS Server with JetStream enabled
- A running `openclaw-events` stream

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/neural-monitor.git
cd neural-monitor

# Install frontend dependencies
npm install

# Install bridge dependencies
cd server
npm install
cd ..

# Copy environment template
cp .env.example .env

# Start the bridge (connects to NATS)
node server/bridge.mjs &

# Start the frontend
npm run dev
```

Open http://localhost:5173 to view the dashboard.

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Frontend (Vite)
VITE_WS_URL=ws://localhost:8765
VITE_STATS_URL=http://localhost:8766
VITE_BRAIN_API=http://localhost:8767

# Bridge Server
NATS_URL=nats://localhost:4222
WS_PORT=8765
HTTP_PORT=8766
NATS_CLI=nats
```

### NATS Authentication

If your NATS server requires authentication:

```env
NATS_URL=nats://username:password@localhost:4222
```

### Remote Deployment

For running the dashboard on a different machine than NATS:

```env
VITE_WS_URL=ws://your-server:8765
VITE_STATS_URL=http://your-server:8766
NATS_URL=nats://nats-server:4222
```

## Event Stream Format

The monitor expects events on the `openclaw.events.<agent>.<type>` subject pattern:

```
openclaw.events.main.message_in
openclaw.events.main.tool_call
openclaw.events.viola.message_out
openclaw.events.mona.lifecycle_start
```

### Supported Event Types

| Type | Subject Pattern | Description |
|------|-----------------|-------------|
| message | `*.message*` | Conversation messages (in/out) |
| tool | `*.tool*` | Tool calls and results |
| knowledge | `*.knowledge*` | Facts, memories, learning |
| lifecycle | `*.lifecycle*` | Session start/end events |

## Agent Configuration

Agents are defined in `src/components/NeuralViz.jsx`:

```javascript
const AGENT_CONFIG = {
  main: { 
    name: 'Your Agent', 
    emoji: '🤖', 
    color: '#6366f1',
    description: 'Primary assistant'
  },
  // Add more agents...
}
```

And in `server/bridge.mjs`:

```javascript
const AGENTS = {
  main: { name: 'Your Agent', emoji: '🤖', stream: 'openclaw-events', ... },
  // Add more agents...
}
```

## Production Deployment

### Build Frontend

```bash
npm run build
```

The `dist/` folder contains static files ready for deployment to any web server.

### Run Bridge as Service

Create a systemd service for the bridge:

```ini
[Unit]
Description=Neural Monitor Bridge
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/neural-monitor/server
ExecStart=/usr/bin/node bridge.mjs
Restart=always
Environment=NATS_URL=nats://localhost:4222

[Install]
WantedBy=multi-user.target
```

## Tech Stack

- **Frontend**: React 18, Three.js, @react-three/fiber, Tailwind CSS
- **Backend**: Node.js, NATS.js, WebSocket (ws)
- **Build**: Vite
- **Streaming**: NATS JetStream

## Development

```bash
# Run frontend with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Screenshots

### Main Dashboard
The 3D visualization shows all agents as glowing spheres, with energy beams flowing to event categories.

### Event Flow
Watch real-time events stream through the system with color-coded types and live counters.

### Agent Communication
When agents communicate with each other, dedicated beams connect them visually.

## License

MIT License — feel free to use, modify, and distribute.

## Background

This dashboard was built to visualize [OpenClaw's Event-Sourced Memory system](https://github.com/moltbot/moltbot/pull/7358) in action.

**The Problem:** AI agents lose context between sessions. Every restart = amnesia.

**The Solution:** Stream all agent events to NATS JetStream. Events become the source of truth — replayable, queryable, persistent.

**This Dashboard:** Makes the invisible visible. Watch 200k+ events flow through your agent family in real-time.

## Related

- **[OpenClaw](https://github.com/moltbot/moltbot)** — The AI agent framework
- **[PR #7358](https://github.com/moltbot/moltbot/pull/7358)** — Event-Sourced Memory feature
- **[NATS JetStream](https://docs.nats.io/nats-concepts/jetstream)** — The streaming backbone

## License

MIT License — feel free to use, modify, and distribute.

---

*Watch your AI think.* 🧠✨
