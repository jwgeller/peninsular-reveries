import type { GameAttribution } from '../../app/data/attribution-types.js'
import { repositoryCodeLicense } from '../../app/data/attribution-types.js'

export const beatPadAttribution: GameAttribution = {
  slug: 'beat-pad',
  name: 'Beat Pad',
  codeLicense: repositoryCodeLicense,
  entries: [
    {
      title: 'Beat Pad percussion samples (CC0)',
      type: 'sound effect',
      usedIn: 'Beat Pad kit bank triggers across all eight pads',
      creator: 'johnnydekk, xUMR',
      source: 'https://freesound.org/',
      license: 'CC0',
      modifications: 'Trimmed, filtered, and normalized via creative-assets workflow',
      notes: 'Eight CC0 percussion one-shots (kick, snare, closed hi-hat, open hi-hat, clap, rimshot, tom, cymbal) sourced from Freesound. Kick and tom re-processed to emphasise 40–200 Hz low-end presence.',
    },
    {
      title: 'Beat Pad bass samples (CC0)',
      type: 'sound effect',
      usedIn: 'Beat Pad bass bank triggers across all eight pads',
      creator: 'Peninsular Reveries',
      source: 'Synthesised via ffmpeg creative-assets workflow',
      license: 'CC0',
      modifications: 'Not applicable',
      notes: 'Eight synthesised bass samples (sub-bass hit, bass drone, saw buzz, tonal hit, chord stab, filtered noise sweep, 808, wobble) generated via ffmpeg. Drone and saw buzz samples loop with sustained playback envelope.',
    },
    {
      title: 'Beat Pad UI sound effects',
      type: 'sound effect',
      usedIn: 'Beat Pad UI feedback for record, play, stop, and clear',
      creator: 'Peninsular Reveries',
      source: 'Generated in-browser with the Web Audio API',
      license: repositoryCodeLicense,
      modifications: 'Not applicable',
      notes: 'UI sound effects are synthesized at runtime unless a future implementation proves external media necessary.',
    },
  ],
}