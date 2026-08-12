import type { Timestamp } from 'firebase/firestore'

export function toIsoString(value: unknown): string {
  if (typeof value === 'string') return value
  if (value instanceof Date) return value.toISOString()
  if (value && typeof value === 'object' && 'toDate' in value) {
    const date = (value as Timestamp).toDate()
    return date.toISOString()
  }
  return ''
}

export function cleanData(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined))
}

export function compareIsoDesc(a: string, b: string) {
  return Date.parse(b || '') - Date.parse(a || '')
}
