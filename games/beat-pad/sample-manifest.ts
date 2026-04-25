import type { MissionOrbitSampleProcessingPlan } from '../mission-orbit/sample-manifest.js'

export type BeatPadSampleId =
  | 'drum-kick'
  | 'drum-snare'
  | 'drum-hihat-closed'
  | 'drum-hihat-open'
  | 'drum-clap'
  | 'drum-rimshot'
  | 'drum-tom'
  | 'drum-cymbal'
  | 'bass-sub-hit'
  | 'bass-drone'
  | 'bass-saw-buzz'
  | 'bass-tonal-hit'
  | 'bass-chord-stab'
  | 'bass-filter-sweep'
  | 'bass-808'
  | 'bass-wobble'

interface FreesoundSource {
  readonly provider: 'freesound'
  readonly soundId: number
  readonly title: string
  readonly creator: string
  readonly sourceUrl: string
  readonly license: 'Creative Commons 0'
  readonly licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/'
}

interface SynthesizedSource {
  readonly provider: 'synthesized'
  readonly method: string
  readonly license: 'Creative Commons 0'
  readonly licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/'
}

export interface BeatPadSampleDefinition {
  readonly id: BeatPadSampleId
  readonly url: `/beat-pad/audio/${string}`
  readonly fileName: `${string}.ogg`
  readonly gain: number
  readonly loop: boolean
  readonly bundled: boolean
  readonly source: FreesoundSource | SynthesizedSource
  readonly processing: MissionOrbitSampleProcessingPlan
}

