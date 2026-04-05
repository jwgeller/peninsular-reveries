import type { Difficulty, GameMode, GameState, HippoState } from './types.js'
import { START_LIVES, TOTAL_ROUNDS } from './types.js'
import { buildSceneItems, generateProblem } from './problems.js'

const POINTS_FOR_DIFFICULTY: Record<Difficulty, number> = {
  counting: 5,
  addition: 10,
  subtraction: 10,
  multiplication: 15,
  division: 20,
}

function createHippo(): HippoState {
  return {
    x: 8,
    y: 70,
    targetItemId: null,
    chompPhase: 'idle',
    neckExtension: 0,
  }
}

export function createInitialState(mode: GameMode, difficulty: Difficulty, seed: number): GameState {
  let rng = seed
  const problemResult = generateProblem(difficulty, rng)
  rng = problemResult.rng
  const sceneResult = buildSceneItems(problemResult.problem, difficulty, rng)
  rng = sceneResult.rng

  return {
    phase: 'playing',
    mode,
    difficulty,
    currentProblem: problemResult.problem,
    sceneItems: sceneResult.items,
    score: 0,
    round: 1,
    totalRounds: TOTAL_ROUNDS,
    lives: START_LIVES,
    streak: 0,
    bestStreak: 0,
    hippo: createHippo(),
    correctCount: 0,
    rngSeed: rng,
  }
}

/** Set the player's chosen item and begin the chomp animation phase. */
export function selectAnswer(state: GameState, itemId: string): GameState {
  return {
    ...state,
    phase: 'chomping',
    hippo: {
      ...state.hippo,
      targetItemId: itemId,
    },
  }
}

/** Evaluate the chomped item and transition to feedback phase. */
export function resolveChomp(state: GameState): GameState {
  const targetItem = state.sceneItems.find((item) => item.id === state.hippo.targetItemId)

  if (!targetItem) {
    return state
  }

  const remainingItems = state.sceneItems.filter((item) => item.id !== targetItem.id)
  const resetHippo: HippoState = {
    ...state.hippo,
    targetItemId: null,
    chompPhase: 'idle',
    neckExtension: 0,
  }

  if (targetItem.isCorrect) {
    const points = POINTS_FOR_DIFFICULTY[state.difficulty]
    const streak = state.streak + 1
    return {
      ...state,
      phase: 'feedback',
      score: state.score + points,
      streak,
      bestStreak: Math.max(state.bestStreak, streak),
      correctCount: state.correctCount + 1,
      sceneItems: remainingItems,
      hippo: resetHippo,
    }
  }

  return {
    ...state,
    phase: 'feedback',
    lives: Math.max(0, state.lives - 1),
    streak: 0,
    sceneItems: remainingItems,
    hippo: resetHippo,
  }
}

/** Advance to the next round, or end the game if all rounds or lives are exhausted. */
export function advanceRound(state: GameState): GameState {
  const bestStreak = Math.max(state.bestStreak, state.streak)

  if (state.round >= state.totalRounds || state.lives <= 0) {
    return {
      ...state,
      bestStreak,
      phase: 'gameover',
    }
  }

  let rng = state.rngSeed
  const problemResult = generateProblem(state.difficulty, rng)
  rng = problemResult.rng
  const sceneResult = buildSceneItems(problemResult.problem, state.difficulty, rng)
  rng = sceneResult.rng

  return {
    ...state,
    phase: 'playing',
    round: state.round + 1,
    bestStreak,
    currentProblem: problemResult.problem,
    sceneItems: sceneResult.items,
    hippo: createHippo(),
    rngSeed: rng,
  }
}

/** Restart from the same mode, difficulty, and original seed. */
export function resetGame(state: GameState): GameState {
  return createInitialState(state.mode, state.difficulty, state.rngSeed)
}

export function isGameOver(state: GameState): boolean {
  return state.phase === 'gameover'
}

