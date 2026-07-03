import { describe, expect, it } from 'vitest'
import {
  getCompositionId,
  getRenderDimensions,
  getVideoDimensions
} from './dimensions'

describe('video dimensions', () => {
  it('maps vertical and wide ratios to deterministic dimensions', () => {
    expect(getVideoDimensions('9:16')).toEqual({ width: 1080, height: 1920 })
    expect(getVideoDimensions('16:9')).toEqual({ width: 1920, height: 1080 })
  })

  it('maps vertical and wide ratios to local render dimensions', () => {
    expect(getRenderDimensions('9:16')).toEqual({ width: 1080, height: 1920 })
    expect(getRenderDimensions('16:9')).toEqual({ width: 1920, height: 1080 })
    expect(getRenderDimensions('9:16', 'draft')).toEqual({ width: 1080, height: 1920 })
    expect(getRenderDimensions('16:9', 'draft')).toEqual({ width: 1920, height: 1080 })
  })

  it('creates stable composition ids', () => {
    expect(getCompositionId('PulseCover', '9:16')).toBe('PulseCover-9x16')
    expect(getCompositionId('NeonLyric', '16:9')).toBe('NeonLyric-16x9')
  })
})
