import type { GameState, ColorTarget, ReachParticle, MotionZone } from './types.js'

// Color names & hues
const COLORS: Array<{ hue: number; name: string }> = [
  { hue: 0, name: 'Red' },
  { hue: 30, name: 'Orange' },
  { hue: 55, name: 'Yellow' },
  { hue: 120, name: 'Green' },
  { hue: 200, name: 'Blue' },
  { hue: 280, name: 'Purple' },
  { hue: 330, name: 'Pink' },
]

const REACH_DISTANCE = 100
const TARGET_LIFETIME = 4000
const SPAWN_INTERVAL = 2500

let targetIdCounter = 0

export function createInitialState(): GameState {
  return {
    phase: 'start',
    targets: [],
    particles: [],
    score: 0,
    round: 0,
    streak: 0,
    bestStreak: 0,
    currentHue: 0,
    currentColorName: 'Red',
    spawnTimer: 0,
    gameTime: 0,
    targetReachedThisFrame: false,
  }
}

export function startGame(state: GameState): GameState {
  targetIdCounter = 0
  const firstColor = COLORS[0]
  return {
    ...state,
    phase: 'playing',
    targets: [],
    particles: [],
    score: 0,
    round: 1,
    streak: 0,
    bestStreak: 0,
    currentHue: firstColor.hue,
    currentColorName: firstColor.name,
    spawnTimer: 0,
    gameTime: 0,
    targetReachedThisFrame: false,
  }
}

export function updateGame(
  state: GameState,
  zones: MotionZone[],
  stageWidth: number,
  stageHeight: number,
  deltaMs: number,
): GameState {
  if (state.phase !== 'playing') return state

  const dt = Math.min(deltaMs, 50) / 16.67
  const gameTime = state.gameTime + deltaMs
  let spawnTimer = state.spawnTimer + deltaMs
  let targets = [...state.targets]
  let particles = [...state.particles]
  let score = state.score
  let streak = state.streak
  let bestStreak = state.bestStreak
  let targetReachedThisFrame = false

  // Spawn new target zones
  if (spawnTimer >= SPAWN_INTERVAL || targets.length === 0) {
    spawnTimer = 0
    // Pick random color, avoiding current
    let colorIdx: number
    do {
      colorIdx = Math.floor(Math.random() * COLORS.length)
    } while (COLORS[colorIdx].hue === state.currentHue && COLORS.length > 1)

    const color = COLORS[colorIdx]
    const margin = 80
    const zoneX = margin + Math.random() * (stageWidth - margin * 2)
    const zoneY = margin + Math.random() * (stageHeight - margin * 2)

    targets.push({
      id: `target-${targetIdCounter++}`,
      hue: color.hue,
      zoneX,
      zoneY,
      zoneRadius: 60,
      colorName: color.name,
      spawnTime: gameTime,
      lifetime: TARGET_LIFETIME,
      reached: false,
      fadeProgress: 0,
    })
  }

  // Update targets - check for reaching
  const updatedTargets: ColorTarget[] = []
  for (const t of targets) {
    if (t.reached) continue

    const age = gameTime - t.spawnTime
    const fadeProgress = Math.min(1, age / t.lifetime)

    // Check if any motion zone reaches this target
    let reached = false
    for (const zone of zones.slice(0, 4)) {
      if (!zone.active) continue
      const zx = zone.normalizedX * stageWidth
      const zy = zone.normalizedY * stageHeight
      const dx = t.zoneX - zx
      const dy = t.zoneY - zy
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < REACH_DISTANCE + t.zoneRadius * 0.3) {
        reached = true
        break
      }
    }

    if (reached) {
      targetReachedThisFrame = true
      score += 10 + streak * 2
      streak += 1
      bestStreak = Math.max(bestStreak, streak)
      particles.push(...spawnReachBurst(t.zoneX, t.zoneY, t.hue))
      continue // Remove reached target
    }

    // Expired target — break streak
    if (fadeProgress >= 1) {
      streak = 0
      continue
    }

    updatedTargets.push({ ...t, fadeProgress })
  }
  targets = updatedTargets

  // Set current target color (latest active target's color)
  const currentTarget = targets[0]
  const currentHue = currentTarget ? currentTarget.hue : state.currentHue
  const currentColorName = currentTarget ? currentTarget.colorName : state.currentColorName

  // Update particles
  const updatedParticles: ReachParticle[] = []
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
    targets,
    particles,
    score,
    streak,
    bestStreak,
    currentHue,
    currentColorName,
    spawnTimer,
    gameTime,
    targetReachedThisFrame,
  }
}

function spawnReachBurst(x: number, y: number, hue: number): ReachParticle[] {
  const out: ReachParticle[] = []
  const count = 20
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 2 + Math.random() * 5
    const hueVar = (Math.random() - 0.5) * 30
    out.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.4 + Math.random() * 0.5,
      maxLife: 0.9,
      hue: (hue + hueVar + 360) % 360,
      size: 4 + Math.random() * 6,
      gravity: 0.02 + Math.random() * 0.03,
    })
  }
  for (let i = 0; i < 5; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 3 + Math.random() * 4
    out.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 0.3 + Math.random() * 0.3,
      maxLife: 0.6,
      hue: -1,
      size: 3 + Math.random() * 4,
      gravity: 0.01,
    })
  }
  return out
}