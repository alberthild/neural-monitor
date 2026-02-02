import React, { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'

// Agent configuration - INNER RING
const AGENT_CONFIG = {
  main: { 
    name: 'Claudia', 
    emoji: '🛡️', 
    color: '#6366f1',
    description: 'Chief of Staff'
  },
  'mondo-assistant': { 
    name: 'Mona', 
    emoji: '🌙', 
    color: '#8b5cf6',
    description: 'Mondo Gate Business'
  },
  vera: { 
    name: 'Vera', 
    emoji: '🔒', 
    color: '#ef4444',
    description: 'Security & Compliance'
  },
  stella: { 
    name: 'Stella', 
    emoji: '💰', 
    color: '#f59e0b',
    description: 'Business Development'
  },
  viola: { 
    name: 'Viola', 
    emoji: '⚙️', 
    color: '#10b981',
    description: 'Operations & Infra'
  }
}

// Event category configuration - OUTER RING
const CATEGORY_CONFIG = {
  message: { 
    label: '💬 Messages', 
    color: '#22d3ee', 
    description: 'Conversation messages'
  },
  tool: { 
    label: '🔧 Tools', 
    color: '#a78bfa', 
    description: 'Tool calls & results'
  },
  knowledge: { 
    label: '🧠 Knowledge', 
    color: '#34d399', 
    description: 'Facts & memories'
  },
  lifecycle: { 
    label: '⚡ Lifecycle', 
    color: '#f472b6', 
    description: 'Session events'
  }
}

// Calculate positions in a ring
function ringPosition(index, total, radius, yOffset = 0) {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2
  return [
    Math.cos(angle) * radius,
    yOffset,
    Math.sin(angle) * radius
  ]
}

// Glowing energy beam with multiple particles
function GlowBeam({ from, to, color, intensity = 1, particleCount = 3 }) {
  const groupRef = useRef()
  const particlesRef = useRef([])
  const glowRef = useRef()
  
  // Create curved path points
  const curve = useMemo(() => {
    const mid = [
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2 + 0.4, // Arc upward
      (from[2] + to[2]) / 2
    ]
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...from),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...to)
    )
  }, [from, to])
  
  // Get points along curve for the beam
  const tubePoints = useMemo(() => curve.getPoints(20), [curve])
  
  useFrame((state) => {
    const time = state.clock.elapsedTime
    
    // Animate particles along the beam
    particlesRef.current.forEach((particle, i) => {
      if (particle) {
        const offset = i / particleCount
        const t = ((time * 0.8 + offset) % 1)
        const pos = curve.getPoint(t)
        particle.position.copy(pos)
        
        // Pulse size
        const pulse = 0.8 + Math.sin(time * 8 + i * 2) * 0.3
        particle.scale.setScalar(pulse)
      }
    })
    
    // Pulse the glow
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.15 + Math.sin(time * 4) * 0.1
    }
  })
  
  if (intensity <= 0) return null
  
  return (
    <group ref={groupRef}>
      {/* Outer glow tube */}
      <mesh ref={glowRef}>
        <tubeGeometry args={[curve, 20, 0.08, 8, false]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Inner bright core */}
      <mesh>
        <tubeGeometry args={[curve, 20, 0.02, 8, false]} />
        <meshBasicMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.8}
        />
      </mesh>
      
      {/* Traveling particles with glow */}
      {Array.from({ length: particleCount }).map((_, i) => (
        <group key={i} ref={el => particlesRef.current[i] = el}>
          {/* Outer glow */}
          <mesh>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial 
              color={color} 
              transparent 
              opacity={0.4}
            />
          </mesh>
          {/* Inner bright core */}
          <mesh>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// Beam from Agent to Event Type (when agent uses that type)
function ActivityBeam({ from, to, color, active }) {
  const beamRef = useRef()
  const particleRef = useRef()
  
  const curve = useMemo(() => {
    const mid = [
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2 + 0.2,
      (from[2] + to[2]) / 2
    ]
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...from),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...to)
    )
  }, [from, to])
  
  useFrame((state) => {
    if (!active || !particleRef.current) return
    const t = (state.clock.elapsedTime * 1.5) % 1
    const pos = curve.getPoint(t)
    particleRef.current.position.copy(pos)
    particleRef.current.scale.setScalar(0.6 + Math.sin(state.clock.elapsedTime * 10) * 0.2)
  })
  
  if (!active) return null
  
  return (
    <group>
      {/* Faint beam line */}
      <mesh>
        <tubeGeometry args={[curve, 12, 0.015, 6, false]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
      
      {/* Single fast particle */}
      <group ref={particleRef}>
        <mesh>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>
    </group>
  )
}

// Legacy wrapper for compatibility
function AgentBeam({ from, to, color, intensity, label }) {
  return <GlowBeam from={from} to={to} color={color} intensity={intensity} particleCount={3} />
}

// Agent node (inner ring)
function AgentNode({ id, config, position, stats, isActive, onClick, activeConnections }) {
  const groupRef = useRef()
  const glowRef = useRef()
  const [hovered, setHovered] = useState(false)
  
  const eventCount = stats?.messages || 0
  const scale = 0.6 + Math.min(eventCount / 5000, 0.4)
  
  useFrame((state) => {
    if (groupRef.current) {
      // Gentle floating
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5 + id.length) * 0.08
      
      // Pulse when active
      if (glowRef.current && isActive) {
        glowRef.current.scale.setScalar(1.3 + Math.sin(state.clock.elapsedTime * 8) * 0.2)
      }
    }
  })

  const hasConnections = activeConnections?.length > 0
  
  return (
    <group 
      ref={groupRef} 
      position={position}
      onClick={(e) => { e.stopPropagation(); onClick?.(id) }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Outer glow */}
      <mesh ref={glowRef} scale={isActive ? 1.5 : 1.1}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshBasicMaterial 
          color={config.color} 
          transparent 
          opacity={isActive ? 0.4 : (hasConnections ? 0.25 : 0.1)}
        />
      </mesh>
      
      {/* Main sphere */}
      <mesh scale={scale}>
        <sphereGeometry args={[0.28, 32, 32]} />
        <meshStandardMaterial 
          color={config.color}
          emissive={config.color}
          emissiveIntensity={hovered ? 0.9 : (isActive ? 0.7 : 0.4)}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>
      
      {/* Inner core */}
      <mesh scale={scale * 0.4}>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshBasicMaterial color="white" transparent opacity={0.85} />
      </mesh>
      
      {/* Emoji + Name label */}
      <Html position={[0, 0.6, 0]} center distanceFactor={8}>
        <div 
          className={`whitespace-nowrap px-2 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
            hovered ? 'scale-110' : ''
          }`}
          style={{ 
            background: `linear-gradient(135deg, ${config.color}40, ${config.color}20)`,
            border: `1px solid ${config.color}60`,
            color: config.color,
            backdropFilter: 'blur(8px)'
          }}
        >
          {config.emoji} {config.name}
        </div>
      </Html>
      
      {/* Event count badge */}
      <Html position={[0, -0.5, 0]} center distanceFactor={8}>
        <div 
          className="px-2 py-0.5 rounded-full text-xs font-bold"
          style={{ 
            background: eventCount > 0 ? config.color : '#333',
            color: eventCount > 0 ? '#000' : '#666'
          }}
        >
          {eventCount.toLocaleString()}
        </div>
      </Html>
      
      {/* Hover description */}
      {hovered && (
        <Html position={[0, -0.85, 0]} center distanceFactor={8}>
          <div className="text-xs text-gray-400 whitespace-nowrap">
            {config.description}
          </div>
        </Html>
      )}
    </group>
  )
}

