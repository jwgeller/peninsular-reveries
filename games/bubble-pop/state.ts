import type { GameState, Bubble, PopParticle, MotionBody } from './types.js'

const SPAWN_INTERVAL_MIN = 400
const SPAWN_INTERVAL_MAX = 1200
const BUBBLE_RISE_SPEED_MIN = 0.3
const BUBBLE_RISE_SPEED_MAX = 1.2
const BUBBLE_DRIFT_SPEED = 0.3
const POP_RANGE = 80
const MAX_ACTIVE_BUBBLES = 20

const BUBBLE_HUES = [0, 30, 60, 120, 180, 210, 270, 300, 330]

function randomId(): string {
  return `b-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function randomHue(): number {
  return BUBBLE_HUES[Math.floor(Math.random() * BUBBLE_HUES.length)] + (Math.random() - 0.5) * 15
}

export function createInitialState(): GameState {
  return {
    phase: 'start',
    bubbles: [],
    particles: [],
    totalPopped: 0,
    spawnTimer: 0,
    gameTime: 0,
    maxBubbles: MAX_ACTIVE_BUBBLES,
    spawnRate: 800,
  }
}

export function startGame(state: GameState): GameState {
  return {
    ...state,
    phase: 'playing',
    bubbles: [],
    particles: [],
    totalPopped: 0,
    spawnTimer: 0,
    gameTime: 0,
  }
}

function spawnBubble(stageWidth: number, stageHeight: number): Bubble {
  const radius = 15 + Math.random() * 30
  return {
    id: randomId(),
    x: radius + Math.random() * (stageWidth - radius * 2),
    y: stageHeight + radius + 10,
    vx: (Math.random() - 0.5) * BUBBLE_DRIFT_SPEED,
    vy: -(BUBBLE_RISE_SPEED_MIN + Math.random() * (BUBBLE_RISE_SPEED_MAX - BUBBLE_RISE_SPEED_MIN)),
    radius,
    hue: randomHue(),
    wobblePhase: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.02 + Math.random() * 0.03,
    popProgress: 0,
    popping: false,
    age: 0,
    shinePhase: Math.random() * Math.PI * 2,
  }
}

export function updateGame(
  state: GameState,
  bodies: MotionBody[],
  stageWidth: number,
  stageHeight: number,
  deltaMs: number,
): GameState {
  if (state.phase !== 'playing') return state

  const dt = Math.min(deltaMs, 50) / 16.67
  const now = performance.now()
  const gameTime = state.gameTime + deltaMs

  let bubbles = [...state.bubbles]
  let particles = [...state.particles]
  let totalPopped = state.totalPopped
  let spawnTimer = state.spawnTimer + deltaMs

  // Spawn new bubbles
  if (bubbles.length < state.maxBubbles && spawnTimer > state.spawnRate) {
    // Speed up spawn rate slightly over time
    const dynamicRate = Math.max(300, state.spawnRate - gameTime * 0.005)
    spawnTimer = 0
    const newSpawnRate = SPAWN_INTERVAL_MIN + Math.random() * (SPAWN_INTERVAL_MAX - SPAWN_INTERVAL_MIN)
    bubbles.push(spawnBubble(stageWidth, stageHeight))
    state = { ...state, spawnRate: Math.min(dynamicRate, newSpawnRate) }
  }

  // Update bubbles
  const updatedBubbles: Bubble[] = []
  for (const b of bubbles) {
    if (b.popping) {
      const prog = b.popProgress + 0.08 * dt
      if (prog >= 1) continue // fully popped, remove
      updatedBubbles.push({ ...b, popProgress: prog })
      continue
    }

    const age = b.age + deltaMs
    const wobblePhase = b.wobblePhase + b.wobbleSpeed * dt
    const driftX = Math.sin(wobblePhase) * 0.5
    const x = b.x + (b.vx + driftX) * dt
    const y = b.y + b.vy * dt

    // Remove if off top
    if (y + b.radius < -50) continue

    updatedBubbles.push({
      ...b,
      x,
      y,
      age,
      wobblePhase,
    })
  }
  bubbles = updatedBubbles

  // Check pops from body collisions
  for (const body of bodies.slice(0, 4)) {
    const bx = (1 - body.normalizedX) * stageWidth
    const by = body.normalizedY * stageHeight
    const bodyRadius = Math.max(30, body.spreadX * stageWidth * 0.3)

    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i]
      if (b.popping) continue

      const dx = b.x - bx
      const dy = b.y - by
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < POP_RANGE + b.radius + bodyRadius * 0.3) {
        bubbles[i] = { ...b, popping: true, popProgress: 0 }
        totalPopped++
        particles.push(...spawnPopBurst(b.x, b.y, b.hue, b.radius))
      }
    }
  }

  // Update particles
  const updatedParticles: PopParticle[] = []
  for (const p of particles) {
    const life = p.life - dt / 16.67 * 0.025
    if (life <= 0) continue
    updatedParticles.push({
      ...p,
      x: p.x + p.vx * dt,
      y: p.y + p.vy * dt,
      vy: p.vy + p.gravity * dt,
      life,
    })
  }
  particles = updatedParticles

  return {
    ...state,
    bubbles,
    particles,
    totalPopped,
    spawnTimer,
    gameTime,
  }
}

function spawnPopBurst(x: number, y: number, hue: number, radius: number): PopParticle[] {
  const out: PopParticle[] = []
  const count = Math.floor(8 + radius * 0.3)
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 1.5 + Math.random() * 3.5
    const variation = (Math.random() - 0.5) * 30
    out.push({
      x: x + (Math.random() - 0.5) * radius * 0.5,
      y: y + (Math.random() - 0.5) * radius * 0.5,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.4 + Math.random() * 0.6,
      maxLife: 1.0,
      hue: (hue + variation + 360) % 360,
      size: 3 + Math.random() * 5,
      gravity: 0.02 + Math.random() * 0.03,
    })
  }
  // White sparkles
  for (let i = 0; i < 4; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 2 + Math.random() * 4
    out.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.2 + Math.random() * 0.3,
      maxLife: 0.5,
      hue: -1,
      size: 2 + Math.random() * 3,
      gravity: 0.015,
    })
  }
  return out
}