import assert from 'node:assert/strict'
import test from 'node:test'

import { TRAIN_PRESETS } from './catalog.js'
import {
  getBundledTrainSoundsSamples,
  trainSoundsSampleManifest,
} from './sample-manifest.js'
import {
  getTrainHotspotSampleId,
  getTrainHotspotSoundRoute,
} from './sounds.js'

test('every Train Sounds hotspot resolves to a matching sound route and sample id', () => {
  for (const preset of TRAIN_PRESETS) {
    for (const hotspot of preset.hotspots) {
      const route = getTrainHotspotSoundRoute(preset.id, hotspot.id)
      const sampleId = getTrainHotspotSampleId(preset.id, hotspot.id)

      assert.ok(route, `Missing route for ${preset.id}:${hotspot.id}`)
      assert.equal(sampleId, route?.sampleId)
    }
  }
})

test('every routed Train Sounds sample id exists in the bundled manifest', () => {
  const bundledSampleIds = new Set(getBundledTrainSoundsSamples().map((sample) => sample.id))

  for (const preset of TRAIN_PRESETS) {
    for (const hotspot of preset.hotspots) {
      const route = getTrainHotspotSoundRoute(preset.id, hotspot.id)

      assert.ok(route, `Missing route for ${preset.id}:${hotspot.id}`)
      if (!route) {
        continue
      }

      const manifestEntry = trainSoundsSampleManifest[route.sampleId]
      assert.ok(manifestEntry, `Missing sample manifest entry for ${route.sampleId}`)
      assert.equal(bundledSampleIds.has(route.sampleId), true)
      assert.equal(manifestEntry.fileName, `${route.sampleId}.ogg`)
      assert.equal(manifestEntry.url, `/train-sounds/audio/${manifestEntry.fileName}`)
    }
  }
})