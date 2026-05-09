import type { GameAttribution } from '../../app/data/attribution-types.js'
import { repositoryCodeLicense } from '../../app/data/attribution-types.js'
export const jellyWobbleAttribution: GameAttribution = {
  slug: 'jelly-wobble',
  name: 'Jelly Wobble',
  codeLicense: repositoryCodeLicense,
  entries: [
    { title: 'PixiJS', type: 'other', usedIn: 'Jelly Wobble game rendering via PixiJS', creator: 'PixiJS Contributors', source: 'https://pixijs.com/', sourceUrl: 'https://pixijs.com/', license: 'MIT', modifications: 'Not applicable' },
  ],
}