import type { MissionOrbitSampleProcessingPlan } from '../mission-orbit/sample-manifest.js'

export type ChompersSampleId = 'ui-tap' | 'collect-pop' | 'chomp-splash' | 'hazard-snap' | 'miss-plop'

interface FreesoundSource {
  readonly provider: 'freesound'
  readonly soundId: number
  readonly title: string
  readonly creator: string
  readonly sourceUrl: string
  readonly license: 'Creative Commons 0'
  readonly licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/'
}

export interface ChompersSampleDefinition {
  readonly id: ChompersSampleId
  readonly url: `/chompers/audio/${string}`
  readonly fileName: `${string}.ogg`
  readonly gain: number
  readonly loop: boolean
  readonly bundled: boolean
  readonly source: FreesoundSource
  readonly processing: MissionOrbitSampleProcessingPlan
}

export const chompersSampleManifest: Record<ChompersSampleId, ChompersSampleDefinition> = {
  'ui-tap': {
    id: 'ui-tap',
    url: '/chompers/audio/ui-tap.ogg',
    fileName: 'ui-tap.ogg',
    gain: 0.42,
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
      durationSeconds: 0.24,
      mono: true,
      bitrateKbps: 64,
      filters: ['highpass=f=220', 'lowpass=f=2600', 'volume=0.68'],
      fadeInSeconds: 0.01,
      fadeOutStartSeconds: 0.12,
      fadeOutSeconds: 0.12,
    },
  },
  'collect-pop': {
    id: 'collect-pop',
    url: '/chompers/audio/collect-pop.ogg',
    fileName: 'collect-pop.ogg',
    gain: 0.4,
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
      durationSeconds: 0.52,
      mono: true,
      bitrateKbps: 64,
      filters: ['highpass=f=180', 'lowpass=f=3200', 'volume=0.76'],
      fadeInSeconds: 0.01,
      fadeOutStartSeconds: 0.34,
      fadeOutSeconds: 0.18,
    },
  },
  'chomp-splash': {
    id: 'chomp-splash',
    url: '/chompers/audio/chomp-splash.ogg',
    fileName: 'chomp-splash.ogg',
    gain: 0.58,
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
      durationSeconds: 0.4,
      mono: true,
      bitrateKbps: 64,
      filters: ['highpass=f=120', 'lowpass=f=2400', 'volume=0.92'],
      fadeInSeconds: 0.01,
      fadeOutStartSeconds: 0.28,
      fadeOutSeconds: 0.12,
    },
  },
  'hazard-snap': {
    id: 'hazard-snap',
    url: '/chompers/audio/hazard-snap.ogg',
    fileName: 'hazard-snap.ogg',
    gain: 0.5,
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
      durationSeconds: 0.32,
      mono: true,
      bitrateKbps: 64,
      filters: ['highpass=f=220', 'lowpass=f=2400', 'volume=0.82'],
      fadeInSeconds: 0.01,
      fadeOutStartSeconds: 0.22,
      fadeOutSeconds: 0.1,
    },
  },
  'miss-plop': {
    id: 'miss-plop',
    url: '/chompers/audio/miss-plop.ogg',
    fileName: 'miss-plop.ogg',
    gain: 0.48,
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
      durationSeconds: 0.3,
      mono: true,
      bitrateKbps: 64,
      filters: ['highpass=f=140', 'lowpass=f=2200', 'volume=0.8'],
      fadeInSeconds: 0.01,
      fadeOutStartSeconds: 0.2,
      fadeOutSeconds: 0.1,
    },
  },
}

export function getBundledChompersSamples(): readonly ChompersSampleDefinition[] {
  return Object.values(chompersSampleManifest).filter((sample) => sample.bundled)
}

export function getDownloadableChompersSamples(): readonly ChompersSampleDefinition[] {
  return Object.values(chompersSampleManifest)
}