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

import { drumPadAttribution } from './attributions.js'
import { drumPadInfo } from './info.js'
import { PAD_NAMES } from './sounds.js'

const drumPadModalOverlayStyles = {
  zIndex: 100,
  background: 'rgba(6, 6, 18, 0.82)',
}

const padKeys = ['Q', 'W', 'E', 'R', 'A', 'S', 'D', 'F'] as const

export async function drumPadAction() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)

  const html = await renderToString(
    <Document
      title="Drum Pad"
      description="Tap, loop, and layer beats on a neon drum pad."
      path="/drum-pad/"
      includeNav={false}
      includeFooter={false}
      includeDefaultStyles={false}
      stylesheets={['/styles/drum-pad.css']}
      scripts={['/client/drum-pad/main.js']}
      bodyClass="drum-pad"
      viewportFitCover
      faviconPath="/favicon-game-drum-pad.svg"
      manifestPath="/drum-pad/manifest.json"
      serviceWorkerPath="/drum-pad/sw.js"
      serviceWorkerScope="/drum-pad/"
    >
      <div className="scene-track">
        <GameScreen id="start-screen" className="active" labelledBy="drum-pad-title" padded>
          <div className="drum-pad-screen-panel drum-pad-start-panel">
            <GameHeader
              headingId="drum-pad-title"
              className="drum-pad-header"
              leftContent={<>
                <h1 id="drum-pad-title" className="drum-pad-title">Drum Pad</h1>
              </>}
              rightContent={<button
                type="button"
                className="drum-pad-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <p className="drum-pad-subtitle">Tap, loop, and layer beats.</p>

            <div>
              <button id="start-btn" type="button" className="drum-pad-primary-btn">Start</button>
            </div>
          </div>
        </GameScreen>

        <GameScreen id="game-screen" labelledBy="drum-pad-game-heading">
          <div className="drum-pad-screen-panel drum-pad-game-panel">
            <GameHeader
              headingId="drum-pad-game-heading"
              className="drum-pad-header"
              leftContent={<>
                <h2 id="drum-pad-game-heading" className="drum-pad-title">Drum Pad</h2>
              </>}
              rightContent={<button
                type="button"
                className="drum-pad-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <div className="drum-pad-mode-bar">
              <span className="drum-pad-mode-indicator" id="mode-indicator">Idle</span>
              <span className="drum-pad-layer-indicator" id="layer-indicator" aria-live="polite">Layer 0/3</span>
              <span className="drum-pad-tempo-display" id="tempo-display">120 BPM</span>
            </div>

            <div className="drum-pad-grid-wrap">
              <div id="pad-grid" className="drum-pad-grid" role="group" aria-label="Drum pads">
                {padKeys.map((key, index) => (
                  <button
                    key={`pad-${index}`}
                    id={`pad-${index}`}
                    type="button"
                    className="pad"
                    data-pad={`${index}`}
                    aria-label={`Pad ${index + 1} ${PAD_NAMES[index] ?? ''} (${key})`}
                  >
                    <span className="pad-name">{PAD_NAMES[index] ?? ''}</span>
                    <span className="pad-key" aria-hidden="true">{key}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="drum-pad-progress-track" id="progress-bar-track" aria-hidden="true">
              <div className="drum-pad-progress-bar" id="progress-bar"></div>
            </div>

            <div className="drum-pad-controls" role="group" aria-label="Loop controls">
              <button id="record-btn" type="button" className="drum-pad-btn" aria-pressed="false">Record</button>
              <button id="play-btn" type="button" className="drum-pad-btn" aria-pressed="false">Play</button>
              <button id="clear-btn" type="button" className="drum-pad-btn">Clear</button>
              <button id="tempo-btn" type="button" className="drum-pad-btn" aria-label="Change tempo">Tempo</button>
            </div>
          </div>
        </GameScreen>

        <GameTabbedModal
          title="Menu"
          overlayStyles={drumPadModalOverlayStyles}
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
              <div className="drum-pad-controls-help">
                <p><strong>Top row:</strong> <kbd>Q</kbd> <kbd>W</kbd> <kbd>E</kbd> <kbd>R</kbd> trigger pads 1–4.</p>
                <p><strong>Bottom row:</strong> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> <kbd>F</kbd> trigger pads 5–8.</p>
                <p><strong>Record toggle:</strong> <kbd>Space</kbd> starts and stops recording the current loop layer.</p>
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
            <InfoSection title="About Drum Pad">
              <p>{drumPadInfo.summary}</p>
            </InfoSection>
            <InfoSection title="Credits">
              {drumPadAttribution.entries.map((entry) => <InfoAttribution attribution={{
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
        <div className="noscript-message noscript-message-drum-pad">
          <p>Drum Pad needs JavaScript to synthesize sound and record loops. Turn JavaScript on and reload to play.</p>
        </div>
      </noscript>
    </Document>,
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}