import React, { useState, useEffect } from 'react'

// Configurable endpoint (set via environment variable)
const STATS_URL = import.meta.env.VITE_STATS_URL || 'http://localhost:8766'

const statConfig = [
  { key: 'messages', icon: '💬', label: 'Messages', color: '#22d3ee' },
  { key: 'tools', icon: '🔧', label: 'Tools', color: '#a78bfa' },
  { key: 'knowledge', icon: '🧠', label: 'Knowledge', color: '#34d399' }
]

function StatCard({ icon, label, value, color, isActive, subtext }) {
  return (
    <div 
      className="stat-card transition-all duration-300"
      style={{ '--accent-color': color }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold" style={{ color }}>{value.toLocaleString()}</p>
              {subtext && <span className="text-xs text-emerald-400">{subtext}</span>}
            </div>
          </div>
        </div>
        {isActive && (
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: color }} />
        )}
      </div>
    </div>
  )
}

export default function StatsPanel({ stats, nodeStats }) {
  const [uptime, setUptime] = useState('--')
  const [historicTotal, setHistoricTotal] = useState(4082) // From NATS

  const [historicByType, setHistoricByType] = useState({})
  
  // Fetch historic stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${STATS_URL}/stats`)
        if (res.ok) {
          const data = await res.json()
          setHistoricTotal(data.total || 4082)
          setHistoricByType(data.byType || {})
        }
      } catch (e) {}
    }
    fetchStats()
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [])

  // Calculate uptime
  useEffect(() => {
    const start = new Date('2026-01-26T00:00:00')
    const update = () => {
      const diff = Date.now() - start.getTime()
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      setUptime(`${days}d ${hours}h ${mins}m`)
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="text-emerald-400">📊</span> Neural Stats
      </h2>
      
      {/* Uptime Card */}
      <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">System Uptime</p>
        <p className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
          {uptime}
        </p>
        <p className="text-xs text-gray-600 mt-1">Since Jan 26, 2026</p>
      </div>
      
      {/* Total Events */}
      <div className="mb-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Memories</p>
            <p className="text-3xl font-bold text-emerald-400">
              {(historicTotal + stats.total).toLocaleString()}
            </p>
          </div>
          <div className="text-4xl">🧠</div>
        </div>
        <p className="text-xs text-emerald-600 mt-2">
          +{stats.total} this session
        </p>
      </div>
      
      {/* Individual Stats - Historic + Live */}
      <div className="space-y-3 flex-1">
        {statConfig.map(({ key, icon, label, color }) => {
          const typeKey = key === 'messages' ? 'message' : key === 'tools' ? 'tool' : key
          const historic = historicByType[typeKey] || 0
          const live = stats[key] || 0
          return (
            <StatCard
              key={key}
              icon={icon}
              label={label}
              value={historic + live}
              subtext={live > 0 ? `+${live} live` : null}
              color={color}
              isActive={nodeStats[typeKey]?.lastActive && 
                (Date.now() - nodeStats[typeKey]?.lastActive) < 2000}
            />
          )
        })}
      </div>
      
      {/* Last Event */}
      {stats.lastEvent && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Last Event</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-sm text-gray-400 truncate">
              {stats.lastEvent.preview || stats.lastEvent.subject.split('.').pop()}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {stats.lastEvent.timestamp.toLocaleTimeString('de-DE')}
          </p>
        </div>
      )}
    </div>
  )
}
