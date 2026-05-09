import type { GameAttribution } from '../../app/data/attribution-types.js'
import { repositoryCodeLicense } from '../../app/data/attribution-types.js'
export const colorReachAttribution: GameAttribution = {
  slug: 'color-reach',
  name: 'Color Reach',
  codeLicense: repositoryCodeLicense,
  entries: [
    { title: 'PixiJS', type: 'other', usedIn: 'Color Reach game rendering via PixiJS', creator: 'PixiJS Contributors', source: 'https://pixijs.com/', sourceUrl: 'https://pixijs.com/', license: 'MIT', modifications: 'Not applicable' },
  ],
}