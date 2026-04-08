import { writeFileSync } from 'node:fs'
import { renderAttributionsMarkdown } from '../app/data/attribution-index.js'

writeFileSync('ATTRIBUTIONS.md', renderAttributionsMarkdown(), 'utf-8')
console.log('Synced ATTRIBUTIONS.md from games/*/attributions.ts')