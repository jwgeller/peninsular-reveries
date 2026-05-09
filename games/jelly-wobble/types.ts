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

export interface JellyPoint {
  x: number
  y: number
  vx: number
  vy: number
  restX: number
  restY: number
}

export interface SquishParticle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: number
  size: number
  gravity: number
}

export interface GameState {
  phase: GamePhase
  jelly: JellyPoint[]
  particles: SquishParticle[]
  wobbleScore: number
  gameTime: number
  lastWobbleTime: number
  peakWobble: number
  jellyHue: number
}