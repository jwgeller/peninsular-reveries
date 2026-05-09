import type { GameAttribution } from '../../app/data/attribution-types.js'
import { repositoryCodeLicense } from '../../app/data/attribution-types.js'
export const leafSwirlAttribution: GameAttribution = {
  slug: 'leaf-swirl',
  name: 'Leaf Swirl',
  codeLicense: repositoryCodeLicense,
  entries: [
    { title: 'PixiJS', type: 'other', usedIn: 'Leaf Swirl game rendering via PixiJS', creator: 'PixiJS Contributors', source: 'https://pixijs.com/', sourceUrl: 'https://pixijs.com/', license: 'MIT', modifications: 'Not applicable' },
  ],
}