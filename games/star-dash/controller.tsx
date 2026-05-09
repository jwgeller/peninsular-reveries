import * as React from '@remix-run/ui'
import { renderToString } from '@remix-run/ui/server'
import { getSiteBasePath } from '../../app/site-config.js'
import { withBasePath } from '../../app/site-paths.js'
import { Document } from '../../app/ui/document.js'
import { GameHeader, GameScreen, GameTabbedModal, InfoAttribution, InfoSection, SettingsSection, SettingsToggle, SrOnly } from '../../app/ui/game-shell.js'
import { starDashAttribution } from './attributions.js'
import { starDashInfo } from './info.js'

const modalOverlayStyles = { zIndex: 100, background: 'rgba(6, 6, 18, 0.92)' }

export async function starDashAction() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)
  const html = await renderToString(
    <Document title="Star Dash" description="Dash to catch fading stars! A fast-paced camera game." path="/star-dash/" includeNav={false} includeFooter={false} includeDefaultStyles={false} stylesheets={['/styles/star-dash.css']} scripts={['/client/star-dash/main.js?v=__BUILD_SHA__']} bodyClass="star-dash-game" viewportFitCover faviconPath="/favicon.svg" manifestPath="/star-dash/manifest.json" serviceWorkerPath="/star-dash/sw.js" serviceWorkerScope="/star-dash/">
      <div className="scene-track">
        <GameScreen id="start-screen" className="active" labelledBy="star-dash-title" padded>
          <div className="sd-screen-panel sd-start-panel">
            <GameHeader headingId="star-dash-title" className="sd-header" leftContent={<><h1 id="star-dash-title" className="sd-title">Star Dash</h1></>} rightContent={<button type="button" className="sd-menu-btn" data-settings-open="true" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>} />
            <p className="sd-subtitle">Dash to catch the fading stars!</p>
            <div className="sd-pose-list"><p className="sd-pose-list-title">How to play:</p><div className="sd-pose-chips">
              <span className="sd-pose-chip">⭐ Move near stars to catch them</span>
              <span className="sd-pose-chip">🔥 Build streaks for bonus points</span>
              <span className="sd-pose-chip">⏱️ Catch them before they fade!</span>
              <span className="sd-pose-chip">🌟 Special stars are worth more</span>
            </div></div>
            <div className="sd-camera-prompt" id="camera-denied-msg"><p>Camera access is required for motion tracking.</p></div>
            <div id="start-controls"><button id="start-btn" type="button" className="sd-primary-btn">Start</button></div>
          </div>
        </GameScreen>
        <GameScreen id="game-screen" labelledBy="star-dash-game-heading">
          <div className="sd-screen-panel sd-game-panel">
            <GameHeader headingId="star-dash-game-heading" className="sd-header" leftContent={<><h2 id="star-dash-game-heading" className="sd-title sd-title-small">Star Dash</h2></>} rightContent={<button type="button" className="sd-menu-btn" data-settings-open="true" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>} />
            <div className="sd-hud">
              <span className="sd-hud-item" id="score-display">Score: 0</span>
              <span className="sd-hud-item" id="timer-display">Time: 60s</span>
              <span className="sd-hud-item" id="streak-display"></span>
            </div>
            <div className="sd-floor">
              <video id="camera-preview" autoPlay playsInline muted aria-label="Camera preview" />
              <div id="pixi-stage" aria-hidden="true" />
            </div>
          </div>
        </GameScreen>
        <GameScreen id="end-screen" labelledBy="star-dash-end-heading" padded>
          <div className="sd-screen-panel sd-end-panel">
            <GameHeader headingId="star-dash-end-heading" className="sd-header" leftContent={<><h2 id="star-dash-end-heading" className="sd-title">Star Dash</h2></>} rightContent={<button type="button" className="sd-menu-btn" data-settings-open="true" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>} />
            <p id="end-score-msg" className="sd-completion-msg">Final score: 0</p>
            <div><button id="replay-btn" type="button" className="sd-primary-btn">Play again</button></div>
          </div>
        </GameScreen>
        <GameTabbedModal title="Menu" overlayStyles={modalOverlayStyles} quitHref={homePath} settingsContent={<>
          <SettingsSection title="Audio"><SettingsToggle id="music-enabled-toggle" label="Sound" helpText="Sound is on until you change it." helpId="music-enabled-help" /><SettingsToggle id="sfx-enabled-toggle" label="Effects" helpText="Sound effects on until changed." helpId="sfx-enabled-help" /></SettingsSection>
          <SettingsSection title="Controls"><div className="sd-controls-help"><p><strong>Dash:</strong> Move your body near the glowing stars.</p><p><strong>Streaks:</strong> Catch stars quickly for bonus points.</p></div></SettingsSection>
          <SettingsSection title="Accessibility"><SettingsToggle id="reduce-motion-toggle" label="Reduce motion" helpText="Respects your device setting." helpId="reduce-motion-help" /></SettingsSection>
        </>} infoContent={<>
          <InfoSection title="About Star Dash"><p>{starDashInfo.summary}</p></InfoSection>
          <InfoSection title="Credits">{starDashAttribution.entries.map(e => <InfoAttribution attribution={{ title: e.title, author: e.creator, license: e.license, url: e.sourceUrl, notes: e.notes }} />)}</InfoSection>
        </>} />
      </div>
      <SrOnly id="game-status" ariaLive="polite" ariaAtomic />
      <SrOnly id="game-feedback" ariaLive="assertive" ariaAtomic />
    </Document>,
  )
  return new Response(`<!DOCTYPE html>${html}`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
