export type GamePhase = 'start' | 'playing' | 'end'

export interface MotionBody {
  id: number
  normalizedX: number
  normalizedY: number
  spreadX: number
  spreadY: number
  pixelCount: number
  active: boolean
  armsUp: boolean
}

export interface Star {
  id: string
  x: number
  y: number
  size: number
  hue: number
  spawnTime: number
  lifetime: number
  caught: boolean
  pulsePhase: number
  points: number
}

export interface DashParticle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  hue: number
  size: number
  gravity: number
}

export interface ConstellationLine {
  from: { x: number; y: number }
  to: { x: number; y: number }
  alpha: number
  life: number
}

export interface GameState {
  phase: GamePhase
  stars: Star[]
  particles: DashParticle[]
  constellationLines: ConstellationLine[]
  score: number
  streak: number
  bestStreak: number
  gameTimer: number
  gameDuration: number
  spawnTimer: number
  gameTime: number
  caughtThisFrame: boolean
}