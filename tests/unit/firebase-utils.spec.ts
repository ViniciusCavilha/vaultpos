import { describe, expect, it } from 'vitest'
import {
  numericValue,
  optionalString,
  toDateMillis,
  toIsoString,
  withoutUndefined,
} from '@/firebase/utils'

describe('firebase utilities', () => {
  it('normalizes supported date values', () => {
    const date = new Date('2026-08-19T12:00:00.000Z')

    expect(toIsoString(date)).toBe('2026-08-19T12:00:00.000Z')
    expect(toDateMillis(date.toISOString())).toBe(date.getTime())
  })

  it('removes only undefined fields from Firestore payloads', () => {
    expect(
      withoutUndefined({ name: 'VaultPOS', phone: null, missing: undefined }),
    ).toEqual({ name: 'VaultPOS', phone: null })
  })

  it('normalizes optional strings and numeric values', () => {
    expect(optionalString('value')).toBe('value')
    expect(optionalString('')).toBeNull()
    expect(numericValue(12.5)).toBe(12.5)
    expect(numericValue(Number.NaN, 3)).toBe(3)
  })
})
