import type { GameAttribution } from '../../app/data/attribution-types.js'
import { repositoryCodeLicense } from '../../app/data/attribution-types.js'

export const drumPadAttribution: GameAttribution = {
  slug: 'drum-pad',
  name: 'Drum Pad',
  codeLicense: repositoryCodeLicense,
  entries: [
    {
      title: 'Drum Pad percussion samples (CC0)',
      type: 'sound effect',
      usedIn: 'Drum Pad pad triggers across all eight color-coded pads',
      creator: 'To be determined — Freesound CC0 sourcing pending',
      source: 'https://freesound.org/',
      license: 'CC0',
      modifications: 'Trimmed, filtered, and normalized via creative-assets workflow',
      notes: 'Eight CC0 percussion one-shots (kick, snare, closed hi-hat, open hi-hat, clap, rimshot, tom, cymbal) sourced from Freesound. Freesound IDs and creator attribution to be filled when samples are fetched and verified.',
    },
    {
      title: 'Drum Pad UI sound effects',
      type: 'sound effect',
      usedIn: 'Drum Pad UI feedback for record, play, stop, and clear',
      creator: 'Peninsular Reveries',
      source: 'Generated in-browser with the Web Audio API',
      license: repositoryCodeLicense,
      modifications: 'Not applicable',
      notes: 'UI sound effects are synthesized at runtime unless a future implementation proves external media necessary.',
    },
  ],
}