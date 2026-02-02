import React from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const typeColors = {
  message: '#22d3ee',
  tool: '#a78bfa',
  knowledge: '#34d399',
  lifecycle: '#f472b6'
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, p) => sum + (p.value || 0), 0)
    return (
      <div className="glass-card rounded-xl p-3 border border-white/10">
        <p className="text-cyan-400 font-medium text-sm mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((p, i) => (
            <div key={i} className="flex items-center justify-between gap-4 text-xs">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                <span className="text-gray-400 capitalize">{p.dataKey}</span>
              </span>
              <span style={{ color: p.color }}>{p.value || 0}</span>
            </div>
          ))}
          <div className="pt-1 mt-1 border-t border-white/10 flex justify-between text-xs">
            <span className="text-gray-500">Total</span>
            <span className="text-white font-medium">{total}</span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export default function ActivityChart({ data, compact }) {
  if (data.length === 0) {
    return (
      <div className={`${compact ? 'h-full' : 'h-48'} flex items-center justify-center`}>
        <div className="text-center">
          <span className="text-2xl">📈</span>
          <p className="text-gray-500 text-xs mt-1">Waiting for activity...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={compact ? 'h-full' : 'h-56'}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <defs>
            {Object.entries(typeColors).map(([key, color]) => (
              <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          
          <XAxis
            dataKey="time"
            stroke="transparent"
            tick={{ fill: '#666', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="transparent"
            tick={{ fill: '#666', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={30}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {Object.entries(typeColors).map(([key, color]) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stackId="1"
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${key})`}
              animationDuration={300}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Legend - hide in compact mode */}
      {!compact && (
        <div className="flex justify-center gap-4 mt-2">
          {Object.entries(typeColors).map(([key, color]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-gray-500 capitalize">{key}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
