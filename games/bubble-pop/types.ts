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

export interface Bubble {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  hue: number
  wobblePhase: number
  wobbleSpeed: number
  popProgress: number
  popping: boolean
  age: number
  shinePhase: number
}

export interface PopParticle {
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
  bubbles: Bubble[]
  particles: PopParticle[]
  totalPopped: number
  spawnTimer: number
  gameTime: number
  maxBubbles: number
  spawnRate: number
}