// Category node (outer ring)
function CategoryNode({ type, config, position, count, isActive }) {
  const groupRef = useRef()
  const [hovered, setHovered] = useState(false)
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.3 + type.length * 2) * 0.05
    }
  })
  
  return (
    <group ref={groupRef} position={position}>
      {/* Glow */}
      <mesh scale={isActive ? 1.4 : 1}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshBasicMaterial 
          color={config.color} 
          transparent 
          opacity={isActive ? 0.35 : 0.15}
        />
      </mesh>
      
      {/* Main sphere */}
      <mesh 
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial 
          color={config.color}
          emissive={config.color}
          emissiveIntensity={hovered ? 0.8 : 0.5}
          metalness={0.3}
          roughness={0.5}
        />
      </mesh>
      
      {/* Label */}
      <Html position={[0, 0.4, 0]} center distanceFactor={10}>
        <div 
          className={`whitespace-nowrap px-2 py-0.5 rounded text-xs transition-all ${hovered ? 'scale-105' : ''}`}
          style={{ 
            background: `${config.color}25`,
            color: config.color,
            border: `1px solid ${config.color}40`
          }}
        >
          {config.label}
        </div>
      </Html>
      
      {/* Count */}
      <Html position={[0, -0.35, 0]} center distanceFactor={10}>
        <div 
          className="text-xs font-mono"
          style={{ color: config.color, opacity: 0.8 }}
        >
          {(count || 0).toLocaleString()}
        </div>
      </Html>
    </group>
  )
}

