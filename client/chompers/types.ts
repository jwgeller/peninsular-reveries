export const DIFFICULTIES = ['counting', 'addition', 'subtraction', 'multiplication', 'division'] as const

export type Difficulty = (typeof DIFFICULTIES)[number]

export type GameMode = 'classic' | 'frenzy'

export type GamePhase = 'playing' | 'chomping' | 'feedback' | 'gameover'

export interface MathProblem {
  readonly prompt: string
  readonly correctAnswer: number
  readonly operation: string
  readonly difficulty: Difficulty
}

export interface SceneItem {
  readonly id: string
  readonly value: number
  readonly emoji: string
  readonly x: number
  readonly y: number
  readonly isCorrect: boolean
}

export interface HippoState {
  readonly x: number
  readonly y: number
  readonly targetItemId: string | null
  readonly chompPhase: 'idle' | 'extending' | 'retracting'
  readonly neckExtension: number
}

export interface GameState {
  readonly phase: GamePhase
  readonly mode: GameMode
  readonly difficulty: Difficulty
  readonly currentProblem: MathProblem
  readonly sceneItems: readonly SceneItem[]
  readonly score: number
  readonly round: number
  readonly totalRounds: number
  readonly lives: number
  readonly streak: number
  readonly bestStreak: number
  readonly hippo: HippoState
  readonly correctCount: number
  readonly rngSeed: number
}

export interface ScenePosition {
  readonly x: number
  readonly y: number
}

export const TOTAL_ROUNDS = 10
export const START_LIVES = 3

export const SCENE_ITEM_COUNTS: Record<Difficulty, number> = {
  counting: 6,
  addition: 7,
  subtraction: 7,
  multiplication: 8,
  division: 9,
}

/**
 * Static position grids for 6, 7, 8, 9 items (percentage-based x/y).
 * Arena sky zone: y 10–45%, ground zone: y 55–85%.
 * Hippo occupies the left edge; items stay at x >= 20%.
 * Each layout guarantees >= 12% x or >= 12% y separation between all peers.
 */
export const BASE_LAYOUTS: Record<number, readonly ScenePosition[]> = {
  6: [
    { x: 32, y: 15 },
    { x: 55, y: 12 },
    { x: 78, y: 18 },
    { x: 28, y: 68 },
    { x: 56, y: 62 },
    { x: 82, y: 68 },
  ],
  7: [
    { x: 26, y: 15 },
    { x: 52, y: 12 },
    { x: 78, y: 17 },
    { x: 26, y: 65 },
    { x: 47, y: 72 },
    { x: 68, y: 65 },
    { x: 88, y: 72 },
  ],
  8: [
    { x: 24, y: 16 },
    { x: 44, y: 12 },
    { x: 64, y: 18 },
    { x: 84, y: 14 },
    { x: 24, y: 72 },
    { x: 44, y: 65 },
    { x: 64, y: 72 },
    { x: 84, y: 65 },
  ],
  9: [
    { x: 24, y: 14 },
    { x: 44, y: 18 },
    { x: 64, y: 12 },
    { x: 84, y: 16 },
    { x: 22, y: 68 },
    { x: 39, y: 75 },
    { x: 57, y: 65 },
    { x: 74, y: 72 },
    { x: 88, y: 65 },
  ],
}

export const FRUIT_POOL = ['🍒', '🍎', '🍊', '🍇', '🍋', '🍑', '🍓', '🫐', '🥝', '🍌'] as const
