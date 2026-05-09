import type { GameState, JellyPoint, SquishParticle, MotionBody } from './types.js'

export const GRID_SIZE = 5
export const SPRING_K = 0.08
const DAMPING = 0.92
const SPREAD_FACTOR = 0.15
const INFLUENCE_RADIUS = 180

export function createInitialState(): GameState {
  return {
    phase: 'start',
    jelly: [],
    particles: [],
    wobbleScore: 0,
    gameTime: 0,
    lastWobbleTime: 0,
    peakWobble: 0,
    jellyHue: 280,
  }
}

export function startGame(state: GameState, stageWidth: number, stageHeight: number): GameState {
  return {
    ...state,
    phase: 'playing',
    jelly: createJellyGrid(stageWidth / 2, stageHeight / 2, 150, 100),
    particles: [],
    wobbleScore: 0,
    gameTime: 0,
    lastWobbleTime: 0,
    peakWobble: 0,
    jellyHue: 280 + Math.random() * 60,
  }
}

function createJellyGrid(centerX: number, centerY: number, width: number, height: number): JellyPoint[] {
  const points: JellyPoint[] = []
  const cols = GRID_SIZE
  const rows = GRID_SIZE
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const restX = centerX - width / 2 + (c / (cols - 1)) * width
      const restY = centerY - height / 2 + (r / (rows - 1)) * height
      points.push({
        x: restX,
        y: restY,
        vx: 0,
        vy: 0,
        restX,
        restY,
      })
    }
  }
  return points
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
  let jelly = state.jelly.map(p => ({ ...p }))
  let particles = [...state.particles]
  let wobbleScore = state.wobbleScore
  let peakWobble = state.peakWobble

  if (jelly.length === 0) {
    jelly = createJellyGrid(stageWidth / 2, stageHeight / 2, 150, 100)
  }

  // Apply body influence
  for (const body of bodies.slice(0, 4)) {
    const bx = (1 - body.normalizedX) * stageWidth
    const by = body.normalizedY * stageHeight
    const bodyRadius = 80 + body.spreadX * stageWidth * 0.2

    for (const point of jelly) {
      const dx = point.x - bx
      const dy = point.y - by
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < INFLUENCE_RADIUS) {
        const force = (1 - dist / INFLUENCE_RADIUS) * SPREAD_FACTOR * dt
        point.vx += (dx / Math.max(dist, 1)) * force * 20
        point.vy += (dy / Math.max(dist, 1)) * force * 20
      }
    }
  }

  // Spring physics for each point
  let totalDisplacement = 0
  for (const point of jelly) {
    const dx = point.restX - point.x
    const dy = point.restY - point.y
    totalDisplacement += Math.sqrt(dx * dx + dy * dy)

    point.vx += dx * SPRING_K * dt
    point.vy += dy * SPRING_K * dt
    point.vx *= DAMPING
    point.vy *= DAMPING
    point.x += point.vx * dt
    point.y += point.vy * dt
  }

  // Track wobble score
  const avgDisplacement = totalDisplacement / jelly.length
  peakWobble = Math.max(peakWobble, avgDisplacement)
  if (avgDisplacement > 5 && gameTime - state.lastWobbleTime > 200) {
    wobbleScore += Math.floor(avgDisplacement * 0.5)
  }

  // Spawn squish particles when wobble is high
  if (avgDisplacement > 15 && Math.random() < 0.3) {
    const srcPoint = jelly[Math.floor(Math.random() * jelly.length)]
    particles.push(...spawnSquishParticle(srcPoint.x, srcPoint.y, state.jellyHue))
  }

  // Hue shifts from wobble intensity
  let jellyHue = state.jellyHue
  if (avgDisplacement > 20) {
    jellyHue = (jellyHue + avgDisplacement * 0.05) % 360
  }

  // Update particles
  const updatedParticles: SquishParticle[] = []
  for (const p of particles) {
    const life = p.life - dt * 0.025
    if (life <= 0) continue
    updatedParticles.push({
      ...p,
      x: p.x + p.vx * dt,
      y: p.y + p.vy * dt,
      vy: p.vy + p.gravity * dt,
      life,
    })
  }

  return {
    ...state,
    jelly,
    particles: updatedParticles,
    wobbleScore,
    gameTime,
    lastWobbleTime: gameTime,
    peakWobble,
    jellyHue,
  }
}

function spawnSquishParticle(x: number, y: number, hue: number): SquishParticle[] {
  const count = 2 + Math.floor(Math.random() * 3)
  const out: SquishParticle[] = []
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 1 + Math.random() * 3
    const hueVar = (Math.random() - 0.5) * 40
    const h = ((hue + hueVar) % 360 + 360) % 360
    const color = hueToHex(h)
    out.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.3 + Math.random() * 0.4,
      maxLife: 0.7,
      color,
      size: 3 + Math.random() * 4,
      gravity: 0.03,
    })
  }
  return out
}

function hueToHex(hue: number): number {
  const h = ((hue % 360) + 360) % 360
  const s = 0.8, l = 0.65
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  return (Math.round((r + m) * 255) << 16) | (Math.round((g + m) * 255) << 8) | Math.round((b + m) * 255)
}