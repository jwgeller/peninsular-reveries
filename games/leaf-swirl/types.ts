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

export interface Leaf {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  rotationSpeed: number
  scale: number
  hue: number
  shape: number
  settleProgress: number
  settled: boolean
}

export interface WindParticle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  alpha: number
}

export interface GameState {
  phase: GamePhase
  leaves: Leaf[]
  windParticles: WindParticle[]
  totalSwirled: number
  spawnTimer: number
  gameTime: number
  windStrength: number
  windAngle: number
}