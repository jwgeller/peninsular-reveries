import * as React from '@remix-run/ui'
import { renderToString } from '@remix-run/ui/server'
import { getSiteBasePath } from '../../app/site-config.js'
import { withBasePath } from '../../app/site-paths.js'
import { Document } from '../../app/ui/document.js'
import { GameHeader, GameScreen, GameTabbedModal, InfoAttribution, InfoSection, SettingsSection, SettingsToggle, SrOnly } from '../../app/ui/game-shell.js'
import { jellyWobbleAttribution } from './attributions.js'
import { jellyWobbleInfo } from './info.js'

const modalOverlayStyles = { zIndex: 100, background: 'rgba(6, 6, 18, 0.92)' }

export async function jellyWobbleAction() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)
  const html = await renderToString(
    <Document title="Jelly Wobble" description="Wobble a big jelly with your body! Sensory physics play." path="/jelly-wobble/" includeNav={false} includeFooter={false} includeDefaultStyles={false} stylesheets={['/styles/jelly-wobble.css']} scripts={['/client/jelly-wobble/main.js?v=__BUILD_SHA__']} bodyClass="jelly-wobble-game" viewportFitCover faviconPath="/favicon.svg" manifestPath="/jelly-wobble/manifest.json" serviceWorkerPath="/jelly-wobble/sw.js" serviceWorkerScope="/jelly-wobble/">
      <div className="scene-track">
        <GameScreen id="start-screen" className="active" labelledBy="jelly-wobble-title" padded>
          <div className="jw-screen-panel jw-start-panel">
            <GameHeader headingId="jelly-wobble-title" className="jw-header" leftContent={<><h1 id="jelly-wobble-title" className="jw-title">Jelly Wobble</h1></>} rightContent={<button type="button" className="jw-menu-btn" data-settings-open="true" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>} />
            <p className="jw-subtitle">Push and squish the jelly!</p>
            <div className="jw-pose-list"><p className="jw-pose-list-title">How to play:</p><div className="jw-pose-chips">
              <span className="jw-pose-chip">🫠 Move near the jelly to push it</span>
              <span className="jw-pose-chip">💥 Watch it wobble and bounce!</span>
              <span className="jw-pose-chip">✨ Sparkles fly when it squishes</span>
              <span className="jw-pose-chip">🎵 No wrong way to play</span>
            </div></div>
            <div className="jw-camera-prompt" id="camera-denied-msg"><p>Camera access is required for motion tracking.</p></div>
            <div id="start-controls"><button id="start-btn" type="button" className="jw-primary-btn">Start</button></div>
          </div>
        </GameScreen>
        <GameScreen id="game-screen" labelledBy="jelly-wobble-game-heading">
          <div className="jw-screen-panel jw-game-panel">
            <GameHeader headingId="jw-wobble-game-heading" className="jw-header" leftContent={<><h2 id="jelly-wobble-game-heading" className="jw-title jw-title-small">Jelly Wobble</h2></>} rightContent={<button type="button" className="jw-menu-btn" data-settings-open="true" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>} />
            <div className="jw-hud"><span className="jw-hud-item" id="score-display">Wobble: 0</span></div>
            <div className="jw-floor">
              <video id="camera-preview" autoPlay playsInline muted aria-label="Camera preview" />
              <div id="pixi-stage" aria-hidden="true" />
            </div>
          </div>
        </GameScreen>
        <GameScreen id="end-screen" labelledBy="jelly-wobble-end-heading" padded>
          <div className="jw-screen-panel jw-end-panel">
            <GameHeader headingId="jelly-wobble-end-heading" className="jw-header" leftContent={<><h2 id="jelly-wobble-end-heading" className="jw-title">Jelly Wobble</h2></>} rightContent={<button type="button" className="jw-menu-btn" data-settings-open="true" aria-haspopup="dialog" aria-controls="settings-modal" aria-expanded="false">Menu</button>} />
            <p id="end-score-msg" className="jw-completion-msg">Great wobbling!</p>
            <div><button id="replay-btn" type="button" className="jw-primary-btn">Play again</button></div>
          </div>
        </GameScreen>
        <GameTabbedModal title="Menu" overlayStyles={modalOverlayStyles} quitHref={homePath} settingsContent={<>
          <SettingsSection title="Audio"><SettingsToggle id="music-enabled-toggle" label="Sound" helpText="Sound is on until you change it." helpId="music-enabled-help" /><SettingsToggle id="sfx-enabled-toggle" label="Effects" helpText="Sound effects on until changed." helpId="sfx-enabled-help" /></SettingsSection>
          <SettingsSection title="Controls"><div className="jw-controls-help"><p><strong>Wobble:</strong> Move near the jelly to push it.</p><p><strong>No goal:</strong> Just enjoy the wobble!</p></div></SettingsSection>
          <SettingsSection title="Accessibility"><SettingsToggle id="reduce-motion-toggle" label="Reduce motion" helpText="Respects your device setting." helpId="reduce-motion-help" /></SettingsSection>
        </>} infoContent={<>
          <InfoSection title="About Jelly Wobble"><p>{jellyWobbleInfo.summary}</p></InfoSection>
          <InfoSection title="Credits">{jellyWobbleAttribution.entries.map(e => <InfoAttribution attribution={{ title: e.title, author: e.creator, license: e.license, url: e.sourceUrl, notes: e.notes }} />)}</InfoSection>
        </>} />
      </div>
      <SrOnly id="game-status" ariaLive="polite" ariaAtomic />
      <SrOnly id="game-feedback" ariaLive="assertive" ariaAtomic />
    </Document>,
  )
  return new Response(`<!DOCTYPE html>${html}`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
