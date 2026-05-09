import type { GameState, Star, DashParticle, ConstellationLine, MotionBody } from './types.js'

const STAR_LIFETIME = 3500
const SPAWN_INTERVAL_BASE = 1200
const CATCH_RADIUS = 70
const GAME_DURATION = 60000
const MAX_STARS = 6

let starCounter = 0

const STAR_HUES = [45, 55, 60, 200, 270, 330, 0]

export function createInitialState(): GameState {
  return {
    phase: 'start',
    stars: [],
    particles: [],
    constellationLines: [],
    score: 0,
    streak: 0,
    bestStreak: 0,
    gameTimer: 0,
    gameDuration: GAME_DURATION,
    spawnTimer: 0,
    gameTime: 0,
    caughtThisFrame: false,
  }
}

export function startGame(state: GameState): GameState {
  starCounter = 0
  return {
    ...state,
    phase: 'playing',
    stars: [],
    particles: [],
    constellationLines: [],
    score: 0,
    streak: 0,
    bestStreak: 0,
    gameTimer: 0,
    spawnTimer: 0,
    gameTime: 0,
    caughtThisFrame: false,
  }
}

function spawnStar(stageWidth: number, stageHeight: number, gameTime: number): Star {
  const margin = 60
  const hue = STAR_HUES[Math.floor(Math.random() * STAR_HUES.length)]
  const isSpecial = Math.random() < 0.15
  return {
    id: `star-${starCounter++}`,
    x: margin + Math.random() * (stageWidth - margin * 2),
    y: margin + Math.random() * (stageHeight - margin * 2),
    size: isSpecial ? 24 : 14 + Math.random() * 10,
    hue,
    spawnTime: gameTime,
    lifetime: isSpecial ? STAR_LIFETIME * 0.7 : STAR_LIFETIME,
    caught: false,
    pulsePhase: Math.random() * Math.PI * 2,
    points: isSpecial ? 5 : 1,
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
  const gameTime = state.gameTime + deltaMs
  const gameTimer = state.gameTimer + deltaMs
  let spawnTimer = state.spawnTimer + deltaMs
  let stars = state.stars
  let particles = [...state.particles]
  let constellationLines = [...state.constellationLines]
  let score = state.score
  let streak = state.streak
  let bestStreak = state.bestStreak
  let caughtThisFrame = false

  // Time up?
  if (gameTimer >= state.gameDuration) {
    return { ...state, phase: 'end', caughtThisFrame: false }
  }

  // Dynamic spawn rate — gets faster over time
  const progressRatio = gameTimer / state.gameDuration
  const currentSpawnRate = Math.max(500, SPAWN_INTERVAL_BASE * (1 - progressRatio * 0.4))

  // Spawn new stars
  if (spawnTimer >= currentSpawnRate && stars.filter(s => !s.caught).length < MAX_STARS) {
    spawnTimer = 0
    stars = [...stars, spawnStar(stageWidth, stageHeight, gameTime)]
  }

  // Update stars
  const caughtPositions: Array<{ x: number; y: number; hue: number }> = []
  const updatedStars: Star[] = []

  for (const star of stars) {
    if (star.caught) continue

    const age = gameTime - star.spawnTime
    const fadeProgress = Math.min(1, age / star.lifetime)

    // Check catch from bodies
    let isCaught = false
    for (const body of bodies.slice(0, 4)) {
      const bx = (1 - body.normalizedX) * stageWidth
      const by = body.normalizedY * stageHeight
      const dx = star.x - bx
      const dy = star.y - by
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < CATCH_RADIUS) {
        isCaught = true
        break
      }
    }

    if (isCaught) {
      caughtThisFrame = true
      score += star.points + (streak > 3 ? streak : 0)
      streak += 1
      bestStreak = Math.max(bestStreak, streak)
      caughtPositions.push({ x: star.x, y: star.y, hue: star.hue })
      continue
    }

    // Expired — break streak
    if (fadeProgress >= 1) {
      streak = 0
      continue
    }

    updatedStars.push({
      ...star,
      pulsePhase: star.pulsePhase + 0.03 * dt,
    })
  }

  stars = updatedStars

  // Constellation lines between recently caught stars
  if (caughtPositions.length > 0) {
    const lastExisting = constellationLines.length > 0 ? constellationLines[constellationLines.length - 1] : null
    for (const pos of caughtPositions) {
      if (lastExisting) {
        constellationLines.push({
          from: lastExisting.to,
          to: { x: pos.x, y: pos.y },
          alpha: 0.8,
          life: 2000,
        })
      }
      // Add a point so next catch connects
      const lastTo = { x: pos.x, y: pos.y }
      // Will be used as "from" for next line
      const fakeFrom = lastExisting ? lastExisting.to : { x: pos.x, y: pos.y }
    }
  }

  // Update constellation lines
  constellationLines = constellationLines
    .map(l => ({ ...l, alpha: l.alpha * 0.98, life: l.life - deltaMs }))
    .filter(l => l.life > 0 && l.alpha > 0.05)

  // Spawn catch particles
  for (const pos of caughtPositions) {
    particles.push(...spawnCatchBurst(pos.x, pos.y, pos.hue))
  }

  // Update particles
  particles = particles
    .map(p => ({
      ...p,
      x: p.x + p.vx * dt,
      y: p.y + p.vy * dt,
      vy: p.vy + p.gravity * dt,
      life: p.life - dt * 0.02,
    }))
    .filter(p => p.life > 0)

  return {
    ...state,
    stars,
    particles,
    constellationLines,
    score,
    streak,
    bestStreak,
    gameTimer,
    spawnTimer,
    gameTime,
    caughtThisFrame,
  }
}

function spawnCatchBurst(x: number, y: number, hue: number): DashParticle[] {
  const out: DashParticle[] = []
  const count = 16
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 2 + Math.random() * 5
    const hueVar = (Math.random() - 0.5) * 30
    out.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.4 + Math.random() * 0.5,
      maxLife: 0.9,
      hue: (hue + hueVar + 360) % 360,
      size: 3 + Math.random() * 5,
      gravity: 0.02,
    })
  }
  // White sparkles
  for (let i = 0; i < 6; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 3 + Math.random() * 6
    out.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 0.2 + Math.random() * 0.3,
      maxLife: 0.5,
      hue: -1,
      size: 2 + Math.random() * 3,
      gravity: 0.01,
    })
  }
  return out
}