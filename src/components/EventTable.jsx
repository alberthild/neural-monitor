import React, { useRef, useEffect } from 'react'

const typeConfig = {
  message: { icon: '💬', color: '#22d3ee', label: 'Message' },
  tool: { icon: '🔧', color: '#a78bfa', label: 'Tool' },
  knowledge: { icon: '🧠', color: '#34d399', label: 'Knowledge' },
  lifecycle: { icon: '⚡', color: '#f472b6', label: 'Lifecycle' },
  other: { icon: '📦', color: '#94a3b8', label: 'Other' }
}

function formatTime(date) {
  return date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  })
}

function formatSubject(subject) {
  // openclaw.events.agent.conversation_message_out -> conversation_message_out
  const parts = subject.split('.')
  return parts.slice(-1)[0]
}

function formatAgent(subject) {
  // openclaw.events.agent.xxx -> agent
  // openclaw.events.claudia.xxx -> claudia
  const parts = subject.split('.')
  return parts[2] || 'unknown'
}

export default function EventTable({ events, onSelect }) {
  const tableRef = useRef(null)
  const autoScrollRef = useRef(true)
  
  // Auto-scroll to top when new events arrive
  useEffect(() => {
    if (autoScrollRef.current && tableRef.current) {
      tableRef.current.scrollTop = 0
    }
  }, [events.length])

  return (
    <div className="glass-card rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-violet-400">⚡</span> Live Event Stream
          <span className="text-xs text-gray-500 font-normal ml-2">
            {events.length} events
          </span>
        </h2>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-gray-400">Auto-updating</span>
        </div>
      </div>
      
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-2 px-6 py-3 bg-white/[0.02] border-b border-white/5 text-xs text-gray-500 uppercase tracking-wide">
        <div className="col-span-1">Time</div>
        <div className="col-span-1">Type</div>
        <div className="col-span-2">Subject</div>
        <div className="col-span-8">Content</div>
      </div>
      
      {/* Table Body - Scrollable */}
      <div 
        ref={tableRef}
        className="overflow-y-auto"
        style={{ maxHeight: '400px' }}
        onScroll={(e) => {
          // Disable auto-scroll if user scrolls away from top
          autoScrollRef.current = e.target.scrollTop < 50
        }}
      >
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center mb-4">
              <span className="text-3xl animate-pulse">👀</span>
            </div>
            <p className="text-gray-500">Waiting for events...</p>
            <p className="text-gray-600 text-xs mt-1">Neural activity will stream here in real-time</p>
          </div>
        ) : (
          events.map((event, index) => {
            const config = typeConfig[event.type] || typeConfig.other
            const isNew = index < 3 && (Date.now() - event.timestamp.getTime()) < 5000
            
            return (
              <button
                key={event.id}
                onClick={() => onSelect?.(event)}
                className={`w-full grid grid-cols-12 gap-2 px-6 py-2 text-left border-b border-white/[0.02] hover:bg-white/[0.02] transition-all ${
                  isNew ? 'bg-cyan-500/5 animate-flash' : ''
                }`}
              >
                {/* Time */}
                <div className="col-span-1 font-mono text-xs text-gray-500">
                  {formatTime(event.timestamp).slice(0, 8)}
                </div>
                
                {/* Type */}
                <div className="col-span-1">
                  <span 
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                    style={{ 
                      background: `${config.color}20`,
                      color: config.color
                    }}
                  >
                    {config.icon}
                  </span>
                </div>
                
                {/* Subject */}
                <div className="col-span-2 font-mono text-xs truncate" style={{ color: config.color }}>
                  {formatSubject(event.subject)}
                </div>
                
                {/* Content - larger, readable */}
                <div className="col-span-8 text-sm text-gray-300 line-clamp-2">
                  {event.preview || '—'}
                </div>
              </button>
            )
          })
        )}
      </div>
      
      <style>{`
        @keyframes flash {
          0% { background: rgba(34, 211, 238, 0.15); }
          100% { background: rgba(34, 211, 238, 0.05); }
        }
        .animate-flash { animation: flash 1s ease-out; }
      `}</style>
    </div>
  )
}
