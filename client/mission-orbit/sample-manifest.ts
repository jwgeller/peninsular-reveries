export type MissionOrbitSampleIntensity = 'light' | 'heavy'

export type MissionOrbitPhysicalSampleId =
  | 'launch-rumble'
  | 'burn-thrust-pulse'
  | 'reentry-texture'
  | 'parachute-deploy'
  | 'splashdown'
  | 'space-ambience'
  | 'celebration-accent'

export type MissionOrbitSampleId = `${MissionOrbitPhysicalSampleId}-${MissionOrbitSampleIntensity}`

interface FreesoundSource {
  readonly provider: 'freesound'
  readonly soundId: number
  readonly title: string
  readonly creator: string
  readonly sourceUrl: string
  readonly license: 'Creative Commons 0'
  readonly licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/'
}

interface DiySource {
  readonly provider: 'diy'
  readonly notes: string
}

export interface MissionOrbitSampleProcessingPlan {
  readonly startSeconds?: number
  readonly durationSeconds?: number
  readonly mono: boolean
  readonly bitrateKbps: number
  readonly filters?: readonly string[]
  readonly fadeInSeconds?: number
  readonly fadeOutSeconds?: number
  readonly fadeOutStartSeconds?: number
}

export interface MissionOrbitSampleDefinition {
  readonly id: MissionOrbitSampleId
  readonly url: `/mission-orbit/audio/${string}`
  readonly fileName: `${string}.ogg`
  readonly gain: number
  readonly loop: boolean
  readonly bundled: boolean
  readonly source: FreesoundSource | DiySource
  readonly processing?: MissionOrbitSampleProcessingPlan
}

export const missionOrbitSampleVariants: Record<MissionOrbitPhysicalSampleId, Record<MissionOrbitSampleIntensity, MissionOrbitSampleId>> = {
  'launch-rumble': {
    light: 'launch-rumble-light',
    heavy: 'launch-rumble-heavy',
  },
  'burn-thrust-pulse': {
    light: 'burn-thrust-pulse-light',
    heavy: 'burn-thrust-pulse-heavy',
  },
  'reentry-texture': {
    light: 'reentry-texture-light',
    heavy: 'reentry-texture-heavy',
  },
  'parachute-deploy': {
    light: 'parachute-deploy-light',
    heavy: 'parachute-deploy-heavy',
  },
  splashdown: {
    light: 'splashdown-light',
    heavy: 'splashdown-heavy',
  },
  'space-ambience': {
    light: 'space-ambience-light',
    heavy: 'space-ambience-heavy',
  },
  'celebration-accent': {
    light: 'celebration-accent-light',
    heavy: 'celebration-accent-heavy',
  },
}

export function getMissionOrbitSampleVariantId(
  baseId: MissionOrbitPhysicalSampleId,
  intensity: MissionOrbitSampleIntensity,
): MissionOrbitSampleId {
  return missionOrbitSampleVariants[baseId][intensity]
}