// Core hub (center)
function CoreHub({ totalEvents }) {
  const meshRef = useRef()
  const ringsRef = useRef()
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.15
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.z = state.clock.elapsedTime * 0.25
    }
  })
  
  return (
    <group>
      {/* Core icosahedron */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.2, 1]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#8b5cf6"
          emissiveIntensity={0.6}
          metalness={0.9}
          roughness={0.1}
          wireframe
        />
      </mesh>
      
      {/* Inner glow */}
      <mesh>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.6} />
      </mesh>
      
      {/* Orbital rings */}
      <group ref={ringsRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.4, 0.015, 16, 64]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.4} />
        </mesh>
        <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
          <torusGeometry args={[0.5, 0.01, 16, 64]} />
          <meshBasicMaterial color="#a78bfa" transparent opacity={0.3} />
        </mesh>
      </group>
      
      {/* Total label */}
      <Html position={[0, -0.5, 0]} center distanceFactor={8}>
        <div className="text-center">
          <div className="text-[9px] text-violet-300 font-mono opacity-60">
            TOTAL EVENTS
          </div>
          <div 
            className="px-2 py-0.5 rounded-full text-sm font-bold"
            style={{ 
              background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
              color: '#fff'
            }}
          >
            {totalEvents.toLocaleString()}
          </div>
        </div>
      </Html>
    </group>
  )
}

// Ambient particles
function AmbientParticles() {
  const particlesRef = useRef()
  
  const particles = useMemo(() => {
    const positions = new Float32Array(80 * 3)
    for (let i = 0; i < 80; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12
    }
    return positions
  }, [])
  
  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.015
    }
  })
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={80}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.025} color="#8b5cf6" transparent opacity={0.25} />
    </points>
  )
}

// Connection lines from agents to core
function AgentConnections({ agentPositions, activeAgents }) {
  return (
    <group>
      {Object.entries(agentPositions).map(([id, pos]) => {
        const isActive = activeAgents?.includes(id)
        const config = AGENT_CONFIG[id]
        return (
          <line key={id}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([0, 0, 0, ...pos])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial 
              color={config?.color || '#666'} 
              transparent 
              opacity={isActive ? 0.5 : 0.15}
            />
          </line>
        )
      })}
    </group>
  )
}

