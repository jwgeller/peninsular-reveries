import type { GameAttribution } from '../../app/data/attribution-types.js'
import { repositoryCodeLicense } from '../../app/data/attribution-types.js'
export const starDashAttribution: GameAttribution = {
  slug: 'star-dash',
  name: 'Star Dash',
  codeLicense: repositoryCodeLicense,
  entries: [
    { title: 'PixiJS', type: 'other', usedIn: 'Star Dash game rendering via PixiJS', creator: 'PixiJS Contributors', source: 'https://pixijs.com/', sourceUrl: 'https://pixijs.com/', license: 'MIT', modifications: 'Not applicable' },
  ],
}