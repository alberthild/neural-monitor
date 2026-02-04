#!/usr/bin/env node
/**
 * Claudia Monitor - WebSocket Bridge
 * Streams NATS events to the frontend + provides stats API
 */

import { connect, StringCodec } from 'nats'
import { WebSocketServer } from 'ws'
import http from 'http'

const NATS_URL = process.env.NATS_URL || 'nats://localhost:4222'
const WS_PORT = parseInt(process.env.WS_PORT || '8765')
const HTTP_PORT = parseInt(process.env.HTTP_PORT || '8766')
const NATS_CLI = process.env.NATS_CLI || 'nats'  // Path to nats CLI binary

const sc = StringCodec()
let nc = null

/**
 * Parse NATS URL with optional credentials
 * Supports: nats://user:pass@host:port or nats://host:port
 */
function parseNatsUrl(urlString) {
  try {
    const httpUrl = urlString.replace(/^nats:\/\//, 'http://')
    const url = new URL(httpUrl)
    const servers = `${url.hostname}:${url.port || 4222}`
    
    if (url.username && url.password) {
      return {
        servers,
        user: decodeURIComponent(url.username),
        pass: decodeURIComponent(url.password),
      }
    }
    return { servers }
  } catch {
    return { servers: urlString.replace(/^nats:\/\//, '') }
  }
}
let stats = { total: 0, byType: {}, agents: {} }
const bridgeStartTime = Date.now()

// Agent configuration
const AGENTS = {
  main: { name: 'Claudia', emoji: '🛡️', stream: 'openclaw-events', subject: 'openclaw.events.main.>' },
  'mondo-assistant': { name: 'Mona', emoji: '🌙', stream: 'openclaw-events', subject: 'openclaw.events.mondo-assistant.>' },
  vera: { name: 'Vera', emoji: '🔒', stream: 'openclaw-events', subject: 'openclaw.events.vera.>' },
  stella: { name: 'Stella', emoji: '💰', stream: 'openclaw-events', subject: 'openclaw.events.stella.>' },
  viola: { name: 'Viola', emoji: '⚙️', stream: 'openclaw-events', subject: 'openclaw.events.viola.>' },
  agent: { name: 'Legacy (pre-fix)', emoji: '📦', stream: 'openclaw-events', subject: 'openclaw.events.agent.>' }
}

// Connect to NATS
async function connectNats() {
  try {
    const { servers, user, pass } = parseNatsUrl(NATS_URL)
    const connectOpts = { servers, ...(user && pass ? { user, pass } : {}) }
    nc = await connect(connectOpts)
    console.log(`📡 Connected to NATS at ${servers}${user ? ' (authenticated)' : ''}`)
    
    // Get initial stats from stream
    const js = nc.jetstream()
    const stream = await js.streams.get('openclaw-events')
    const info = await stream.info({ subjects_filter: '>' })
    stats.total = info.state.messages
    
    // Get subject breakdown from stream subjects
    try {
      const { execSync } = await import('child_process')
      // Use monitor credentials for CLI
      const natsCliUrl = NATS_URL.includes('@') ? `-s "${NATS_URL}"` : ''
      const output = execSync(`${NATS_CLI} ${natsCliUrl} stream subjects openclaw-events --json 2>/dev/null`).toString()
      const subjects = JSON.parse(output)
      stats.subCategories = {}
      
      if (subjects && typeof subjects === 'object') {
        for (const [subject, count] of Object.entries(subjects)) {
          // Main categories
          if (subject.includes('message')) stats.byType.message = (stats.byType.message || 0) + count
          else if (subject.includes('tool')) stats.byType.tool = (stats.byType.tool || 0) + count
          else if (subject.includes('knowledge')) stats.byType.knowledge = (stats.byType.knowledge || 0) + count
          else if (subject.includes('lifecycle')) stats.byType.lifecycle = (stats.byType.lifecycle || 0) + count
          
          // Sub-categories (last part of subject)
          const subCat = subject.split('.').pop()
          stats.subCategories[subCat] = count
        }
      }
    } catch (e) {
      console.log('Could not get subject breakdown:', e.message)
    }
    
    console.log(`📊 Stream has ${stats.total} events`, stats.byType)
    
    return true
  } catch (e) {
    console.error('❌ NATS connection failed:', e.message)
    return false
  }
}

// WebSocket server for real-time events
function startWebSocket() {
  const wss = new WebSocketServer({ port: WS_PORT })
  
  wss.on('connection', async (ws) => {
    console.log('🔌 Client connected')
    
    ws.on('message', async (msg) => {
      try {
        const data = JSON.parse(msg.toString())
        
        if (data.action === 'subscribe' && data.pattern) {
          // Subscribe to NATS pattern
          const sub = nc.subscribe(data.pattern)
          console.log(`📥 Subscribed to: ${data.pattern}`)
          
          ;(async () => {
            for await (const m of sub) {
              if (ws.readyState !== 1) break
              
              const subject = m.subject
              let payload = {}
              try {
                payload = JSON.parse(sc.decode(m.data))
              } catch {
                payload = { raw: sc.decode(m.data) }
              }
              
              // Update stats
              stats.total++
              const type = subject.split('.')[3] || 'unknown'
              stats.byType[type] = (stats.byType[type] || 0) + 1
              
              // Extract agent from payload.session: "agent:main:main" or "agent:viola:xxx"
              const sessionKey = payload?.session || payload?.sessionKey || ''
              const sessionParts = sessionKey.split(':')
              // Format: agent:<agentId>:<sessionId> → we want index 1
              const agentFromSession = sessionParts[1] || 'main'
              
              // Fallback: try subject (openclaw.events.<agent>.<type>)
              const subjectParts = subject.split('.')
              const agentFromSubject = subjectParts[2]
              
              // Use session first (more reliable), skip generic "agent"
              const agent = (agentFromSession && agentFromSession !== 'agent') 
                ? agentFromSession 
                : (agentFromSubject !== 'agent' ? agentFromSubject : 'main')
              
              // Send to client with explicit agent
              ws.send(JSON.stringify({
                type: 'event',
                subject,
                agent,
                data: payload,
                timestamp: Date.now()
              }))
            }
          })()
        }
      } catch (e) {
        console.error('Message parse error:', e)
      }
    })
    
    ws.on('close', () => {
      console.log('❌ Client disconnected')
    })
  })
  
  console.log(`🌐 WebSocket server on ws://0.0.0.0:${WS_PORT}`)
}

// HTTP server for stats API
function startHttp() {
  const server = http.createServer(async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', 'application/json')
    
    if (req.url === '/stats') {
      // Fetch stats from ALL agent streams
      try {
        const { execSync } = await import('child_process')
        stats.total = 0
        stats.byType = {}
        stats.subCategories = {}
        stats.agents = {}
        
        // Get all subjects from the unified stream once
        let allSubjects = {}
        try {
          const subjectsOutput = execSync(`${NATS_CLI} stream subjects openclaw-events --json 2>/dev/null`).toString()
          allSubjects = JSON.parse(subjectsOutput) || {}
        } catch (e) {}
        
        for (const [agentId, agentConfig] of Object.entries(AGENTS)) {
          try {
            // Filter subjects for this agent
            const agentSubjectPrefix = `openclaw.events.${agentId}.`
            const subjects = {}
            let messages = 0
            
            for (const [subject, count] of Object.entries(allSubjects)) {
              if (subject.startsWith(agentSubjectPrefix)) {
                subjects[subject] = count
                messages += count
              }
            }
            
            const bytes = 0 // Can't easily get per-agent bytes
            const lastTs = null // Would need to query
            
            // Calculate event types for this agent
            let msgIn = 0, msgOut = 0, toolCalls = 0, lifecycle = 0
            for (const [subject, count] of Object.entries(subjects)) {
              if (subject.includes('message_in')) msgIn += count
              else if (subject.includes('message_out')) msgOut += count
              else if (subject.includes('tool')) toolCalls += count
              else if (subject.includes('lifecycle')) lifecycle += count
              
              // Global stats
              if (subject.includes('message')) stats.byType.message = (stats.byType.message || 0) + count
              else if (subject.includes('tool')) stats.byType.tool = (stats.byType.tool || 0) + count
              else if (subject.includes('knowledge')) stats.byType.knowledge = (stats.byType.knowledge || 0) + count
              else if (subject.includes('lifecycle')) stats.byType.lifecycle = (stats.byType.lifecycle || 0) + count
              
              const subCat = subject.split('.').pop()
              stats.subCategories[subCat] = (stats.subCategories[subCat] || 0) + count
            }
            
            stats.agents[agentId] = {
              ...agentConfig,
              messages,
              bytes,
              lastTs,
              types: { msgIn, msgOut, toolCalls, lifecycle }
            }
            stats.total += messages
          } catch (e) {
            // Stream doesn't exist or error
            stats.agents[agentId] = {
              ...agentConfig,
              messages: 0,
              bytes: 0,
              lastTs: null,
              types: { msgIn: 0, msgOut: 0, toolCalls: 0, lifecycle: 0 }
            }
          }
        }
      } catch (e) {
        console.log('Stats refresh error:', e.message)
      }
      
      // Get GATEWAY uptime
      let gatewayUptime = null
      try {
        const { execSync } = await import('child_process')
        const etime = execSync('ps -o etimes= -p $(pgrep -f "openclaw-gateway" | head -1) 2>/dev/null').toString().trim()
        if (etime) {
          const seconds = parseInt(etime)
          gatewayUptime = {
            seconds,
            formatted: formatUptime(seconds)
          }
        }
      } catch (e) {
        const uptimeSeconds = Math.floor((Date.now() - bridgeStartTime) / 1000)
        gatewayUptime = {
          seconds: uptimeSeconds,
          formatted: formatUptime(uptimeSeconds) + ' (bridge)'
        }
      }
      
      res.writeHead(200)
      res.end(JSON.stringify({
        ...stats,
        uptime: gatewayUptime
      }))
    } else if (req.url === '/health') {
      res.writeHead(200)
      res.end(JSON.stringify({ status: 'ok', nats: !!nc }))
    } else {
      res.writeHead(404)
      res.end(JSON.stringify({ error: 'Not found' }))
    }
  })
  
  function formatUptime(seconds) {
    const d = Math.floor(seconds / 86400)
    const h = Math.floor((seconds % 86400) / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (d > 0) return `${d}d ${h}h ${m}m`
    if (h > 0) return `${h}h ${m}m ${s}s`
    return `${m}m ${s}s`
  }
  
  server.listen(HTTP_PORT, '0.0.0.0', () => {
    console.log(`📊 Stats API on http://0.0.0.0:${HTTP_PORT}`)
  })
}

// Main
async function main() {
  console.log('🛡️ Claudia Monitor Bridge starting...')
  
  if (await connectNats()) {
    startWebSocket()
    startHttp()
    console.log('✅ Bridge ready!')
  } else {
    process.exit(1)
  }
}

main()