// Main component
export default function NeuralViz({ events, nodeStats, historicCounts, subCategories, agentStats, onNodeClick }) {
  const [activeBeams, setActiveBeams] = useState([])
  const [activeAgents, setActiveAgents] = useState([])
  
  // Calculate total events = sum of all agent events
  const totalEvents = useMemo(() => {
    const agentTotal = Object.values(agentStats || {}).reduce((sum, agent) => sum + (agent.messages || 0), 0)
    return agentTotal || Object.values(historicCounts || {}).reduce((a, b) => a + b, 0)
  }, [agentStats, historicCounts])
  
  // Calculate agent positions (inner ring)
  const agentPositions = useMemo(() => {
    const agents = Object.keys(AGENT_CONFIG)
    const positions = {}
    agents.forEach((id, i) => {
      positions[id] = ringPosition(i, agents.length, 1.8)
    })
    return positions
  }, [])
  
  // Calculate category positions (outer ring)
  const categoryPositions = useMemo(() => {
    const categories = Object.keys(CATEGORY_CONFIG)
    const positions = {}
    categories.forEach((type, i) => {
      positions[type] = ringPosition(i, categories.length, 3.5, 0.5)
    })
    return positions
  }, [])
  
  // Watch for inter-agent events (sessions_send, etc.)
  useEffect(() => {
    if (!events || events.length === 0) return
    
    const latest = events[0]
    if (!latest) return
    
    // Detect inter-agent communication
    const subject = latest.subject || ''
    const data = latest.data || {}
    
    // Check for sessions_send tool calls
    if (subject.includes('tool') && data?.payload?.data?.name === 'sessions_send') {
      const args = data?.payload?.data?.args || {}
      const fromAgent = data?.payload?.agent || 'main'
      const toAgent = args.sessionKey || args.label || 'unknown'
      
      // Map session keys to agent IDs
      const agentMap = {
        'mondo-assistant': 'mondo-assistant',
        'mona': 'mondo-assistant',
        'vera': 'vera',
        'stella': 'stella',
        'viola': 'viola',
        'main': 'main'
      }
      
      const toId = Object.keys(agentMap).find(k => toAgent.toLowerCase().includes(k)) 
        ? agentMap[Object.keys(agentMap).find(k => toAgent.toLowerCase().includes(k))]
        : null
      
      if (toId && agentPositions[fromAgent] && agentPositions[toId]) {
        const beam = {
          id: Date.now(),
          from: fromAgent,
          to: toId,
          label: `${AGENT_CONFIG[fromAgent]?.emoji || '?'} → ${AGENT_CONFIG[toId]?.emoji || '?'}`
        }
        setActiveBeams(prev => [...prev, beam])
        setActiveAgents(prev => [...new Set([...prev, fromAgent, toId])])
        
        // Clear beam after 3 seconds
        setTimeout(() => {
          setActiveBeams(prev => prev.filter(b => b.id !== beam.id))
        }, 3000)
        
        // Clear active agents after 5 seconds
        setTimeout(() => {
          setActiveAgents(prev => prev.filter(a => a !== fromAgent && a !== toId))
        }, 5000)
      }
    }
    
    // Also detect by agent field changes in messages
    const agent = data?.payload?.agent
    if (agent && AGENT_CONFIG[agent]) {
      setActiveAgents(prev => {
        if (prev.includes(agent)) return prev
        setTimeout(() => {
          setActiveAgents(p => p.filter(a => a !== agent))
        }, 3000)
        return [...prev, agent]
      })
    }
  }, [events, agentPositions])
  
  return (
    <div className="w-full h-full relative">
      
      {/* Active communications indicator */}
      {activeBeams.length > 0 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
          <div className="px-4 py-2 rounded-full bg-violet-500/20 border border-violet-500/40 text-violet-300 text-sm animate-pulse">
            🔗 {activeBeams.map(b => b.label).join(' • ')}
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <div className="absolute bottom-4 left-4 z-10 text-xs text-gray-500">
        🖱️ Drag to rotate • Scroll to zoom • Watch for agent communication beams
      </div>
      
      <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
        <color attach="background" args={['#030014']} />
        
        {/* Lighting */}
        <ambientLight intensity={0.35} />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#22d3ee" />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#a78bfa" />
        <pointLight position={[0, 10, 0]} intensity={0.2} color="#34d399" />
        
        {/* Scene */}
        <AmbientParticles />
        
        {/* Core */}
        <CoreHub totalEvents={totalEvents} />
        
        {/* Agent connections to core */}
        <AgentConnections agentPositions={agentPositions} activeAgents={activeAgents} />
        
        {/* Inter-agent beams */}
        {activeBeams.map(beam => (
          <AgentBeam
            key={beam.id}
            from={agentPositions[beam.from]}
            to={agentPositions[beam.to]}
            color={AGENT_CONFIG[beam.from]?.color || '#fff'}
            intensity={1}
            label={beam.label}
          />
        ))}
        
        {/* Activity beams: Agent → Event Type (based on recent events) */}
        {(() => {
          // Find active agent→type combinations from recent events
          const activeFlows = new Map() // key: "agent-type", value: { agent, type, color }
          const now = Date.now()
          
          events.slice(0, 20).forEach(event => {
            const eventAge = now - new Date(event.timestamp).getTime()
            if (eventAge > 5000) return // Only last 5 seconds
            
            // Get agent: prefer explicit agent field, fallback to subject parsing
            const explicitAgent = event.agent
            const subjectParts = (event.subject || '').split('.')
            const agentFromSubject = subjectParts[2] || 'main'
            
            // Use explicit agent first, then subject, skip type-like values
            const agent = explicitAgent || 
              (agentFromSubject !== 'conversation' && 
               agentFromSubject !== 'knowledge' && 
               agentFromSubject !== 'lifecycle' 
                ? agentFromSubject 
                : 'main')
            
            const type = event.type
            
            // Map agent names to our IDs
            const agentId = agent === 'mondo-assistant' ? 'mondo-assistant' :
                           agent === 'mona' ? 'mondo-assistant' :
                           agent === 'vera' ? 'vera' :
                           agent === 'stella' ? 'stella' :
                           agent === 'viola' ? 'viola' :
                           agent === 'main' ? 'main' :
                           agent === 'claudia' ? 'main' : // claudia = main
                           agent === 'agent' ? 'main' : // subagent default
                           agent === 'unknown' ? 'main' : // unknown = main
                           'main'
            
            if (type && CATEGORY_CONFIG[type] && agentPositions[agentId]) {
              const key = `${agentId}-${type}`
              if (!activeFlows.has(key)) {
                activeFlows.set(key, { agent: agentId, type, color: CATEGORY_CONFIG[type].color })
              }
            }
          })
          
          return Array.from(activeFlows.values()).map(flow => {
            const fromPos = agentPositions[flow.agent]
            const toPos = categoryPositions[flow.type]
            if (!fromPos || !toPos) return null
            
            return (
              <ActivityBeam
                key={`activity-${flow.agent}-${flow.type}`}
                from={fromPos}
                to={toPos}
                color={flow.color}
                active={true}
              />
            )
          })
        })()}
        
        {/* Agent nodes (inner ring) */}
        {Object.entries(AGENT_CONFIG).map(([id, config]) => (
          <AgentNode
            key={id}
            id={id}
            config={config}
            position={agentPositions[id]}
            stats={agentStats?.[id]}
            isActive={activeAgents.includes(id)}
            onClick={onNodeClick}
            activeConnections={activeBeams.filter(b => b.from === id || b.to === id)}
          />
        ))}
        
        {/* Category nodes (outer ring) */}
        {Object.entries(CATEGORY_CONFIG).map(([type, config]) => (
          <CategoryNode
            key={type}
            type={type}
            config={config}
            position={categoryPositions[type]}
            count={historicCounts?.[type] || 0}
            isActive={nodeStats?.[type]?.lastActive && (Date.now() - nodeStats[type].lastActive) < 2000}
          />
        ))}
        
        <OrbitControls
          enablePan={false}
          minDistance={5}
          maxDistance={15}
          autoRotate
          autoRotateSpeed={0.2}
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI * 0.75}
          minPolarAngle={Math.PI * 0.25}
        />
      </Canvas>
    </div>
  )
}
