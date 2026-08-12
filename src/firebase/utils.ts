import { Timestamp } from 'firebase/firestore'

export type FirebaseRecord = Record<string, unknown>

export function toIsoString(
  value: unknown,
  fallback = new Date().toISOString(),
): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value

  if (value && typeof value === 'object' && 'toDate' in value) {
    const candidate = value as { toDate?: () => Date }
    if (typeof candidate.toDate === 'function') {
      return candidate.toDate().toISOString()
    }
  }

  return fallback
}

export function toDateMillis(value: unknown): number {
  return new Date(toIsoString(value, new Date(0).toISOString())).getTime()
}

export function withoutUndefined<T extends FirebaseRecord>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, field]) => field !== undefined),
  ) as T
}

export function optionalString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

export function numericValue(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}
