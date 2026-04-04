import type { MissionCrewProfile } from '../../app/data/mission-orbit-crew.js'

export const MISSION_SEQUENCE = [
  'countdown',
  'launch',
  'orbit-insertion',
  'high-earth-orbit',
  'trans-lunar-injection',
  'lunar-flyby',
  'return-coast',
  'service-module-jettison',
  'parachute-deploy',
  'splashdown',
] as const

export type MissionGameplayPhase = (typeof MISSION_SEQUENCE)[number]
export type MissionPhase = 'title' | MissionGameplayPhase | 'celebration'
export type PhaseMode = 'countdown' | 'hold' | 'narrative' | 'auto'
export type BurnGrade = 'perfect' | 'good' | 'safe' | 'assist'

export interface TimingWindow {
  readonly perfectStart: number
  readonly perfectEnd: number
  readonly goodStart: number
  readonly goodEnd: number
}

export interface MissionPhaseDefinition {
  readonly id: MissionGameplayPhase
  readonly label: string
  readonly dayLabel: string
  readonly status: string
  readonly prompt: string
  readonly actionLabel: string
  readonly timingHint: string
  readonly mode: PhaseMode
  readonly briefingMs?: number
  readonly autoAdvanceMs?: number
  readonly assistAfterMs?: number
  readonly holdDurationMs?: number
  readonly meterSpeed?: number
  readonly timingWindow?: TimingWindow
}

export interface BurnResult {
  readonly phase: MissionGameplayPhase
  readonly label: string
  readonly grade: BurnGrade
  readonly accuracy: number
  readonly score: number
  readonly detail: string
}

export interface GameState {
  readonly phase: MissionPhase
  readonly phaseIndex: number
  readonly phaseElapsedMs: number
  readonly missionElapsedMs: number
  readonly crew: readonly MissionCrewProfile[]
  readonly briefingActive: boolean
  readonly countdownValue: number
  readonly actionHeld: boolean
  readonly holdProgress: number
  readonly timingCursor: number
  readonly timingDirection: 1 | -1
  readonly timingLatched: boolean
  readonly burnResults: readonly BurnResult[]
  readonly outcomeText: string
  readonly outcomeGrade: BurnGrade | null
  readonly stopMoActive: boolean
  readonly phaseResolved: boolean
  readonly serviceModuleDetached: boolean
  readonly parachuteDeployed: boolean
  readonly missionComplete: boolean
}

export const TOTAL_GAMEPLAY_STEPS = MISSION_SEQUENCE.length

const PHASE_DEFINITIONS: readonly MissionPhaseDefinition[] = [
  {
    id: 'countdown',
    label: 'Final countdown',
    dayLabel: 'Flight Day 1',
    status: 'Pad 39B is live',
    prompt: 'The crew is strapped in. The rocket is ready on the pad.',
    actionLabel: 'Countdown running',
    timingHint: 'Watch the clock. Liftoff comes at zero.',
    mode: 'countdown',
  },
  {
    id: 'launch',
    label: 'Ascent to orbit',
    dayLabel: 'Flight Day 1',
    status: 'SLS climb is under way',
    prompt: 'Hold the spacecraft to lift Orion into orbit. Keep holding until the climb is done.',
    actionLabel: 'Hold to launch',
    timingHint: 'Hold until Orion reaches orbit.',
    mode: 'hold',
    briefingMs: 1600,
    holdDurationMs: 2500,
    autoAdvanceMs: 1400,
  },
  {
    id: 'orbit-insertion',
    label: 'Orbit raise burn',
    dayLabel: 'Flight Day 1',
    status: 'Orion is circling Earth',
    prompt: 'The engines settle, and Orion finds its path around Earth.',
    actionLabel: 'Continue',
    timingHint: 'Continue when you are ready to leave low orbit.',
    mode: 'narrative',
    briefingMs: 1800,
    autoAdvanceMs: 3400,
  },
  {
    id: 'high-earth-orbit',
    label: 'High Earth orbit checkout',
    dayLabel: 'Flight Day 1',
    status: 'Cabin checks are nominal',
    prompt: 'The crew checks the cabin and gets ready for deep space.',
    actionLabel: 'Coasting',
    timingHint: 'Watch Orion settle into its path.',
    mode: 'auto',
    briefingMs: 1800,
    autoAdvanceMs: 5200,
  },
  {
    id: 'trans-lunar-injection',
    label: 'Trans-lunar injection',
    dayLabel: 'Flight Day 2',
    status: 'Time to leave Earth orbit',
    prompt: 'Hold the transfer burn to leave Earth orbit and send Orion toward the Moon.',
    actionLabel: 'Hold transfer burn',
    timingHint: 'Hold until Orion clears Earth orbit and the transfer burn is complete.',
    mode: 'hold',
    briefingMs: 2000,
    holdDurationMs: 2200,
    autoAdvanceMs: 1800,
  },
  {
    id: 'lunar-flyby',
    label: 'Lunar flyby',
    dayLabel: 'Flight Day 4',
    status: 'The Moon is filling the windows',
    prompt: 'The Moon fills the window as Orion swings around the far side.',
    actionLabel: 'Continue',
    timingHint: 'Continue when you are ready to head home.',
    mode: 'narrative',
    briefingMs: 1800,
    autoAdvanceMs: 5600,
  },
  {
    id: 'return-coast',
    label: 'Return coast',
    dayLabel: 'Flight Day 7',
    status: 'Earth is back on the horizon',
    prompt: 'Earth grows larger while recovery teams plan the splash zone.',
    actionLabel: 'Coasting',
    timingHint: 'Watch Earth come back into view.',
    mode: 'auto',
    briefingMs: 1800,
    autoAdvanceMs: 5600,
  },
  {
    id: 'service-module-jettison',
    label: 'Entry interface',
    dayLabel: 'Flight Day 10',
    status: 'Re-entry heating is building',
    prompt: 'Hold steady while the service module peels away and the crew capsule points for entry.',
    actionLabel: 'Hold to separate',
    timingHint: 'Hold until the service module clears the capsule.',
    mode: 'hold',
    briefingMs: 1800,
    holdDurationMs: 1600,
    autoAdvanceMs: 1500,
  },
  {
    id: 'parachute-deploy',
    label: 'Parachute deploy',
    dayLabel: 'Flight Day 10',
    status: 'Ocean recovery is in range',
    prompt: 'Hold steady and let the parachutes bloom before splashdown.',
    actionLabel: 'Hold to deploy',
    timingHint: 'Hold until the parachutes catch clean air and Orion slows for splashdown.',
    mode: 'hold',
    briefingMs: 1800,
    holdDurationMs: 1700,
    autoAdvanceMs: 1800,
  },
  {
    id: 'splashdown',
    label: 'Pacific splashdown',
    dayLabel: 'Flight Day 10',
    status: 'Recovery teams are moving in',
    prompt: 'The capsule is home. The recovery boat comes in across the water.',
    actionLabel: 'Recovery underway',
    timingHint: 'Wait for the recovery boat, then continue when you are ready.',
    mode: 'auto',
    briefingMs: 1600,
  },
] as const

export function getPhaseDefinition(phase: MissionGameplayPhase): MissionPhaseDefinition {
  const definition = PHASE_DEFINITIONS.find((item) => item.id === phase)
  if (!definition) {
    throw new Error(`Unknown mission phase: ${phase}`)
  }
  return definition
}