export const missionOrbitSampleManifest: Record<MissionOrbitSampleId, MissionOrbitSampleDefinition> = {
  'launch-rumble-light': {
    id: 'launch-rumble-light',
    url: '/mission-orbit/audio/launch-rumble-light.ogg',
    fileName: 'launch-rumble-light.ogg',
    gain: 0.42,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 613855,
      title: 'Rocket Launch Rumble at Canaveral',
      creator: 'felix.blume',
      sourceUrl: 'https://freesound.org/people/felix.blume/sounds/613855/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      startSeconds: 47.8,
      durationSeconds: 0.82,
      mono: true,
      bitrateKbps: 64,
      filters: [
        'highpass=f=100',
        'lowpass=f=2600',
        "firequalizer=gain_entry='entry(0,0);entry(180,0);entry(350,4);entry(700,8);entry(1400,6);entry(2600,0)'",
        'volume=1.05',
      ],
      fadeInSeconds: 0.02,
      fadeOutStartSeconds: 0.68,
      fadeOutSeconds: 0.14,
    },
  },
  'launch-rumble-heavy': {
    id: 'launch-rumble-heavy',
    url: '/mission-orbit/audio/launch-rumble-heavy.ogg',
    fileName: 'launch-rumble-heavy.ogg',
    gain: 0.58,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 613855,
      title: 'Rocket Launch Rumble at Canaveral',
      creator: 'felix.blume',
      sourceUrl: 'https://freesound.org/people/felix.blume/sounds/613855/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      startSeconds: 47.8,
      durationSeconds: 1.05,
      mono: true,
      bitrateKbps: 64,
      filters: [
        'highpass=f=80',
        'lowpass=f=2800',
        "firequalizer=gain_entry='entry(0,0);entry(180,0);entry(320,4);entry(650,7);entry(1200,5);entry(2800,0)'",
        'volume=1.1',
      ],
      fadeInSeconds: 0.03,
      fadeOutStartSeconds: 0.9,
      fadeOutSeconds: 0.15,
    },
  },
  'burn-thrust-pulse-light': {
    id: 'burn-thrust-pulse-light',
    url: '/mission-orbit/audio/burn-thrust-pulse-light.ogg',
    fileName: 'burn-thrust-pulse-light.ogg',
    gain: 0.54,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 753135,
      title: 'Compressed Air-Short-6',
      creator: 'wavecal22',
      sourceUrl: 'https://freesound.org/people/wavecal22/sounds/753135/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      startSeconds: 0.05,
      durationSeconds: 0.24,
      mono: true,
      bitrateKbps: 64,
      filters: ['highpass=f=180', 'lowpass=f=2400'],
      fadeInSeconds: 0.01,
      fadeOutStartSeconds: 0.16,
      fadeOutSeconds: 0.08,
    },
  },
  'burn-thrust-pulse-heavy': {
    id: 'burn-thrust-pulse-heavy',
    url: '/mission-orbit/audio/burn-thrust-pulse-heavy.ogg',
    fileName: 'burn-thrust-pulse-heavy.ogg',
    gain: 0.72,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 753138,
      title: 'Compressed Air-Short-9',
      creator: 'wavecal22',
      sourceUrl: 'https://freesound.org/people/wavecal22/sounds/753138/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      startSeconds: 0.15,
      durationSeconds: 0.3,
      mono: true,
      bitrateKbps: 64,
      filters: ['highpass=f=160', 'lowpass=f=2800', 'volume=0.95'],
      fadeInSeconds: 0.01,
      fadeOutStartSeconds: 0.21,
      fadeOutSeconds: 0.09,
    },
  },
  'reentry-texture-light': {
    id: 'reentry-texture-light',
    url: '/mission-orbit/audio/reentry-texture-light.ogg',
    fileName: 'reentry-texture-light.ogg',
    gain: 0.34,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 124579,
      title: 'burning-towels.aif',
      creator: 'alienistcog',
      sourceUrl: 'https://freesound.org/people/alienistcog/sounds/124579/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      startSeconds: 28,
      durationSeconds: 1.1,
      mono: true,
      bitrateKbps: 64,
      filters: ['highpass=f=250', 'volume=0.8'],
      fadeInSeconds: 0.04,
      fadeOutStartSeconds: 0.96,
      fadeOutSeconds: 0.14,
    },
  },
  'reentry-texture-heavy': {
    id: 'reentry-texture-heavy',
    url: '/mission-orbit/audio/reentry-texture-heavy.ogg',
    fileName: 'reentry-texture-heavy.ogg',
    gain: 0.52,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 124579,
      title: 'burning-towels.aif',
      creator: 'alienistcog',
      sourceUrl: 'https://freesound.org/people/alienistcog/sounds/124579/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      startSeconds: 34,
      durationSeconds: 1.4,
      mono: true,
      bitrateKbps: 64,
      filters: ['highpass=f=250', 'volume=0.9'],
      fadeInSeconds: 0.05,
      fadeOutStartSeconds: 1.28,
      fadeOutSeconds: 0.12,
    },
  },
  'parachute-deploy-light': {
    id: 'parachute-deploy-light',
    url: '/mission-orbit/audio/parachute-deploy-light.ogg',
    fileName: 'parachute-deploy-light.ogg',
    gain: 0.54,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 438636,
      title: 'G39-19-Parachute Swish Snap.wav',
      creator: 'craigsmith',
      sourceUrl: 'https://freesound.org/people/craigsmith/sounds/438636/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      startSeconds: 4.75,
      durationSeconds: 0.42,
      mono: true,
      bitrateKbps: 64,
      fadeInSeconds: 0.01,
      fadeOutStartSeconds: 0.31,
      fadeOutSeconds: 0.11,
    },
  },
  'parachute-deploy-heavy': {
    id: 'parachute-deploy-heavy',
    url: '/mission-orbit/audio/parachute-deploy-heavy.ogg',
    fileName: 'parachute-deploy-heavy.ogg',
    gain: 0.68,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 438636,
      title: 'G39-19-Parachute Swish Snap.wav',
      creator: 'craigsmith',
      sourceUrl: 'https://freesound.org/people/craigsmith/sounds/438636/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      startSeconds: 4.8,
      durationSeconds: 0.45,
      mono: true,
      bitrateKbps: 64,
      fadeInSeconds: 0.01,
      fadeOutStartSeconds: 0.33,
      fadeOutSeconds: 0.12,
    },
  },
  'splashdown-light': {
    id: 'splashdown-light',
    url: '/mission-orbit/audio/splashdown-light.ogg',
    fileName: 'splashdown-light.ogg',
    gain: 0.7,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 554595,
      title: 'WATRSplsh_Stick Throw Into Water_Jaku5.wav',
      creator: 'jakubp.jp',
      sourceUrl: 'https://freesound.org/people/jakubp.jp/sounds/554595/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.45,
      mono: true,
      bitrateKbps: 64,
      fadeOutStartSeconds: 0.35,
      fadeOutSeconds: 0.1,
    },
  },
  'splashdown-heavy': {
    id: 'splashdown-heavy',
    url: '/mission-orbit/audio/splashdown-heavy.ogg',
    fileName: 'splashdown-heavy.ogg',
    gain: 0.92,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 316572,
      title: 'Water_Paddle_impact_001.wav',
      creator: 'EpicWizard',
      sourceUrl: 'https://freesound.org/people/EpicWizard/sounds/316572/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.62,
      mono: true,
      bitrateKbps: 64,
      fadeOutStartSeconds: 0.5,
      fadeOutSeconds: 0.12,
    },
  },
  'space-ambience-light': {
    id: 'space-ambience-light',
    url: '/mission-orbit/audio/space-ambience-light.ogg',
    fileName: 'space-ambience-light.ogg',
    gain: 0.16,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 324665,
      title: 'Electric machine engine large air-conditioner hum noise',
      creator: 'kentspublicdomain',
      sourceUrl: 'https://freesound.org/people/kentspublicdomain/sounds/324665/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      startSeconds: 1,
      durationSeconds: 2.6,
      mono: true,
      bitrateKbps: 48,
      filters: ['highpass=f=70', 'lowpass=f=1000', 'volume=0.8'],
      fadeInSeconds: 0.12,
      fadeOutStartSeconds: 2.35,
      fadeOutSeconds: 0.25,
    },
  },
  'space-ambience-heavy': {
    id: 'space-ambience-heavy',
    url: '/mission-orbit/audio/space-ambience-heavy.ogg',
    fileName: 'space-ambience-heavy.ogg',
    gain: 0.24,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 324666,
      title: 'Refridgerator electric machine engine noise',
      creator: 'kentspublicdomain',
      sourceUrl: 'https://freesound.org/people/kentspublicdomain/sounds/324666/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      startSeconds: 1,
      durationSeconds: 2.8,
      mono: true,
      bitrateKbps: 48,
      filters: ['highpass=f=60', 'lowpass=f=1300', 'volume=0.95'],
      fadeInSeconds: 0.12,
      fadeOutStartSeconds: 2.52,
      fadeOutSeconds: 0.28,
    },
  },
  'celebration-accent-light': {
    id: 'celebration-accent-light',
    url: '/mission-orbit/audio/celebration-accent-light.ogg',
    fileName: 'celebration-accent-light.ogg',
    gain: 0.15,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 331047,
      title: 'Kalimba (C-note)',
      creator: 'foochie_foochie',
      sourceUrl: 'https://freesound.org/people/foochie_foochie/sounds/331047/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.68,
      mono: true,
      bitrateKbps: 64,
      filters: ['lowpass=f=3000', 'volume=0.68'],
      fadeInSeconds: 0.02,
      fadeOutStartSeconds: 0.42,
      fadeOutSeconds: 0.26,
    },
  },
  'celebration-accent-heavy': {
    id: 'celebration-accent-heavy',
    url: '/mission-orbit/audio/celebration-accent-heavy.ogg',
    fileName: 'celebration-accent-heavy.ogg',
    gain: 0.2,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 824972,
      title: 'MUSCTnprc-Blue Snowball Microphone, CU_Kalimba, Duo Note_Nicholas Judy_TDC',
      creator: 'designerschoice',
      sourceUrl: 'https://freesound.org/people/designerschoice/sounds/824972/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.78,
      mono: true,
      bitrateKbps: 64,
      filters: ['lowpass=f=3200', 'volume=0.72'],
      fadeInSeconds: 0.02,
      fadeOutStartSeconds: 0.5,
      fadeOutSeconds: 0.28,
    },
  },
}

export function getBundledMissionOrbitSamples(): readonly MissionOrbitSampleDefinition[] {
  return Object.values(missionOrbitSampleManifest).filter((sample) => sample.bundled)
}

export function getDownloadableMissionOrbitSamples(): readonly MissionOrbitSampleDefinition[] {
  return Object.values(missionOrbitSampleManifest).filter((sample) => sample.source.provider === 'freesound')
}

export function getDiyMissionOrbitSamples(): readonly MissionOrbitSampleDefinition[] {
  return Object.values(missionOrbitSampleManifest).filter((sample) => sample.source.provider === 'diy')
}