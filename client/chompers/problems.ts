import type { Difficulty, MathProblem, SceneItem } from './types.js'
import { BASE_LAYOUTS, FRUIT_POOL, SCENE_ITEM_COUNTS } from './types.js'

/** LCG next seed (multiplier 1664525, increment 1013904223, modulus 2^32). */
export function nextRng(seed: number): number {
  return (seed * 1_664_525 + 1_013_904_223) >>> 0
}

/** Return a random integer in [min, max] inclusive and the resulting RNG state. */
export function rngRange(seed: number, min: number, max: number): { value: number; rng: number } {
  const rng = nextRng(seed)
  const range = max - min + 1
  const value = min + (rng % range)
  return { value, rng }
}

/** Range used for random distractor fill per difficulty. */
const DISTRACTOR_RANGES: Record<Difficulty, readonly [number, number]> = {
  counting: [1, 20],
  addition: [1, 20],
  subtraction: [1, 20],
  multiplication: [4, 81],
  division: [2, 12],
}

function generateDistractors(
  correctAnswer: number,
  difficulty: Difficulty,
  count: number,
  rng: number,
): { distractors: number[]; rng: number } {
  const used = new Set([correctAnswer])
  const distractors: number[] = []

  // Produce nearby (off-by-one to off-by-five) candidates
  const nearby: number[] = []
  for (let offset = 1; offset <= 5; offset++) {
    const above = correctAnswer + offset
    const below = correctAnswer - offset
    if (above > 0) nearby.push(above)
    if (below > 0) nearby.push(below)
  }

  // Shuffle the nearby list with LCG so distractors vary across rounds
  for (let i = nearby.length - 1; i > 0; i--) {
    const r = rngRange(rng, 0, i)
    rng = r.rng
    const j = r.value
    ;[nearby[i], nearby[j]] = [nearby[j], nearby[i]]
  }

  for (const candidate of nearby) {
    if (distractors.length >= count) break
    if (!used.has(candidate)) {
      used.add(candidate)
      distractors.push(candidate)
    }
  }

  // Fill remaining slots with random values in the difficulty range
  const [lo, hi] = DISTRACTOR_RANGES[difficulty]
  let attempts = 0
  while (distractors.length < count && attempts < 100) {
    attempts++
    const r = rngRange(rng, lo, hi)
    rng = r.rng
    if (!used.has(r.value)) {
      used.add(r.value)
      distractors.push(r.value)
    }
  }

  return { distractors, rng }
}

/** Generate one math problem for the given difficulty, advancing the RNG. */
export function generateProblem(difficulty: Difficulty, rng: number): { problem: MathProblem; rng: number } {
  let prompt: string
  let correctAnswer: number
  const operation = difficulty

  if (difficulty === 'counting') {
    const r = rngRange(rng, 1, 20)
    rng = r.rng
    const n = r.value
    prompt = `Which number is ${n}?`
    correctAnswer = n
  } else if (difficulty === 'addition') {
    const ra = rngRange(rng, 1, 10)
    rng = ra.rng
    const a = ra.value
    const maxB = Math.min(10, 20 - a)
    const rb = rngRange(rng, 1, maxB)
    rng = rb.rng
    const b = rb.value
    prompt = `${a} + ${b} = ?`
    correctAnswer = a + b
  } else if (difficulty === 'subtraction') {
    const ra = rngRange(rng, 2, 20)
    rng = ra.rng
    const a = ra.value
    const rb = rngRange(rng, 1, a - 1)
    rng = rb.rng
    const b = rb.value
    prompt = `${a} \u2212 ${b} = ?`
    correctAnswer = a - b
  } else if (difficulty === 'multiplication') {
    const ra = rngRange(rng, 2, 9)
    rng = ra.rng
    const a = ra.value
    const rb = rngRange(rng, 2, 9)
    rng = rb.rng
    const b = rb.value
    prompt = `${a} \u00d7 ${b} = ?`
    correctAnswer = a * b
  } else {
    // division: pick divisor b ∈ [2,9] and quotient ∈ [2,12]; a = b × quotient
    const rb = rngRange(rng, 2, 9)
    rng = rb.rng
    const b = rb.value
    const rq = rngRange(rng, 2, 12)
    rng = rq.rng
    const quotient = rq.value
    const a = b * quotient
    prompt = `${a} \u00f7 ${b} = ?`
    correctAnswer = quotient
  }

  return {
    problem: { prompt, correctAnswer, operation, difficulty },
    rng,
  }
}

/** Place the correct answer and plausible distractors as positioned scene items. */
export function buildSceneItems(
  problem: MathProblem,
  difficulty: Difficulty,
  rng: number,
): { items: SceneItem[]; rng: number } {
  const itemCount = SCENE_ITEM_COUNTS[difficulty]
  const distractorCount = itemCount - 1

  const { distractors, rng: rng2 } = generateDistractors(problem.correctAnswer, difficulty, distractorCount, rng)
  rng = rng2

  // Merge correct answer + distractors into a value array
  const values = [problem.correctAnswer, ...distractors]

  // Shuffle values (Fisher-Yates with LCG)
  for (let i = values.length - 1; i > 0; i--) {
    const r = rngRange(rng, 0, i)
    rng = r.rng
    ;[values[i], values[r.value]] = [values[r.value], values[i]]
  }

  // Shuffle base layout positions
  const basePositions = [...(BASE_LAYOUTS[itemCount] ?? BASE_LAYOUTS[6])]
  for (let i = basePositions.length - 1; i > 0; i--) {
    const r = rngRange(rng, 0, i)
    rng = r.rng
    ;[basePositions[i], basePositions[r.value]] = [basePositions[r.value], basePositions[i]]
  }

  const items: SceneItem[] = values.map((value, index) => {
    const base = basePositions[index] ?? { x: 50, y: 50 }

    const jx = rngRange(rng, -5, 5)
    rng = jx.rng
    const jy = rngRange(rng, -4, 4)
    rng = jy.rng
    const em = rngRange(rng, 0, FRUIT_POOL.length - 1)
    rng = em.rng

    const x = Math.min(95, Math.max(5, base.x + jx.value))
    const y = Math.min(95, Math.max(5, base.y + jy.value))

    return {
      id: `item-${index}`,
      value,
      emoji: FRUIT_POOL[em.value],
      x,
      y,
      isCorrect: value === problem.correctAnswer,
    }
  })

  return { items, rng }
}

/** Pre-generate a fixed-length session of problems for the given difficulty. */
export function selectProblems(difficulty: Difficulty, count: number, seed: number): MathProblem[] {
  let rng = seed
  const problems: MathProblem[] = []
  for (let i = 0; i < count; i++) {
    const result = generateProblem(difficulty, rng)
    problems.push(result.problem)
    rng = result.rng
  }
  return problems
}
