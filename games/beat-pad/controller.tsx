import * as React from '@remix-run/component'
import { renderToString } from '@remix-run/component/server'

import { getSiteBasePath } from '../../app/site-config.js'
import { withBasePath } from '../../app/site-paths.js'
import { Document } from '../../app/ui/document.js'
import {
  GameHeader,
  GameScreen,
  GameTabbedModal,
  InfoAttribution,
  InfoSection,
  SettingsSection,
  SettingsToggle,
  SrOnly,
} from '../../app/ui/game-shell.js'

import { beatPadAttribution } from './attributions.js'
import { beatPadInfo } from './info.js'
import { getPadNames } from './sounds.js'

const beatPadModalOverlayStyles = {
  zIndex: 100,
  background: 'rgba(6, 6, 18, 0.92)',
}

const padKeys = ['Q', 'W', 'E', 'R', 'A', 'S', 'D', 'F'] as const

export async function beatPadAction() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)

  const kitNames = getPadNames('kit')

  const html = await renderToString(
    <Document
      title="Beat Pad"
      description="Tap, loop, and layer beats and bass on a neon beat pad."
      path="/beat-pad/"
      includeNav={false}
      includeFooter={false}
      includeDefaultStyles={false}
      stylesheets={['/styles/beat-pad.css']}
      scripts={['/client/beat-pad/main.js']}
      bodyClass="beat-pad"
      viewportFitCover
      faviconPath="/favicon-game-beat-pad.svg"
      manifestPath="/beat-pad/manifest.json"
      serviceWorkerPath="/beat-pad/sw.js"
      serviceWorkerScope="/beat-pad/"
    >
      <div className="scene-track">
        <GameScreen id="start-screen" className="active" labelledBy="beat-pad-title" padded>
          <div className="beat-pad-screen-panel beat-pad-start-panel">
            <GameHeader
              headingId="beat-pad-title"
              className="beat-pad-header"
              leftContent={<>
                <h1 id="beat-pad-title" className="beat-pad-title">Beat Pad</h1>
              </>}
              rightContent={<button
                type="button"
                className="beat-pad-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <p className="beat-pad-subtitle">Tap, loop, and layer beats and bass.</p>

            <div>
              <button id="start-btn" type="button" className="beat-pad-primary-btn">Start</button>
            </div>
          </div>
        </GameScreen>

        <GameScreen id="game-screen" labelledBy="beat-pad-game-heading">
          <div className="beat-pad-screen-panel beat-pad-game-panel">
            <GameHeader
              headingId="beat-pad-game-heading"
              className="beat-pad-header"
              leftContent={<>
                <h2 id="beat-pad-game-heading" className="beat-pad-title">Beat Pad</h2>
              </>}
              rightContent={<button
                type="button"
                className="beat-pad-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <div className="beat-pad-mode-bar">
              <span className="beat-pad-mode-indicator" id="mode-indicator">Idle</span>
              <button
                id="bank-toggle"
                type="button"
                className="beat-pad-bank-toggle"
                aria-pressed="false"
                aria-label="Bank: Kit, switch bank"
                data-bank="kit"
              >
                Kit
              </button>
              <span className="beat-pad-layer-indicator" id="layer-indicator" aria-live="polite">Layer 0/3</span>
              <span className="beat-pad-tempo-display" id="tempo-display">120 BPM</span>
            </div>

            <div className="beat-pad-grid-wrap">
              <div id="pad-grid" className="beat-pad-grid" role="group" aria-label="Beat pads" data-bank="kit">
                {padKeys.map((key, index) => (
                  <button
                    key={`pad-${index}`}
                    id={`pad-${index}`}
                    type="button"
                    className="pad"
                    data-pad={`${index}`}
                    aria-label={`Pad ${index + 1} ${kitNames[index] ?? ''} (${key})`}
                  >
                    <span className="pad-name">{kitNames[index] ?? ''}</span>
                    <span className="pad-key" aria-hidden="true">{key}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="beat-pad-progress-track" id="progress-bar-track" aria-hidden="true">
              <div className="beat-pad-progress-bar" id="progress-bar"></div>
            </div>

            <div className="beat-pad-controls" role="group" aria-label="Loop controls">
              <button id="record-btn" type="button" className="beat-pad-btn" aria-pressed="false">Record</button>
              <button id="play-btn" type="button" className="beat-pad-btn" aria-pressed="false">Play</button>
              <button id="clear-btn" type="button" className="beat-pad-btn">Clear</button>
              <button id="tempo-btn" type="button" className="beat-pad-btn" aria-label="Change tempo">Tempo</button>
            </div>
          </div>
        </GameScreen>

        <GameTabbedModal
          title="Menu"
          overlayStyles={beatPadModalOverlayStyles}
          quitHref={homePath}
          settingsContent={<>
            <SettingsSection title="Audio">
              <SettingsToggle
                id="sfx-enabled-toggle"
                label="Sound effects"
                helpText="Sound effects are on until you change it here."
                helpId="sfx-enabled-help"
              />
            </SettingsSection>

            <SettingsSection title="Controls">
              <div className="beat-pad-controls-help">
                <p><strong>Top row:</strong> <kbd>Q</kbd> <kbd>W</kbd> <kbd>E</kbd> <kbd>R</kbd> trigger pads 1–4.</p>
                <p><strong>Bottom row:</strong> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> <kbd>F</kbd> trigger pads 5–8.</p>
                <p><strong>Record toggle:</strong> <kbd>Space</kbd> starts and stops recording the current loop layer.</p>
                <p><strong>Bank toggle:</strong> <kbd>B</kbd> switches between Kit and Bass banks.</p>
                <p><strong>Touch:</strong> Tap a pad to play it. Long-press for sustain on supported pads in a later update.</p>
              </div>
            </SettingsSection>

            <SettingsSection title="Accessibility">
              <SettingsToggle
                id="reduce-motion-toggle"
                label="Reduce motion"
                helpText="Defaults to your device setting until you change it here."
                helpId="reduce-motion-help"
              />
            </SettingsSection>
          </>}
          infoContent={<>
            <InfoSection title="About Beat Pad">
              <p>{beatPadInfo.summary}</p>
            </InfoSection>
            <InfoSection title="Credits">
              {beatPadAttribution.entries.map((entry) => <InfoAttribution attribution={{
                title: entry.title,
                author: entry.creator,
                license: entry.license,
                url: entry.sourceUrl,
                notes: entry.notes,
              }} />)}
            </InfoSection>
          </>}
        />
      </div>

      <SrOnly id="game-status" ariaLive="polite" ariaAtomic />
      <SrOnly id="game-feedback" ariaLive="assertive" ariaAtomic />

      <noscript>
        <div className="noscript-message noscript-message-beat-pad">
          <p>Beat Pad needs JavaScript to synthesize sound and record loops. Turn JavaScript on and reload to play.</p>
        </div>
      </noscript>
    </Document>,
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}