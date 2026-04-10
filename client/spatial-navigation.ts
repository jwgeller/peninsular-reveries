export type NavigationDirection = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'

export interface SpatialNavigationTarget {
  readonly x: number
  readonly y: number
}

interface DirectionalMetrics {
  readonly crossAxisDistance: number
  readonly primaryDistance: number
  readonly totalDistance: number
  readonly score: number
}

const MIN_DIRECTIONAL_DISTANCE = 10
const CROSS_AXIS_WEIGHT = 1.5
const ANGLE_PENALTY_WEIGHT = 24

export function getDirectionalMetrics(
  dx: number,
  dy: number,
  direction: NavigationDirection,
): DirectionalMetrics | null {
  let crossAxisDistance = 0
  let primaryDistance = 0

  switch (direction) {
    case 'ArrowUp':
      if (dy >= -MIN_DIRECTIONAL_DISTANCE) return null
      crossAxisDistance = Math.abs(dx)
      primaryDistance = -dy
      break
    case 'ArrowDown':
      if (dy <= MIN_DIRECTIONAL_DISTANCE) return null
      crossAxisDistance = Math.abs(dx)
      primaryDistance = dy
      break
    case 'ArrowLeft':
      if (dx >= -MIN_DIRECTIONAL_DISTANCE) return null
      crossAxisDistance = Math.abs(dy)
      primaryDistance = -dx
      break
    case 'ArrowRight':
      if (dx <= MIN_DIRECTIONAL_DISTANCE) return null
      crossAxisDistance = Math.abs(dy)
      primaryDistance = dx
      break
  }

  const totalDistance = Math.hypot(dx, dy)
  const anglePenalty = (crossAxisDistance / Math.max(primaryDistance, 1)) * ANGLE_PENALTY_WEIGHT

  return {
    crossAxisDistance,
    primaryDistance,
    totalDistance,
    score: primaryDistance + (crossAxisDistance * CROSS_AXIS_WEIGHT) + anglePenalty,
  }
}

export function findNearestDirectionalTarget<T extends SpatialNavigationTarget>(
  current: SpatialNavigationTarget,
  candidates: readonly T[],
  direction: NavigationDirection,
): T | null {
  let best: T | null = null
  let bestMetrics: DirectionalMetrics | null = null

  for (const candidate of candidates) {
    const dx = candidate.x - current.x
    const dy = candidate.y - current.y
    const metrics = getDirectionalMetrics(dx, dy, direction)

    if (!metrics) continue

    if (
      !bestMetrics
      || metrics.score < bestMetrics.score
      || (
        metrics.score === bestMetrics.score
        && (
          metrics.crossAxisDistance < bestMetrics.crossAxisDistance
          || (
            metrics.crossAxisDistance === bestMetrics.crossAxisDistance
            && (
              metrics.primaryDistance < bestMetrics.primaryDistance
              || (
                metrics.primaryDistance === bestMetrics.primaryDistance
                && metrics.totalDistance < bestMetrics.totalDistance
              )
            )
          )
        )
      )
    ) {
      best = candidate
      bestMetrics = metrics
    }
  }

  return best
}