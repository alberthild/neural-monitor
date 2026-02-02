import React from 'react'

const typeConfig = {
  message: { icon: '💬', color: '#22d3ee', label: 'Message' },
  tool: { icon: '🔧', color: '#a78bfa', label: 'Tool' },
  knowledge: { icon: '🧠', color: '#34d399', label: 'Knowledge' },
  lifecycle: { icon: '⚡', color: '#f472b6', label: 'Lifecycle' },
  other: { icon: '📦', color: '#94a3b8', label: 'Event' }
}

export default function EventDetails({ event, onClose }) {
  if (!event) return null
  
  const config = typeConfig[event.type] || typeConfig.other
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-lg glass-card rounded-3xl p-6 animate-scale-in"
        onClick={e => e.stopPropagation()}
        style={{
          '--accent-color': config.color
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: `${config.color}20` }}
            >
              {config.icon}
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: config.color }}>
                {config.label} Event
              </h3>
              <p className="text-xs text-gray-500">
                {event.timestamp.toLocaleString('de-DE')}
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>
        
        {/* Subject */}
        <div className="mb-4">
          <label className="text-xs text-gray-500 uppercase tracking-wide">Subject</label>
          <p className="font-mono text-sm text-gray-300 mt-1 break-all">
            {event.subject}
          </p>
        </div>
        
        {/* Preview */}
        {event.preview && (
          <div className="mb-4">
            <label className="text-xs text-gray-500 uppercase tracking-wide">Preview</label>
            <p className="text-sm text-gray-300 mt-1">
              {event.preview}
            </p>
          </div>
        )}
        
        {/* Raw Data */}
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide">Raw Data</label>
          <pre className="mt-2 p-4 rounded-xl bg-black/30 text-xs text-gray-400 overflow-auto max-h-48 font-mono">
            {JSON.stringify(event.data, null, 2)}
          </pre>
        </div>
        
        {/* Accent line */}
        <div 
          className="absolute top-0 left-6 right-6 h-0.5 rounded-full"
          style={{ background: `linear-gradient(90deg, ${config.color}, transparent)` }}
        />
      </div>
      
      <style>{`
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>
    </div>
  )
}
