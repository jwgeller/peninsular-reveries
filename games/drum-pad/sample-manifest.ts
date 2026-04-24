import type { MissionOrbitSampleProcessingPlan } from '../mission-orbit/sample-manifest.js'

export type DrumPadSampleId =
  | 'drum-kick'
  | 'drum-snare'
  | 'drum-hihat-closed'
  | 'drum-hihat-open'
  | 'drum-clap'
  | 'drum-rimshot'
  | 'drum-tom'
  | 'drum-cymbal'

interface FreesoundSource {
  readonly provider: 'freesound'
  readonly soundId: number
  readonly title: string
  readonly creator: string
  readonly sourceUrl: string
  readonly license: 'Creative Commons 0'
  readonly licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/'
}

export interface DrumPadSampleDefinition {
  readonly id: DrumPadSampleId
  readonly url: `/drum-pad/audio/${string}`
  readonly fileName: `${string}.ogg`
  readonly gain: number
  readonly loop: boolean
  readonly bundled: boolean
  readonly source: FreesoundSource
  readonly processing: MissionOrbitSampleProcessingPlan
}

export const drumPadSampleManifest: Record<DrumPadSampleId, DrumPadSampleDefinition> = {
  'drum-kick': {
    id: 'drum-kick',
    url: '/drum-pad/audio/drum-kick.ogg',
    fileName: 'drum-kick.ogg',
    gain: 3.0,
    loop: false,
    bundled: false,
    source: {
      provider: 'freesound',
      soundId: 0,
      title: 'TBD — kick drum',
      creator: 'TBD',
      sourceUrl: 'https://freesound.org/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.36,
      mono: true,
      bitrateKbps: 56,
      filters: ['highpass=f=40', 'lowpass=f=2400', 'volume=0.92'],
      fadeInSeconds: 0.002,
      fadeOutStartSeconds: 0.18,
      fadeOutSeconds: 0.18,
    },
  },
  'drum-snare': {
    id: 'drum-snare',
    url: '/drum-pad/audio/drum-snare.ogg',
    fileName: 'drum-snare.ogg',
    gain: 3.0,
    loop: false,
    bundled: false,
    source: {
      provider: 'freesound',
      soundId: 0,
      title: 'TBD — snare hit',
      creator: 'TBD',
      sourceUrl: 'https://freesound.org/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.22,
      mono: true,
      bitrateKbps: 56,
      filters: ['highpass=f=120', 'lowpass=f=8000', 'volume=0.9'],
      fadeInSeconds: 0.001,
      fadeOutStartSeconds: 0.08,
      fadeOutSeconds: 0.14,
    },
  },
  'drum-hihat-closed': {
    id: 'drum-hihat-closed',
    url: '/drum-pad/audio/drum-hihat-closed.ogg',
    fileName: 'drum-hihat-closed.ogg',
    gain: 2.8,
    loop: false,
    bundled: false,
    source: {
      provider: 'freesound',
      soundId: 0,
      title: 'TBD — closed hi-hat',
      creator: 'TBD',
      sourceUrl: 'https://freesound.org/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.08,
      mono: true,
      bitrateKbps: 48,
      filters: ['highpass=f=6000', 'lowpass=f=14000', 'volume=0.86'],
      fadeInSeconds: 0.001,
      fadeOutStartSeconds: 0.02,
      fadeOutSeconds: 0.06,
    },
  },
  'drum-hihat-open': {
    id: 'drum-hihat-open',
    url: '/drum-pad/audio/drum-hihat-open.ogg',
    fileName: 'drum-hihat-open.ogg',
    gain: 2.8,
    loop: false,
    bundled: false,
    source: {
      provider: 'freesound',
      soundId: 0,
      title: 'TBD — open hi-hat',
      creator: 'TBD',
      sourceUrl: 'https://freesound.org/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.36,
      mono: true,
      bitrateKbps: 48,
      filters: ['highpass=f=4000', 'lowpass=f=12000', 'volume=0.88'],
      fadeInSeconds: 0.002,
      fadeOutStartSeconds: 0.16,
      fadeOutSeconds: 0.2,
    },
  },
  'drum-clap': {
    id: 'drum-clap',
    url: '/drum-pad/audio/drum-clap.ogg',
    fileName: 'drum-clap.ogg',
    gain: 3.2,
    loop: false,
    bundled: false,
    source: {
      provider: 'freesound',
      soundId: 0,
      title: 'TBD — hand clap',
      creator: 'TBD',
      sourceUrl: 'https://freesound.org/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.22,
      mono: true,
      bitrateKbps: 56,
      filters: ['highpass=f=600', 'lowpass=f=6000', 'volume=0.9'],
      fadeInSeconds: 0.001,
      fadeOutStartSeconds: 0.06,
      fadeOutSeconds: 0.16,
    },
  },
  'drum-rimshot': {
    id: 'drum-rimshot',
    url: '/drum-pad/audio/drum-rimshot.ogg',
    fileName: 'drum-rimshot.ogg',
    gain: 3.2,
    loop: false,
    bundled: false,
    source: {
      provider: 'freesound',
      soundId: 0,
      title: 'TBD — rimshot',
      creator: 'TBD',
      sourceUrl: 'https://freesound.org/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.1,
      mono: true,
      bitrateKbps: 48,
      filters: ['highpass=f=300', 'lowpass=f=8000', 'volume=0.92'],
      fadeInSeconds: 0.001,
      fadeOutStartSeconds: 0.02,
      fadeOutSeconds: 0.08,
    },
  },
  'drum-tom': {
    id: 'drum-tom',
    url: '/drum-pad/audio/drum-tom.ogg',
    fileName: 'drum-tom.ogg',
    gain: 3.0,
    loop: false,
    bundled: false,
    source: {
      provider: 'freesound',
      soundId: 0,
      title: 'TBD — tom drum',
      creator: 'TBD',
      sourceUrl: 'https://freesound.org/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.32,
      mono: true,
      bitrateKbps: 56,
      filters: ['highpass=f=50', 'lowpass=f=2000', 'volume=0.9'],
      fadeInSeconds: 0.002,
      fadeOutStartSeconds: 0.12,
      fadeOutSeconds: 0.2,
    },
  },
  'drum-cymbal': {
    id: 'drum-cymbal',
    url: '/drum-pad/audio/drum-cymbal.ogg',
    fileName: 'drum-cymbal.ogg',
    gain: 2.8,
    loop: false,
    bundled: false,
    source: {
      provider: 'freesound',
      soundId: 0,
      title: 'TBD — cymbal hit',
      creator: 'TBD',
      sourceUrl: 'https://freesound.org/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.72,
      mono: true,
      bitrateKbps: 64,
      filters: ['highpass=f=2000', 'lowpass=f=12000', 'volume=0.88'],
      fadeInSeconds: 0.002,
      fadeOutStartSeconds: 0.24,
      fadeOutSeconds: 0.48,
    },
  },
}

export function getBundledDrumPadSamples(): readonly DrumPadSampleDefinition[] {
  return Object.values(drumPadSampleManifest).filter((sample) => sample.bundled)
}

export function getDownloadableDrumPadSamples(): readonly DrumPadSampleDefinition[] {
  return Object.values(drumPadSampleManifest)
}