export const beatPadSampleManifest: Record<BeatPadSampleId, BeatPadSampleDefinition> = {
  // ── Kit bank (8) ─────────────────────────────────────────────────────────────
  'drum-kick': {
    id: 'drum-kick',
    url: '/beat-pad/audio/drum-kick.ogg',
    fileName: 'drum-kick.ogg',
    gain: 3.5,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 581451,
      title: 'Fractanimal Acoustic Drum Kit — Kick 2',
      creator: 'johnnydekk',
      sourceUrl: 'https://freesound.org/people/johnnydekk/sounds/581451/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.36,
      mono: true,
      bitrateKbps: 56,
      filters: ['highpass=f=40', 'lowpass=f=200', 'bass=g=6:f=100:t=o:w=80', 'volume=1.1'],
      fadeInSeconds: 0.002,
      fadeOutStartSeconds: 0.18,
      fadeOutSeconds: 0.18,
    },
  },
  'drum-snare': {
    id: 'drum-snare',
    url: '/beat-pad/audio/drum-snare.ogg',
    fileName: 'drum-snare.ogg',
    gain: 3.0,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 581469,
      title: 'Fractanimal Acoustic Drum Kit — Snare 1',
      creator: 'johnnydekk',
      sourceUrl: 'https://freesound.org/people/johnnydekk/sounds/581469/',
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
    url: '/beat-pad/audio/drum-hihat-closed.ogg',
    fileName: 'drum-hihat-closed.ogg',
    gain: 3.6,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 581471,
      title: 'Fractanimal Acoustic Drum Kit — High Hat 1',
      creator: 'johnnydekk',
      sourceUrl: 'https://freesound.org/people/johnnydekk/sounds/581471/',
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
    url: '/beat-pad/audio/drum-hihat-open.ogg',
    fileName: 'drum-hihat-open.ogg',
    gain: 4.5,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 581476,
      title: 'Fractanimal Acoustic Drum Kit — High Hat Open/Close 1',
      creator: 'johnnydekk',
      sourceUrl: 'https://freesound.org/people/johnnydekk/sounds/581476/',
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
    url: '/beat-pad/audio/drum-clap.ogg',
    fileName: 'drum-clap.ogg',
    gain: 3.2,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 478657,
      title: 'clap.wav',
      creator: 'xUMR',
      sourceUrl: 'https://freesound.org/people/xUMR/sounds/478657/',
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
    url: '/beat-pad/audio/drum-rimshot.ogg',
    fileName: 'drum-rimshot.ogg',
    gain: 3.2,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 581456,
      title: 'Fractanimal Acoustic Drum Kit — Snare Rimshot 1',
      creator: 'johnnydekk',
      sourceUrl: 'https://freesound.org/people/johnnydekk/sounds/581456/',
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
    url: '/beat-pad/audio/drum-tom.ogg',
    fileName: 'drum-tom.ogg',
    gain: 3.8,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 581467,
      title: 'Fractanimal Acoustic Drum Kit — Low Tom 1',
      creator: 'johnnydekk',
      sourceUrl: 'https://freesound.org/people/johnnydekk/sounds/581467/',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.32,
      mono: true,
      bitrateKbps: 56,
      filters: ['highpass=f=40', 'lowpass=f=200', 'bass=g=5:f=80:t=o:w=80', 'volume=1.1'],
      fadeInSeconds: 0.002,
      fadeOutStartSeconds: 0.12,
      fadeOutSeconds: 0.2,
    },
  },
  'drum-cymbal': {
    id: 'drum-cymbal',
    url: '/beat-pad/audio/drum-cymbal.ogg',
    fileName: 'drum-cymbal.ogg',
    gain: 2.8,
    loop: false,
    bundled: true,
    source: {
      provider: 'freesound',
      soundId: 581472,
      title: 'Fractanimal Acoustic Drum Kit — Cymbal Ride/Crash',
      creator: 'johnnydekk',
      sourceUrl: 'https://freesound.org/people/johnnydekk/sounds/581472/',
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

  // ── Bass bank (8) ────────────────────────────────────────────────────────────
  'bass-sub-hit': {
    id: 'bass-sub-hit',
    url: '/beat-pad/audio/bass-sub-hit.ogg',
    fileName: 'bass-sub-hit.ogg',
    gain: 8.0,
    loop: false,
    bundled: true,
    source: {
      provider: 'synthesized',
      method: 'Sine 50Hz with exponential decay, generated via ffmpeg',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.4,
      mono: true,
      bitrateKbps: 56,
      filters: ['highpass=f=30', 'lowpass=f=200', 'volume=0.95'],
      fadeInSeconds: 0.002,
      fadeOutStartSeconds: 0.1,
      fadeOutSeconds: 0.3,
    },
  },
  'bass-drone': {
    id: 'bass-drone',
    url: '/beat-pad/audio/bass-drone.ogg',
    fileName: 'bass-drone.ogg',
    gain: 7.0,
    loop: true,
    bundled: true,
    source: {
      provider: 'synthesized',
      method: 'Sine 55Hz sustained tone, generated via ffmpeg',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 2.0,
      mono: true,
      bitrateKbps: 56,
      filters: ['highpass=f=30', 'lowpass=f=200', 'volume=0.85'],
      fadeInSeconds: 0.05,
      fadeOutStartSeconds: 1.5,
      fadeOutSeconds: 0.5,
    },
  },
  'bass-saw-buzz': {
    id: 'bass-saw-buzz',
    url: '/beat-pad/audio/bass-saw-buzz.ogg',
    fileName: 'bass-saw-buzz.ogg',
    gain: 8.0,
    loop: true,
    bundled: true,
    source: {
      provider: 'synthesized',
      method: 'Sawtooth 110Hz sustained tone with low-pass filtering, generated via ffmpeg',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 1.5,
      mono: true,
      bitrateKbps: 56,
      filters: ['highpass=f=60', 'lowpass=f=800', 'volume=0.8'],
      fadeInSeconds: 0.02,
      fadeOutStartSeconds: 1.0,
      fadeOutSeconds: 0.5,
    },
  },
  'bass-tonal-hit': {
    id: 'bass-tonal-hit',
    url: '/beat-pad/audio/bass-tonal-hit.ogg',
    fileName: 'bass-tonal-hit.ogg',
    gain: 9.0,
    loop: false,
    bundled: true,
    source: {
      provider: 'synthesized',
      method: 'Triangle 120Hz with sharp attack and quick decay, generated via ffmpeg',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.3,
      mono: true,
      bitrateKbps: 56,
      filters: ['highpass=f=40', 'lowpass=f=400', 'volume=0.9'],
      fadeInSeconds: 0.001,
      fadeOutStartSeconds: 0.05,
      fadeOutSeconds: 0.25,
    },
  },
  'bass-chord-stab': {
    id: 'bass-chord-stab',
    url: '/beat-pad/audio/bass-chord-stab.ogg',
    fileName: 'bass-chord-stab.ogg',
    gain: 10.0,
    loop: false,
    bundled: true,
    source: {
      provider: 'synthesized',
      method: 'Multi-sine chord (65+82+98Hz) with fast decay, generated via ffmpeg',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.25,
      mono: true,
      bitrateKbps: 56,
      filters: ['highpass=f=40', 'lowpass=f=400', 'volume=3.0'],
      fadeInSeconds: 0.001,
      fadeOutStartSeconds: 0.04,
      fadeOutSeconds: 0.21,
    },
  },
  'bass-filter-sweep': {
    id: 'bass-filter-sweep',
    url: '/beat-pad/audio/bass-filter-sweep.ogg',
    fileName: 'bass-filter-sweep.ogg',
    gain: 8.0,
    loop: false,
    bundled: true,
    source: {
      provider: 'synthesized',
      method: 'Bandpass-filtered white noise with center frequency sweep 200–800Hz, generated via ffmpeg',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.6,
      mono: true,
      bitrateKbps: 56,
      filters: ['highpass=f=100', 'lowpass=f=2000', 'volume=3.0'],
      fadeInSeconds: 0.005,
      fadeOutStartSeconds: 0.3,
      fadeOutSeconds: 0.3,
    },
  },
  'bass-808': {
    id: 'bass-808',
    url: '/beat-pad/audio/bass-808.ogg',
    fileName: 'bass-808.ogg',
    gain: 8.0,
    loop: false,
    bundled: true,
    source: {
      provider: 'synthesized',
      method: '808-style sine 55Hz with long exponential decay, generated via ffmpeg',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.5,
      mono: true,
      bitrateKbps: 56,
      filters: ['highpass=f=30', 'lowpass=f=200', 'volume=3.0'],
      fadeInSeconds: 0.002,
      fadeOutStartSeconds: 0.08,
      fadeOutSeconds: 0.42,
    },
  },
  'bass-wobble': {
    id: 'bass-wobble',
    url: '/beat-pad/audio/bass-wobble.ogg',
    fileName: 'bass-wobble.ogg',
    gain: 8.0,
    loop: false,
    bundled: true,
    source: {
      provider: 'synthesized',
      method: 'Frequency-modulated sine 80Hz with LFO wobble, generated via ffmpeg',
      license: 'Creative Commons 0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    processing: {
      durationSeconds: 0.5,
      mono: true,
      bitrateKbps: 56,
      filters: ['highpass=f=40', 'lowpass=f=500', 'volume=3.0'],
      fadeInSeconds: 0.003,
      fadeOutStartSeconds: 0.15,
      fadeOutSeconds: 0.35,
    },
  },
}

export function getBundledBeatPadSamples(): readonly BeatPadSampleDefinition[] {
  return Object.values(beatPadSampleManifest).filter((sample) => sample.bundled)
}

export function getDownloadableBeatPadSamples(): readonly BeatPadSampleDefinition[] {
  return Object.values(beatPadSampleManifest)
}