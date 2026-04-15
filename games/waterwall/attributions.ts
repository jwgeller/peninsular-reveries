import type { GameAttribution } from '../../app/data/attribution-types.js'
import { repositoryCodeLicense } from '../../app/data/attribution-types.js'

export const waterwallAttribution: GameAttribution = {
  slug: 'waterwall',
  name: 'Waterwall',
  codeLicense: repositoryCodeLicense,
  entries: [
    {
      title: 'Waterwall water texture',
      type: 'sound effect',
      usedIn: 'Waterwall ambient water noise that follows the flow',
      creator: 'Peninsular Reveries',
      source: 'Generated in-browser with the Web Audio API',
      license: repositoryCodeLicense,
      modifications: 'Not applicable',
      notes: 'Filtered white noise synthesized at runtime. No bundled audio files ship with the game.',
    },
    {
      title: 'Waterwall ambient music',
      type: 'music',
      usedIn: 'Waterwall background ambient loop',
      creator: 'Peninsular Reveries',
      source: 'Generated in-browser with the Web Audio API',
      license: repositoryCodeLicense,
      modifications: 'Not applicable',
      notes: 'Ambient music is synthesized at runtime with deterministic note schedules. No bundled music files ship with the game.',
    },
    {
      title: 'Waterwall barrier and cursor sound effects',
      type: 'sound effect',
      usedIn: 'Waterwall barrier placement, removal, and cursor edge cues',
      creator: 'Peninsular Reveries',
      source: 'Generated in-browser with the Web Audio API',
      license: repositoryCodeLicense,
      modifications: 'Not applicable',
      notes: 'All sound effects are synthesized at runtime. No bundled audio files ship with the game.',
    },
  ],
}
