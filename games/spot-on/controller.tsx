import * as React from '@remix-run/component'
import { renderToString } from '@remix-run/component/server'

import { getSiteBasePath } from '../../app/site-config.js'
import { withBasePath } from '../../app/site-paths.js'
import { Document } from '../../app/ui/document.js'
import {
  GameHeader,
  GameScreen,
  GameTabbedModal,
  InfoSection,
  InfoAttribution,
  SettingsSection,
  SettingsToggle,
  SrOnly,
} from '../../app/ui/game-shell.js'

import { spotOnAttribution } from './attributions.js'
import { spotOnInfo } from './info.js'

export async function spotOnAction() {
  const siteBasePath = getSiteBasePath()
  const homePath = withBasePath('/', siteBasePath)

  const html = await renderToString(
    <Document
      title="Spot On"
      description="Tidy up cozy rooms by picking up items and finding a spot for each one — your way, no wrong answers."
      path="/spot-on/"
      includeNav={false}
      includeFooter={false}
      includeDefaultStyles={false}
      stylesheets={['/styles/spot-on.css']}
      scripts={['/client/spot-on/main.js']}
      bodyClass="spot-on"
      viewportFitCover
      faviconPath="/favicon-game-spot-on.svg"
      manifestPath="/spot-on/manifest.json"
      serviceWorkerPath="/spot-on/sw.js"
      serviceWorkerScope="/spot-on/"
    >
      <GameScreen
        id="start-screen"
        className="active spot-on-screen spot-on-screen--start"
        labelledBy="spot-on-title"
      >
        <div className="spot-on-panel spot-on-panel--start">
          <GameHeader
            headingId="spot-on-title"
            className="spot-on-header"
            leftContent={<h1 id="spot-on-title" className="spot-on-title">Spot On</h1>}
            rightContent={<button
              type="button"
              className="spot-on-menu-btn"
              data-settings-open="true"
              aria-haspopup="dialog"
              aria-controls="settings-modal"
              aria-expanded="false"
            >
              Menu
            </button>}
          />

          <div className="spot-on-start-body">
            <p className="spot-on-subtitle">Pick up items. Put them away. Your room, your way.</p>
            <button id="start-btn" type="button" className="spot-on-primary-btn">Start</button>
          </div>
        </div>
      </GameScreen>

      <GameScreen
        id="game-screen"
        className="spot-on-screen spot-on-screen--game"
        labelledBy="spot-on-game-heading"
      >
        <div className="spot-on-panel spot-on-panel--game">
          <GameHeader
            headingId="spot-on-game-heading"
            className="spot-on-header"
            leftContent={<h2 id="spot-on-game-heading" className="spot-on-title spot-on-title--small">Spot On</h2>}
            rightContent={<button
              type="button"
              className="spot-on-menu-btn"
              data-settings-open="true"
              aria-haspopup="dialog"
              aria-controls="settings-modal"
              aria-expanded="false"
            >
              Menu
            </button>}
          />

          <div id="room-scene" className="room-scene" role="group" aria-label="Room scene">
            <div id="completion-msg" className="completion-msg completion-msg--hidden" aria-live="assertive" aria-atomic="true">
              All tidy! ✨
            </div>
          </div>

          <div id="room-status" className="room-status" aria-live="polite" aria-atomic="true">
            Items placed: 0 / 5
          </div>

          <button
            id="new-room-btn"
            type="button"
            className="spot-on-new-room-btn"
          >
            New Room
          </button>
        </div>
      </GameScreen>

      <GameTabbedModal
        title="Spot On"
        quitHref={homePath}
        settingsContent={<>
          <SettingsSection title="Audio">
            <SettingsToggle
              id="sfx-enabled-toggle"
              label="Sound effects"
              helpText="Sound effects are on until you change them here."
              helpId="sfx-enabled-help"
            />
          </SettingsSection>

          <SettingsSection title="Accessibility">
            <SettingsToggle
              id="reduce-motion-toggle"
              label="Reduce motion"
              helpText="Reduce motion is off until you change it here."
              helpId="reduce-motion-help"
            />
          </SettingsSection>
        </>}
        infoContent={<>
          <InfoSection title="About Spot On">
            <p>{spotOnInfo.summary}</p>
          </InfoSection>
          <InfoSection title="Credits">
            {spotOnAttribution.entries.map((entry) => <InfoAttribution attribution={{
              title: entry.title,
              author: entry.creator,
              license: entry.license,
              url: entry.sourceUrl,
              notes: entry.notes,
            }} />)}
          </InfoSection>
        </>}
      />

      <SrOnly id="game-status" ariaLive="polite" ariaAtomic />
      <SrOnly id="game-feedback" ariaLive="assertive" ariaAtomic />

      <noscript>
        <div className="spot-on-noscript">
          <p>Spot On needs JavaScript for the room scene, audio, and input. Turn JavaScript on and reload to play.</p>
        </div>
      </noscript>
    </Document>,
  )

  return new Response(`<!DOCTYPE html>${html}`, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}