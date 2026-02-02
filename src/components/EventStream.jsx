import React from 'react'

const typeConfig = {
  message: { icon: '💬', color: '#22d3ee', bg: 'from-cyan-500/20 to-cyan-500/5' },
  tool: { icon: '🔧', color: '#a78bfa', bg: 'from-violet-500/20 to-violet-500/5' },
  knowledge: { icon: '🧠', color: '#34d399', bg: 'from-emerald-500/20 to-emerald-500/5' },
  lifecycle: { icon: '⚡', color: '#f472b6', bg: 'from-pink-500/20 to-pink-500/5' },
  other: { icon: '📦', color: '#94a3b8', bg: 'from-gray-500/20 to-gray-500/5' }
}

function formatSubject(subject) {
  const parts = subject.split('.')
  return parts[parts.length - 1]
}

function EventCard({ event, onClick }) {
  const config = typeConfig[event.type] || typeConfig.other
  const time = event.timestamp.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  const isRecent = (Date.now() - event.timestamp.getTime()) < 5000

  return (
    <button
      onClick={() => onClick?.(event)}
      className={`w-full text-left p-3 rounded-xl transition-all duration-300 hover:scale-[1.02] ${
        isRecent ? 'animate-slide-in' : ''
      }`}
      style={{
        background: `linear-gradient(135deg, ${config.color}15, ${config.color}05)`,
        borderLeft: `3px solid ${config.color}`
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg mt-0.5">{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs" style={{ color: config.color }}>
              {formatSubject(event.subject)}
            </span>
            <span className="text-[10px] text-gray-600">{time}</span>
            {isRecent && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-400">
                NEW
              </span>
            )}
          </div>
          {event.preview && (
            <p className="text-xs text-gray-500 truncate">
              {event.preview}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}

export default function EventStream({ events, onSelect }) {
  return (
    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center py-12">
          <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center mb-4">
            <span className="text-3xl animate-pulse">👀</span>
          </div>
          <p className="text-gray-500 text-sm">Waiting for events...</p>
          <p className="text-gray-600 text-xs mt-1">Neural activity will appear here</p>
        </div>
      ) : (
        events.slice(0, 50).map(event => (
          <EventCard key={event.id} event={event} onClick={onSelect} />
        ))
      )}
      
      <style>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </div>
  )
}
