import { Application, Container, Graphics } from 'pixi.js'
import type { Bubble, PopParticle } from './types.js'

async function tryCreateApp(container: HTMLElement, preference: 'webgpu' | 'webgl' | 'canvas'): Promise<Application | null> {
  const app = new Application()
  try {
    await app.init({
      preference,
      backgroundAlpha: 0,
      autoDensity: true,
    })
    container.appendChild(app.canvas)
    return app
  } catch {
    return null
  }
}

export async function initStage(canvasContainer: HTMLElement): Promise<Application | null> {
  for (const preference of ['webgpu', 'webgl', 'canvas'] as const) {
    const app = await tryCreateApp(canvasContainer, preference)
    if (!app) continue

    // Health check
    const testG = new Graphics()
    testG.rect(0, 0, 10, 10)
    testG.fill({ color: 0x00ff00 })
    app.stage.addChild(testG)
    app.render()
    app.stage.removeChild(testG)
    testG.destroy()

    return app
  }
  return null
}

export function createBubbleGraphics(bubble: Bubble): Container {
  const container = new Container()
  const g = new Graphics()

  const r = Math.max(1, bubble.radius)
  const hue = bubble.hue

  // Outer ring - rainbow tint
  g.circle(0, 0, r)
  g.stroke({ color: `hsl(${hue}, 80%, 70%)`, width: 2 })
  g.fill({ color: `hsla(${hue}, 70%, 85%, 0.3)` })

  // Shine highlight
  g.circle(-r * 0.3, -r * 0.3, r * 0.2)
  g.fill({ color: 0xffffff, alpha: 0.6 })

  // Bottom reflection
  g.circle(r * 0.15, r * 0.25, r * 0.1)
  g.fill({ color: 0xffffff, alpha: 0.3 })

  container.addChild(g)
  container.x = bubble.x
  container.y = bubble.y

  return container
}

export function updateBubbleGraphics(container: Container, bubble: Bubble): void {
  container.x = bubble.x
  container.y = bubble.y

  const scale = bubble.popping ? 1 + bubble.popProgress * 0.5 : 1
  container.scale.set(scale)
  container.alpha = bubble.popping ? 1 - bubble.popProgress : Math.min(1, bubble.age / 500)

  // Wobble
  const wobbleX = Math.sin(bubble.wobblePhase) * 2
  container.x += wobbleX
}

export function createParticleGraphics(particle: PopParticle): Graphics {
  const g = new Graphics()
  const color = particle.hue < 0 ? 0xffffff : hueToHex(particle.hue)
  const r = Math.max(1, particle.size * (1 - (particle.maxLife - particle.life) / particle.maxLife))
  g.circle(0, 0, r)
  g.fill({ color, alpha: 0.8 })
  g.x = particle.x
  g.y = particle.y
  return g
}

export function updateParticleGraphics(g: Graphics, particle: PopParticle): void {
  g.x = particle.x
  g.y = particle.y
  const lifeRatio = particle.life / particle.maxLife
  g.alpha = lifeRatio
  const r = Math.max(0.5, particle.size * lifeRatio)
  g.clear()
  const color = particle.hue < 0 ? 0xffffff : hueToHex(particle.hue)
  g.circle(0, 0, r)
  g.fill({ color, alpha: Math.max(0, lifeRatio) })
}

function hueToHex(hue: number): number {
  // Simple HSL to hex approximation
  const h = ((hue % 360) + 360) % 360
  const s = 0.8
  const l = 0.7
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }
  const ri = Math.round((r + m) * 255)
  const gi = Math.round((g + m) * 255)
  const bi = Math.round((b + m) * 255)
  return (ri << 16) | (gi << 8) | bi
}