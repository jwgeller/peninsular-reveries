import type { FrenzyState, GameState, NpcHippo } from './types.js'

const EMOJI_NAMES: Record<string, string> = {
  '🍒': 'Cherry',
  '🍎': 'Apple',
  '🍊': 'Orange',
  '🍇': 'Grapes',
  '🍋': 'Lemon',
  '🍑': 'Peach',
  '🍓': 'Strawberry',
  '🫐': 'Blueberry',
  '🥝': 'Kiwi',
  '🍌': 'Banana',
}

export function renderScene(state: GameState, container?: HTMLElement): void {
  const el = container ?? document.getElementById('scene-items')
  if (!el) return

  el.innerHTML = ''

  let firstActive = true
  for (const item of state.sceneItems) {
    const btn = document.createElement('button')
    btn.className = 'scene-item'
    btn.dataset.itemId = item.id
    btn.style.left = `${item.x}%`
    btn.style.top = `${item.y}%`
    btn.appendChild(document.createTextNode(item.emoji))

    const badge = document.createElement('span')
    badge.className = 'item-badge'
    badge.textContent = String(item.value)
    btn.appendChild(badge)

    const emojiName = EMOJI_NAMES[item.emoji] ?? item.emoji
    btn.setAttribute('aria-label', `${emojiName} — ${item.value}`)
    btn.tabIndex = firstActive ? 0 : -1
    firstActive = false

    el.appendChild(btn)
  }
}

export function renderProblem(state: GameState): void {
  const el = document.getElementById('problem-prompt')
  if (!el) return

  if (state.currentProblem.area === 'counting' && state.currentProblem.countingObjects?.length) {
    el.innerHTML = ''
    for (const obj of state.currentProblem.countingObjects) {
      const span = document.createElement('span')
      span.className = 'counting-object'
      span.setAttribute('aria-hidden', 'true')
      span.textContent = obj
      el.appendChild(span)
    }
  } else {
    el.textContent = state.currentProblem.prompt
  }
}

export function renderHippo(state: GameState): void {
  const hippoEl = document.getElementById('hippo')
  if (!hippoEl) return

  const color = state.frenzy?.config.playerColor ?? '#8BC34A'
  hippoEl.style.setProperty('--hippo-color', color)
  hippoEl.style.setProperty('--neck-height', '20px')
  hippoEl.style.setProperty('--jaw-angle', '0')
  hippoEl.style.left = '50%'
}

export function renderHUD(state: GameState): void {
  const scoreEl = document.getElementById('score')
  if (scoreEl) scoreEl.textContent = String(state.score)

  const roundEl = document.getElementById('round-progress')
  if (roundEl) roundEl.textContent = `Round ${state.round} of ${state.totalRounds}`

  const livesEl = document.getElementById('lives')
  if (livesEl) {
    const full = Math.max(0, state.lives)
    const empty = Math.max(0, 3 - state.lives)
    livesEl.textContent = '♥'.repeat(full) + '♡'.repeat(empty)
  }

  const streakEl = document.getElementById('streak')
  if (streakEl) {
    if (state.streak >= 2) {
      streakEl.textContent = `${state.streak} 🔥`
      streakEl.hidden = false
    } else {
      streakEl.hidden = true
    }
  }

  const chipEl = document.getElementById('area-chip')
  if (chipEl) chipEl.textContent = `${state.area} · L${state.level}`
}

export function renderEndScreen(state: GameState): void {
  const finalScoreEl = document.getElementById('end-score')
  if (finalScoreEl) finalScoreEl.textContent = String(state.score)

  const accuracyEl = document.getElementById('end-accuracy')
  if (accuracyEl) {
    const accuracy = state.totalRounds > 0
      ? Math.round((state.correctCount / state.totalRounds) * 100)
      : 0
    accuracyEl.textContent = `${accuracy}%`
  }

  const roundsEl = document.getElementById('end-rounds')
  if (roundsEl) roundsEl.textContent = `${state.correctCount} of ${state.totalRounds}`

  const bestStreakEl = document.getElementById('end-streak')
  if (bestStreakEl) bestStreakEl.textContent = String(state.bestStreak)
}

export function renderAll(state: GameState): void {
  renderProblem(state)
  renderHUD(state)
  renderScene(state)
}

// ── Frenzy render helpers ──────────────────────────────────────────────────────

export function renderNpcHippos(npcs: NpcHippo[]): void {
  for (let i = 0; i < 5; i++) {
    const el = document.getElementById(`npc-hippo-${i}`)
    if (!el) continue
    if (i < npcs.length) {
      const npc = npcs[i]
      el.hidden = false
      el.removeAttribute('aria-hidden')
      el.style.setProperty('--hippo-color', npc.color)
      el.style.setProperty('--hippo-x', `${npc.position.x}%`)
      el.dataset.target = String(npc.targetFruitIndex ?? '')
    } else {
      el.hidden = true
      el.setAttribute('aria-hidden', 'true')
    }
  }
}

export function renderRoundTimer(timerMs: number, maxMs: number): void {
  const bar = document.getElementById('round-timer-bar')
  const fill = document.getElementById('round-timer-fill')
  if (!bar || !fill) return

  if (maxMs <= 0) {
    bar.hidden = true
    return
  }

  bar.hidden = false
  const pct = Math.max(0, Math.min(100, (timerMs / maxMs) * 100))
  fill.style.width = `${pct}%`

  if (pct > 50) {
    fill.style.background = '#4CAF50'
  } else if (pct > 25) {
    fill.style.background = '#FFC107'
  } else {
    fill.style.background = '#F44336'
  }
}

export function renderFrenzyScoreboard(state: FrenzyState, playerScore: number): void {
  const el = document.getElementById('frenzy-scoreboard')
  if (!el) return
  el.hidden = false
  el.removeAttribute('aria-hidden')

  if (state.config.teamMode === 'team') {
    el.textContent = `Team A: ${state.teamScores.a}  Team B: ${state.teamScores.b}`
  } else {
    const parts: string[] = [`You: ${playerScore}`]
    for (let i = 0; i < state.npcs.length; i++) {
      parts.push(`H${i + 1}: ${state.npcs[i].score}`)
    }
    el.textContent = parts.join('  \u2022  ')
  }
}

export function renderFrenzyEndScreen(frenzy: FrenzyState, playerScore: number): void {
  const resultEl = document.getElementById('frenzy-result')
  if (!resultEl) return
  resultEl.hidden = false
  resultEl.innerHTML = ''

  const heading = document.getElementById('end-heading')

  const allScores: Array<{ name: string; score: number }> = [
    { name: 'You', score: playerScore },
    ...frenzy.npcs.map((n, i) => ({ name: `Hippo ${i + 1}`, score: n.score })),
  ]
  allScores.sort((a, b) => b.score - a.score)

  const winner = allScores[0]
  if (heading) {
    heading.textContent = winner.name === 'You' ? 'You Win! \ud83c\udfc6' : `${winner.name} Wins!`
  }

  for (const entry of allScores) {
    const row = document.createElement('div')
    row.className = 'frenzy-score-row'
    row.textContent = `${entry.name}: ${entry.score}`
    resultEl.appendChild(row)
  }
}
