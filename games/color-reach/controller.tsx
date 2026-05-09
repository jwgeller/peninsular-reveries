import * as React from '@remix-run/ui'
import { renderToString } from '@remix-run/ui/server'
import { getSiteBasePath } from '../../app/site-config.js'
import { withBasePath } from '../../app/site-paths.js'
import { Document } from '../../app/ui/document.js'
import { GameHeader, GameScreen, GameTabbedModal, InfoAttribution, InfoSection, SettingsSection, SettingsToggle, SrOnly } from '../../app/ui/game-shell.js'
import { colorReachAttribution } from './attributions.js'
import { colorReachInfo } from './info.js'

const modalOverlayStyles = { zIndex: 100, background: 'rgba(6, 6, 18, 0.92)' }

export async function colorReachAction() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)
  const html = await renderToString(
    <Document title="Color Reach" description="Reach for matching color zones with your camera! Learn colors through movement." path="/color-reach/" includeNav={false} includeFooter={false} includeDefaultStyles={false} stylesheets={['/styles/color-reach.css']} scripts={['/client/color-reach/main.js?v=__BUILD_SHA__']} bodyClass="color-reach-game" viewportFitCover faviconPath="/favicon.svg" manifestPath="/color-reach/manifest.json" serviceWorkerPath="/color-reach/sw.js" serviceWorkerScope="/color-reach/">
      <div className="scene-track">
        <GameScreen id="start-screen" className="active" labelledBy="color-reach-title" padded>
          <div className="cr-screen-panel cr-start-panel">
            <GameHeader headingId="color-reach-title" className="cr-header" leftContent={<><h1 id="color-reach-title" className="cr-title">Color Reach</h1></>} rightContent={<button type="button" className="cr-menu-btn" data-settings-open="true" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>} />
            <p className="cr-subtitle">Reach for the matching color zone!</p>
            <div className="cr-pose-list"><p className="cr-pose-list-title">How to play:</p><div className="cr-pose-chips">
              <span className="cr-pose-chip">🎨 Move near the glowing zones</span>
              <span className="cr-pose-chip">⭐ Build streaks for bonus points</span>
              <span className="cr-pose-chip">🌈 Learn colors through play</span>
              <span className="cr-pose-chip">⏱️ Reach before they fade!</span>
            </div></div>
            <div className="cr-camera-prompt" id="camera-denied-msg"><p>Camera access is required for motion tracking.</p></div>
            <div id="start-controls"><button id="start-btn" type="button" className="cr-primary-btn">Start</button></div>
          </div>
        </GameScreen>
        <GameScreen id="game-screen" labelledBy="color-reach-game-heading">
          <div className="cr-screen-panel cr-game-panel">
            <GameHeader headingId="color-reach-game-heading" className="cr-header" leftContent={<><h2 id="color-reach-game-heading" className="cr-title cr-title-small">Color Reach</h2></>} rightContent={<button type="button" className="cr-menu-btn" data-settings-open="true" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>} />
            <div className="cr-hud">
              <span className="cr-hud-item" id="score-display">Score: 0</span>
              <span className="cr-hud-item" id="color-display">Find: Red</span>
            </div>
            <div className="cr-floor">
              <video id="camera-preview" autoPlay playsInline muted aria-label="Camera preview" />
              <div id="pixi-stage" aria-hidden="true" />
            </div>
          </div>
        </GameScreen>
        <GameScreen id="end-screen" labelledBy="color-reach-end-heading" padded>
          <div className="cr-screen-panel cr-end-panel">
            <GameHeader headingId="color-reach-end-heading" className="cr-header" leftContent={<><h2 id="color-reach-end-heading" className="cr-title">Color Reach</h2></>} rightContent={<button type="button" className="cr-menu-btn" data-settings-open="true" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>} />
            <p id="end-score-msg" className="cr-completion-msg">Final score: 0</p>
            <div><button id="replay-btn" type="button" className="cr-primary-btn">Play again</button></div>
          </div>
        </GameScreen>
        <GameTabbedModal title="Menu" overlayStyles={modalOverlayStyles} quitHref={homePath} settingsContent={<>
          <SettingsSection title="Audio"><SettingsToggle id="music-enabled-toggle" label="Sound" helpText="Sound is on until you change it here." helpId="music-enabled-help" /><SettingsToggle id="sfx-enabled-toggle" label="Effects" helpText="Sound effects on until changed." helpId="sfx-enabled-help" /></SettingsSection>
          <SettingsSection title="Controls"><div className="cr-controls-help"><p><strong>Reach:</strong> Move your body to touch glowing color zones.</p><p><strong>Streaks:</strong> Reach targets quickly for bonus points.</p></div></SettingsSection>
          <SettingsSection title="Accessibility"><SettingsToggle id="reduce-motion-toggle" label="Reduce motion" helpText="Respects your device setting." helpId="reduce-motion-help" /></SettingsSection>
        </>} infoContent={<>
          <InfoSection title="About Color Reach"><p>{colorReachInfo.summary}</p></InfoSection>
          <InfoSection title="Credits">{colorReachAttribution.entries.map(e => <InfoAttribution attribution={{ title: e.title, author: e.creator, license: e.license, url: e.sourceUrl, notes: e.notes }} />)}</InfoSection>
        </>} />
      </div>
      <SrOnly id="game-status" ariaLive="polite" ariaAtomic />
      <SrOnly id="game-feedback" ariaLive="assertive" ariaAtomic />
    </Document>,
  )
  return new Response(`<!DOCTYPE html>${html}`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}