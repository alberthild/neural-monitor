import React, { useState, useEffect, useRef, Suspense } from 'react'
import EventDetails from './components/EventDetails'
import EventLog from './components/EventLog'

// Lazy load Three.js component
const NeuralViz = React.lazy(() => import('./components/NeuralViz'))

const WS_URL = 'ws://192.168.0.20:8765'

export default function App() {
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [stats, setStats] = useState({
    total: 0,
    messages: 0,
    tools: 0,
    knowledge: 0,
    connected: false,
    lastEvent: null
  })
  const [activityData, setActivityData] = useState([])
  const [nodeStats, setNodeStats] = useState({
    message: { count: 0, lastActive: null },
    tool: { count: 0, lastActive: null },
    knowledge: { count: 0, lastActive: null },
    lifecycle: { count: 0, lastActive: null }
  })
  const [historicCounts, setHistoricCounts] = useState({})
  const [subCategories, setSubCategories] = useState({})
  const [uptime, setUptime] = useState('--')
  const [agentStats, setAgentStats] = useState({})
  const [visibleAgents, setVisibleAgents] = useState([]) // empty = all visible
  const [visibleTypes, setVisibleTypes] = useState([]) // empty = all visible
  const [eventFilters, setEventFilters] = useState([]) // for EventLog
  
  // Fetch historic counts and uptime
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://192.168.0.20:8766/stats')
        if (res.ok) {
          const data = await res.json()
          setHistoricCounts(data.byType || {})
          setSubCategories(data.subCategories || {})
          setAgentStats(data.agents || {})
          if (data.uptime?.formatted) {
            setUptime(data.uptime.formatted)
          }
        }
      } catch (e) {}
    }
    fetchStats()
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])
  const wsRef = useRef(null)
  const reconnectRef = useRef(null)

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('🔌 Connected to Claudia Event Stream')
      setStats(s => ({ ...s, connected: true }))
      ws.send(JSON.stringify({ action: 'subscribe', pattern: 'openclaw.events.>' }))
    }

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data)
        if (data.type === 'event') {
          const subject = data.subject || ''
          let eventType = 'other'
          if (subject.includes('message')) eventType = 'message'
          else if (subject.includes('tool')) eventType = 'tool'
          else if (subject.includes('knowledge')) eventType = 'knowledge'
          else if (subject.includes('lifecycle')) eventType = 'lifecycle'

          const event = {
            id: Date.now() + Math.random(),
            subject: data.subject,
            agent: data.agent,  // ← THIS WAS MISSING!
            type: eventType,
            timestamp: new Date(),
            data: data.data,
            preview: extractPreview(data.data, eventType)
          }
          
          setEvents(prev => [event, ...prev].slice(0, 200))
          
          // Update stats
          setStats(s => ({
            ...s,
            total: s.total + 1,
            messages: s.messages + (eventType === 'message' ? 1 : 0),
            tools: s.tools + (eventType === 'tool' ? 1 : 0),
            knowledge: s.knowledge + (eventType === 'knowledge' ? 1 : 0),
            lastEvent: event
          }))

          // Update node stats for 3D viz
          setNodeStats(prev => ({
            ...prev,
            [eventType]: {
              count: (prev[eventType]?.count || 0) + 1,
              lastActive: Date.now()
            }
          }))

          // Update activity chart
          const now = new Date()
          const minute = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
          setActivityData(prev => {
            const existing = prev.find(d => d.time === minute)
            if (existing) {
              return prev.map(d => d.time === minute 
                ? { ...d, count: d.count + 1, [eventType]: (d[eventType] || 0) + 1 } 
                : d)
            }
            return [...prev, { time: minute, count: 1, [eventType]: 1 }].slice(-30)
          })
        }
      } catch (e) {
        console.error('Parse error:', e)
      }
    }

    ws.onclose = () => {
      console.log('❌ Disconnected')
      setStats(s => ({ ...s, connected: false }))
      reconnectRef.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => ws.close()
  }

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
      clearTimeout(reconnectRef.current)
    }
  }, [])

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#030014] text-white">
      
      {/* FULLSCREEN 3D Canvas - Base Layer */}
      <div className="fixed inset-0 z-0">
        <Suspense fallback={<LoadingViz />}>
          <NeuralViz 
            events={events} 
            nodeStats={nodeStats}
            historicCounts={historicCounts}
            subCategories={subCategories}
            agentStats={agentStats}
            onNodeClick={(type) => setSelectedEvent(events.find(e => e.type === type))}
          />
        </Suspense>
      </div>
      
      {/* UI Overlay Layer - pointer-events-none container */}
      <div className="fixed inset-0 z-10 pointer-events-none">
        
        {/* Floating Header - Top */}
        <header className="absolute top-4 left-4 right-4 pointer-events-auto">
          <div className="flex items-center justify-between gap-4">
            {/* Logo + Title */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-lg shadow-lg shadow-cyan-500/30">
                🛡️
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                Neural Monitor
              </h1>
            </div>
          
            {/* Stats + Connection */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-4 px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">⏱️</span>
                  <span className="text-cyan-400 font-mono">{uptime}</span>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">🧠</span>
                  <span className="text-emerald-400 font-mono">{(Object.values(agentStats).reduce((sum, a) => sum + (a.messages || 0), 0) || stats.total).toLocaleString()}</span>
                </div>
              </div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl backdrop-blur-xl border shadow-lg ${
                stats.connected 
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-emerald-500/20' 
                  : 'bg-red-500/20 border-red-500/40 text-red-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${stats.connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                <span className="text-xs font-medium">{stats.connected ? 'Live' : 'Offline'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Floating Agent Cards - Bottom */}
        <div className="absolute bottom-4 left-4 right-4 pointer-events-auto">
          <div className="flex gap-3 justify-center flex-wrap">
            {Object.entries(agentStats).map(([id, agent]) => (
              <div 
                key={id} 
                className={`px-4 py-3 rounded-2xl backdrop-blur-xl border transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                  agent.messages > 0 
                    ? 'bg-black/50 border-violet-500/40 hover:border-violet-400/60 shadow-lg shadow-violet-500/10' 
                    : 'bg-black/30 border-gray-700/40 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{agent.emoji}</span>
                  <div>
                    <p className="font-semibold text-sm">{agent.name}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={agent.messages > 0 ? 'text-cyan-400 font-bold' : 'text-gray-500'}>
                        {agent.messages?.toLocaleString() || 0}
                      </span>
                      <span className="text-gray-600">•</span>
                      <span className={agent.messages > 0 ? 'text-emerald-400' : 'text-gray-600'}>
                        {formatAge(agent.lastTs)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
      </div>

      {/* Event Log Panel */}
      <EventLog 
        events={events}
        filters={eventFilters}
        onFilterToggle={(type) => {
          setEventFilters(prev => {
            if (prev.includes(type)) return prev.filter(t => t !== type)
            return [...prev, type]
          })
        }}
      />

      {/* Event Details Modal */}
      {selectedEvent && (
        <EventDetails event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  )
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024
    i++
  }
  return `${bytes.toFixed(1)} ${units[i]}`
}

function formatAge(ts) {
  if (!ts || ts === '0001-01-01T00:00:00Z') return 'never'
  try {
    const date = new Date(ts)
    const now = new Date()
    const seconds = Math.floor((now - date) / 1000)
    if (seconds < 0 || seconds > 365 * 24 * 3600 * 100) return 'never'
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  } catch {
    return 'unknown'
  }
}

function LoadingViz() {
  return (
    <div className="h-full flex items-center justify-center bg-black/50">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 animate-pulse" />
        <p className="text-gray-400">Initializing Neural Network...</p>
      </div>
    </div>
  )
}

function extractPreview(data, type) {
  if (!data) return null
  
  // OpenClaw event structure: payload.data.text or payload.data.args
  const payload = data?.payload
  const innerData = payload?.data
  
  // Messages - payload.data.text
  if (type === 'message') {
    if (innerData?.text) return innerData.text
    if (innerData?.content) return innerData.content
    if (payload?.text) return payload.text
    if (data?.text) return data.text
  }
  
  // Tools - payload.data.name + payload.data.args.command
  if (type === 'tool') {
    const name = innerData?.name
    const args = innerData?.args
    const phase = innerData?.phase
    const result = innerData?.partialResult?.content?.[0]?.text
    
    // Show result if available (tool output)
    if (result && result.length > 10) return `📤 ${result.slice(0, 400)}`
    
    // Show command being executed
    if (name === 'exec' && args?.command) return `▶️ ${args.command}`
    if (name && args) return `${name}: ${JSON.stringify(args).slice(0, 200)}`
    if (name) return `${name} (${phase || 'running'})`
  }
  
  // Knowledge - fact field
  if (type === 'knowledge') {
    if (data?.fact) return data.fact
    if (innerData?.fact) return innerData.fact
    if (data?.content) return data.content
    if (data?.summary) return data.summary
  }
  
  // Lifecycle - session events
  if (type === 'lifecycle') {
    if (innerData?.event) return innerData.event
    if (data?.event) return data.event
    if (data?.type) return data.type
  }
  
  // Deep search for text
  const searchText = (obj, depth = 0) => {
    if (!obj || depth > 3) return null
    if (typeof obj === 'string' && obj.length > 5) return obj
    if (typeof obj !== 'object') return null
    for (const key of ['text', 'content', 'message', 'fact', 'command', 'result']) {
      if (obj[key] && typeof obj[key] === 'string') return obj[key]
    }
    for (const val of Object.values(obj)) {
      const found = searchText(val, depth + 1)
      if (found) return found
    }
    return null
  }
  
  return searchText(data) || data?.type || '—'
}
