import React, { useState, useRef, useEffect } from 'react'

const TYPE_CONFIG = {
  message: { icon: '💬', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  tool: { icon: '🔧', color: 'text-violet-400', bg: 'bg-violet-500/20' },
  knowledge: { icon: '🧠', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  lifecycle: { icon: '⚡', color: 'text-pink-400', bg: 'bg-pink-500/20' },
  other: { icon: '📋', color: 'text-gray-400', bg: 'bg-gray-500/20' }
}

export default function EventLog({ events, filters, onFilterToggle }) {
  const listRef = useRef(null)
  const [expanded, setExpanded] = useState(true)
  
  // Filter events based on active filters
  const filteredEvents = events.filter(e => {
    if (filters.length === 0) return true
    return filters.includes(e.type)
  })
  
  // Auto-scroll to top on new events
  useEffect(() => {
    if (listRef.current && filteredEvents.length > 0) {
      listRef.current.scrollTop = 0
    }
  }, [filteredEvents.length])
  
  const formatTime = (timestamp) => {
    if (!timestamp) return '--:--'
    const d = new Date(timestamp)
    return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }
  
  const getPreview = (event) => {
    if (event.preview) return event.preview
    const data = event.data
    if (!data) return event.subject || 'Event'
    
    // Try to extract meaningful text
    const payload = data?.payload
    const innerData = payload?.data
    
    if (innerData?.text) return innerData.text
    if (innerData?.name) return `${innerData.name}${innerData.args?.command ? `: ${innerData.args.command}` : ''}`
    if (payload?.text) return payload.text
    
    return event.subject?.split('.').pop() || 'Event'
  }
  
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="fixed right-4 bottom-24 px-4 py-2 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 text-white text-sm hover:bg-black/80 transition-all z-50"
      >
        📜 Show Event Log ({events.length})
      </button>
    )
  }
  
  return (
    <div className="fixed right-4 bottom-24 w-80 max-h-[50vh] bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <span className="text-cyan-400">📜</span> Event Flow
          <span className="text-xs text-gray-500 font-mono">({filteredEvents.length})</span>
        </h3>
        <button
          onClick={() => setExpanded(false)}
          className="text-gray-400 hover:text-white text-xs"
        >
          ✕
        </button>
      </div>
      
      {/* Filter Pills */}
      <div className="flex gap-1 px-3 py-2 border-b border-white/5 flex-wrap">
        {Object.entries(TYPE_CONFIG).filter(([k]) => k !== 'other').map(([type, config]) => {
          const isActive = filters.length === 0 || filters.includes(type)
          return (
            <button
              key={type}
              onClick={() => onFilterToggle?.(type)}
              className={`px-2 py-1 rounded-lg text-xs transition-all ${
                isActive 
                  ? `${config.bg} ${config.color} border border-current/30` 
                  : 'bg-gray-800/50 text-gray-500 border border-transparent'
              }`}
            >
              {config.icon}
            </button>
          )
        })}
      </div>
      
      {/* Event List */}
      <div ref={listRef} className="flex-1 overflow-y-auto min-h-0">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <span className="text-2xl mb-2">👀</span>
            <span className="text-xs">Waiting for events...</span>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredEvents.slice(0, 50).map((event, i) => {
              const config = TYPE_CONFIG[event.type] || TYPE_CONFIG.other
              const isNew = i === 0
              return (
                <div 
                  key={event.id || i}
                  className={`px-3 py-2 hover:bg-white/5 transition-colors ${isNew ? 'animate-pulse-once' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`text-sm ${config.color}`}>{config.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white truncate">
                        {getPreview(event)}
                      </p>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                        {formatTime(event.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
