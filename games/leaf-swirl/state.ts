import type { GameState, Leaf, WindParticle, MotionZone } from './types.js'

const LEAF_HUES = [15, 25, 35, 45, 55, 10, 0, 340]
const MAX_LEAVES = 60

let leafIdCounter = 0

export function createInitialState(): GameState {
  return {
    phase: 'start',
    leaves: [],
    windParticles: [],
    totalSwirled: 0,
    spawnTimer: 0,
    gameTime: 0,
    windStrength: 0,
    windAngle: 0,
  }
}

export function startGame(state: GameState): GameState {
  leafIdCounter = 0
  return {
    ...state,
    phase: 'playing',
    leaves: [],
    windParticles: [],
    totalSwirled: 0,
    spawnTimer: 0,
    gameTime: 0,
    windStrength: 0,
    windAngle: 0,
  }
}

function spawnLeaf(stageWidth: number, stageHeight: number): Leaf {
  const side = Math.random() < 0.6 ? 'top' : Math.random() < 0.5 ? 'left' : 'right'
  let x: number, y: number
  if (side === 'top') {
    x = Math.random() * stageWidth
    y = -20 - Math.random() * 40
  } else if (side === 'left') {
    x = -20 - Math.random() * 40
    y = Math.random() * stageHeight * 0.5
  } else {
    x = stageWidth + 20 + Math.random() * 40
    y = Math.random() * stageHeight * 0.5
  }

  return {
    id: `leaf-${leafIdCounter++}`,
    x,
    y,
    vx: (Math.random() - 0.5) * 0.5,
    vy: 0.2 + Math.random() * 0.5,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.04,
    scale: 0.6 + Math.random() * 0.6,
    hue: LEAF_HUES[Math.floor(Math.random() * LEAF_HUES.length)] + (Math.random() - 0.5) * 10,
    shape: Math.floor(Math.random() * 3),
    settleProgress: 0,
    settled: false,
  }
}

export function updateGame(
  state: GameState,
  zones: MotionZone[],
  stageWidth: number,
  stageHeight: number,
  deltaMs: number,
): GameState {
  if (state.phase !== 'playing') return state

  const dt = Math.min(deltaMs, 50) / 16.67
  const gameTime = state.gameTime + deltaMs
  let spawnTimer = state.spawnTimer + deltaMs
  let leaves = [...state.leaves]
  let windParticles = [...state.windParticles]
  let totalSwirled = state.totalSwirled

  // Calculate wind from motion zones
  let windStrength = 0
  let windAngle = state.windAngle
  for (const zone of zones.slice(0, 6)) {
    if (!zone.active) continue
    windStrength += (zone.spreadX + zone.spreadY) * 2
    windAngle = Math.atan2(
      zone.normalizedY - 0.5,
      zone.normalizedX - 0.5,
    )
  }
  windStrength = Math.min(windStrength, 8)

  // Spawn leaves
  if (leaves.length < MAX_LEAVES && spawnTimer > 600) {
    spawnTimer = 0
    leaves.push(spawnLeaf(stageWidth, stageHeight))
  }

  // Update leaves
  const gravity = 0.02
  const airResistance = 0.995

  const updatedLeaves: Leaf[] = []
  for (const leaf of leaves) {
    if (leaf.settled) {
      const newLeaf = { ...leaf, settleProgress: leaf.settleProgress + 0.01 * dt }
      if (newLeaf.settleProgress < 1) updatedLeaves.push(newLeaf)
      continue
    }

    let vx = leaf.vx
    let vy = leaf.vy
    let rotation = leaf.rotation
    let rotationSpeed = leaf.rotationSpeed

    // Apply wind from motion
    vx += Math.cos(windAngle) * windStrength * 0.03 * dt
    vy += Math.sin(windAngle) * windStrength * 0.02 * dt

    // Gentle gravity
    vy += gravity * dt

    // Leaf flutter (sinusoidal drift)
    vx += Math.sin(gameTime * 0.002 + parseFloat(leaf.id.replace(/\D/g, '') || '0') * 0.7) * 0.01 * dt

    // Air resistance
    vx *= airResistance
    vy *= airResistance

    // Rotation
    rotationSpeed += windStrength * 0.001 * dt
    rotation += rotationSpeed * dt
    rotationSpeed *= 0.98

    const x = leaf.x + vx * dt
    const y = leaf.y + vy * dt

    // Settle on ground
    if (y > stageHeight - 30) {
      updatedLeaves.push({
        ...leaf,
        x,
        y: stageHeight - 20 - Math.random() * 10,
        vx: 0,
        vy: 0,
        rotation,
        settled: true,
        settleProgress: 0,
      })
      totalSwirled++
      continue
    }

    // Remove if way off screen
    if (x < -200 || x > stageWidth + 200 || y > stageHeight + 100) continue

    updatedLeaves.push({
      ...leaf,
      x,
      y,
      vx,
      vy,
      rotation,
      rotationSpeed,
    })
  }
  leaves = updatedLeaves

  // Spawn wind particles near bodies
  if (windStrength > 0.3) {
    for (const zone of zones.slice(0, 4)) {
      if (!zone.active) continue
      if (Math.random() < windStrength * 0.1) {
        const zx = zone.normalizedX * stageWidth
        const zy = zone.normalizedY * stageHeight
        windParticles.push({
          x: zx + (Math.random() - 0.5) * 40,
          y: zy + (Math.random() - 0.5) * 40,
          vx: Math.cos(windAngle) * (1 + Math.random() * 3),
          vy: Math.sin(windAngle) * (1 + Math.random() * 2),
          life: 0.3 + Math.random() * 0.4,
          maxLife: 0.7,
          size: 1 + Math.random() * 2,
          alpha: 0.3 + Math.random() * 0.3,
        })
      }
    }
  }

  // Update wind particles
  windParticles = windParticles
    .map(p => ({
      ...p,
      x: p.x + p.vx * dt,
      y: p.y + p.vy * dt,
      life: p.life - dt * 0.02,
    }))
    .filter(p => p.life > 0)

  return {
    ...state,
    leaves,
    windParticles,
    totalSwirled,
    spawnTimer,
    gameTime,
    windStrength,
    windAngle,
  }
}