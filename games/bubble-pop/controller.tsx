import * as React from '@remix-run/ui'
import { renderToString } from '@remix-run/ui/server'

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

import { bubblePopAttribution } from './attributions.js'
import { bubblePopInfo } from './info.js'

const modalOverlayStyles = {
  zIndex: 100,
  background: 'rgba(6, 6, 18, 0.92)',
}

export async function bubblePopAction() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)

  const html = await renderToString(
    <Document
      title="Bubble Pop"
      description="Pop soap bubbles with your body using your camera. A calming sensory toy."
      path="/bubble-pop/"
      includeNav={false}
      includeFooter={false}
      includeDefaultStyles={false}
      stylesheets={['/styles/bubble-pop.css']}
      scripts={['/client/bubble-pop/main.js?v=__BUILD_SHA__']}
      bodyClass="bubble-pop-game"
      viewportFitCover
      faviconPath="/favicon.svg"
      manifestPath="/bubble-pop/manifest.json"
      serviceWorkerPath="/bubble-pop/sw.js"
      serviceWorkerScope="/bubble-pop/"
    >
      <div className="scene-track">
        <GameScreen id="start-screen" className="active" labelledBy="bubble-pop-title" padded>
          <div className="bp-screen-panel bp-start-panel">
            <GameHeader
              headingId="bubble-pop-title"
              className="bp-header"
              leftContent={<>
                <h1 id="bubble-pop-title" className="bp-title">Bubble Pop</h1>
              </>}
              rightContent={<button
                type="button"
                className="bp-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <p className="bp-subtitle">Pop soap bubbles with your body!</p>

            <div className="bp-pose-list" id="pose-list">
              <p className="bp-pose-list-title">How to play:</p>
              <div className="bp-pose-chips">
                <span className="bp-pose-chip">🫧 Move to pop bubbles</span>
                <span className="bp-pose-chip">🌈 Each bubble has a color</span>
                <span className="bp-pose-chip">✨ Watch the sparkles</span>
                <span className="bp-pose-chip">🎵 No score pressure — just have fun!</span>
              </div>
            </div>

            <div className="bp-camera-prompt" id="camera-denied-msg">
              <p>Camera access is required for motion tracking.</p>
            </div>

            <div id="start-controls">
              <button id="start-btn" type="button" className="bp-primary-btn">Start</button>
            </div>
          </div>
        </GameScreen>

        <GameScreen id="game-screen" labelledBy="bubble-pop-game-heading">
          <div className="bp-screen-panel bp-game-panel">
            <GameHeader
              headingId="bubble-pop-game-heading"
              className="bp-header"
              leftContent={<>
                <h2 id="bubble-pop-game-heading" className="bp-title bp-title-small">Bubble Pop</h2>
              </>}
              rightContent={<button
                type="button"
                className="bp-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <div className="bp-hud">
              <span className="bp-hud-item" id="popped-display">Bubbles: 0</span>
            </div>

            <div className="bp-floor">
              <video id="camera-preview" autoPlay playsInline muted aria-label="Camera preview" />
              <div id="pixi-stage" aria-hidden="true" />
            </div>
          </div>
        </GameScreen>

        <GameScreen id="end-screen" labelledBy="bubble-pop-end-heading" padded>
          <div className="bp-screen-panel bp-end-panel">
            <GameHeader
              headingId="bubble-pop-end-heading"
              className="bp-header"
              leftContent={<>
                <h2 id="bubble-pop-end-heading" className="bp-title">Bubble Pop</h2>
              </>}
              rightContent={<button
                type="button"
                className="bp-menu-btn"
                data-settings-open="true"
                aria-haspopup="dialog"
                aria-controls="settings-modal"
                aria-expanded="false"
              >
                Menu
              </button>}
            />

            <p id="end-score-msg" className="bp-completion-msg">You popped 0 bubbles!</p>

            <div>
              <button id="replay-btn" type="button" className="bp-primary-btn">Play again</button>
            </div>
          </div>
        </GameScreen>

        <GameTabbedModal
          title="Menu"
          overlayStyles={modalOverlayStyles}
          quitHref={homePath}
          settingsContent={<>
            <SettingsSection title="Audio">
              <SettingsToggle
                id="music-enabled-toggle"
                label="Sound"
                helpText="Sound is on until you change it here."
                helpId="music-enabled-help"
              />
              <SettingsToggle
                id="sfx-enabled-toggle"
                label="Effects"
                helpText="Sound effects are on until you change it here."
                helpId="sfx-enabled-help"
              />
            </SettingsSection>

            <SettingsSection title="Controls">
              <div className="bp-controls-help">
                <p><strong>Pop:</strong> Move your body near bubbles to pop them.</p>
                <p><strong>No pressure:</strong> Bubbles keep coming — just enjoy popping!</p>
                <p><strong>Menu:</strong> Use the Menu button for settings and help.</p>
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
            <InfoSection title="About Bubble Pop">
              <p>{bubblePopInfo.summary}</p>
            </InfoSection>
            <InfoSection title="Credits">
              {bubblePopAttribution.entries.map((entry) => <InfoAttribution attribution={{
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
        <div className="noscript-message noscript-message-bp">
          <p>Bubble Pop needs JavaScript and camera access to track your moves. Turn JavaScript on and reload to play.</p>
        </div>
      </noscript>
    </Document>,
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}