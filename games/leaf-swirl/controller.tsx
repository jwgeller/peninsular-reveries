import * as React from '@remix-run/ui'
import { renderToString } from '@remix-run/ui/server'
import { getSiteBasePath } from '../../app/site-config.js'
import { withBasePath } from '../../app/site-paths.js'
import { Document } from '../../app/ui/document.js'
import { GameHeader, GameScreen, GameTabbedModal, InfoAttribution, InfoSection, SettingsSection, SettingsToggle, SrOnly } from '../../app/ui/game-shell.js'
import { leafSwirlAttribution } from './attributions.js'
import { leafSwirlInfo } from './info.js'

const modalOverlayStyles = { zIndex: 100, background: 'rgba(6, 6, 18, 0.92)' }

export async function leafSwirlAction() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)
  const html = await renderToString(
    <Document title="Leaf Swirl" description="Blow autumn leaves around with your camera! Creative wind simulation." path="/leaf-swirl/" includeNav={false} includeFooter={false} includeDefaultStyles={false} stylesheets={['/styles/leaf-swirl.css']} scripts={['/client/leaf-swirl/main.js?v=__BUILD_SHA__']} bodyClass="leaf-swirl-game" viewportFitCover faviconPath="/favicon.svg" manifestPath="/leaf-swirl/manifest.json" serviceWorkerPath="/leaf-swirl/sw.js" serviceWorkerScope="/leaf-swirl/">
      <div className="scene-track">
        <GameScreen id="start-screen" className="active" labelledBy="leaf-swirl-title" padded>
          <div className="ls-screen-panel ls-start-panel">
            <GameHeader headingId="leaf-swirl-title" className="ls-header" leftContent={<><h1 id="leaf-swirl-title" className="ls-title">Leaf Swirl</h1></>} rightContent={<button type="button" className="ls-menu-btn" data-settings-open="true" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>} />
            <p className="ls-subtitle">Blow autumn leaves with your body!</p>
            <div className="ls-pose-list"><p className="ls-pose-list-title">How to play:</p><div className="ls-pose-chips">
              <span className="ls-pose-chip">🍂 Move to create wind</span>
              <span className="ls-pose-chip">💨 Watch leaves swirl and dance</span>
              <span className="ls-pose-chip">🍁 Leaves settle on the ground</span>
              <span className="ls-pose-chip">✨ No right or wrong — just play!</span>
            </div></div>
            <div className="ls-camera-prompt" id="camera-denied-msg"><p>Camera access is required for motion tracking.</p></div>
            <div id="start-controls"><button id="start-btn" type="button" className="ls-primary-btn">Start</button></div>
          </div>
        </GameScreen>
        <GameScreen id="game-screen" labelledBy="leaf-swirl-game-heading">
          <div className="ls-screen-panel ls-game-panel">
            <GameHeader headingId="leaf-swirl-game-heading" className="ls-header" leftContent={<><h2 id="leaf-swirl-game-heading" className="ls-title ls-title-small">Leaf Swirl</h2></>} rightContent={<button type="button" className="ls-menu-btn" data-settings-open="true" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>} />
            <div className="ls-hud"><span className="ls-hud-item" id="swirl-display">Leaves: 0</span></div>
            <div className="ls-floor">
              <video id="camera-preview" autoPlay playsInline muted aria-label="Camera preview" />
              <div id="pixi-stage" aria-hidden="true" />
            </div>
          </div>
        </GameScreen>
        <GameScreen id="end-screen" labelledBy="leaf-swirl-end-heading" padded>
          <div className="ls-screen-panel ls-end-panel">
            <GameHeader headingId="leaf-swirl-end-heading" className="ls-header" leftContent={<><h2 id="leaf-swirl-end-heading" className="ls-title">Leaf Swirl</h2></>} rightContent={<button type="button" className="ls-menu-btn" data-settings-open="true" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>} />
            <p id="end-score-msg" className="ls-completion-msg">Beautiful swirling!</p>
            <div><button id="replay-btn" type="button" className="ls-primary-btn">Play again</button></div>
          </div>
        </GameScreen>
        <GameTabbedModal title="Menu" overlayStyles={modalOverlayStyles} quitHref={homePath} settingsContent={<>
          <SettingsSection title="Audio"><SettingsToggle id="music-enabled-toggle" label="Sound" helpText="Sound is on until you change it." helpId="music-enabled-help" /><SettingsToggle id="sfx-enabled-toggle" label="Effects" helpText="Sound effects on until changed." helpId="sfx-enabled-help" /></SettingsSection>
          <SettingsSection title="Controls"><div className="ls-controls-help"><p><strong>Blow:</strong> Move your body to create wind currents.</p><p><strong>No goal:</strong> Just enjoy the swirling leaves!</p></div></SettingsSection>
          <SettingsSection title="Accessibility"><SettingsToggle id="reduce-motion-toggle" label="Reduce motion" helpText="Respects your device setting." helpId="reduce-motion-help" /></SettingsSection>
        </>} infoContent={<>
          <InfoSection title="About Leaf Swirl"><p>{leafSwirlInfo.summary}</p></InfoSection>
          <InfoSection title="Credits">{leafSwirlAttribution.entries.map(e => <InfoAttribution attribution={{ title: e.title, author: e.creator, license: e.license, url: e.sourceUrl, notes: e.notes }} />)}</InfoSection>
        </>} />
      </div>
      <SrOnly id="game-status" ariaLive="polite" ariaAtomic />
      <SrOnly id="game-feedback" ariaLive="assertive" ariaAtomic />
    </Document>,
  )
  return new Response(`<!DOCTYPE html>${html}`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
