export type GamePhase = 'start' | 'playing' | 'end'

export interface MotionZone {
  id: number
  normalizedX: number
  normalizedY: number
  spreadX: number
  spreadY: number
  pixelCount: number
  active: boolean
  velocityY: number
}

export interface ColorTarget {
  id: string
  hue: number
  zoneX: number
  zoneY: number
  zoneRadius: number
  colorName: string
  spawnTime: number
  lifetime: number
  reached: boolean
  fadeProgress: number
}

export interface ReachParticle {
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

export interface GameState {
  phase: GamePhase
  targets: ColorTarget[]
  particles: ReachParticle[]
  score: number
  round: number
  streak: number
  bestStreak: number
  currentHue: number
  currentColorName: string
  spawnTimer: number
  gameTime: number
  targetReachedThisFrame: boolean
}